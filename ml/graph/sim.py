"""Accessibility simulation on the road graph.

Accessibility A = population-weighted mean travel time (minutes) from every node to the nearest
facility of each kind, combined with facility weights. Lower is better. Damage on a segment
multiplies its travel time. Impact of a segment = increase of A when that segment alone is damaged.
"""
from dataclasses import dataclass

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import dijkstra

from . import config as C

DAMAGE_FACTOR = {"low": 1.5, "mid": 2.5, "high": 5.0}
UNREACHABLE_MIN = 60.0  # travel time assigned to origins that cannot reach a facility kind
COST_IDR_PER_M = {"utama": 1_200_000, "lingkungan": 600_000}  # rough repair cost assumption
METERS_PER_DAY = 150  # rough crew throughput assumption

ASSUMPTIONS = [
    "Travel time uses assumed free-flow speeds per OSM road class.",
    "Damage multiplies segment travel time: low x1.5, mid x2.5, high x5.",
    "Population proxy = OSM buildings assigned to the nearest graph node.",
    "Repair cost: Rp1.2 juta/m for main roads, Rp600 ribu/m for local roads (rough assumption).",
    "Duration: one crew repairs about 150 m per day (rough assumption).",
]


@dataclass
class Network:
    node_index: dict            # node_id -> row
    pop: np.ndarray             # population weight per node
    seg_ids: np.ndarray         # segment ids, aligned with u/v/base
    u: np.ndarray
    v: np.ndarray
    base: np.ndarray            # base travel minutes per segment
    length_m: np.ndarray
    road_group: np.ndarray
    sources: dict               # facility kind -> array of node rows
    seg_pos: dict               # segment id -> position

    @classmethod
    def from_frames(cls, nodes: pd.DataFrame, segments: pd.DataFrame, facilities: pd.DataFrame) -> "Network":
        node_index = {nid: i for i, nid in enumerate(nodes["node_id"].to_numpy())}
        u = segments["u"].map(node_index).to_numpy()
        v = segments["v"].map(node_index).to_numpy()
        sources = {
            kind: np.unique(facilities.loc[facilities["kind"] == kind, "node_id"].map(node_index).dropna().astype(int))
            for kind in C.FACILITY_WEIGHT
        }
        seg_ids = segments["segment_id"].to_numpy()
        return cls(
            node_index=node_index,
            pop=nodes["population"].to_numpy(dtype=float),
            seg_ids=seg_ids,
            u=u, v=v,
            base=np.maximum(segments["travel_min"].to_numpy(dtype=float), 1e-3),
            length_m=segments["length_m"].to_numpy(dtype=float),
            road_group=segments["road_group"].to_numpy(),
            sources={k: s for k, s in sources.items() if len(s)},
            seg_pos={sid: i for i, sid in enumerate(seg_ids)},
        )

    @property
    def n(self) -> int:
        return len(self.pop)

    def matrix(self, weights: np.ndarray) -> csr_matrix:
        # Parallel edges collapse to the minimum when building a csr from duplicates is avoided:
        # scipy sums duplicates, so take the minimum explicitly first.
        a, b = np.minimum(self.u, self.v), np.maximum(self.u, self.v)
        df = pd.DataFrame({"a": a, "b": b, "w": weights}).groupby(["a", "b"], as_index=False)["w"].min()
        return csr_matrix((df["w"].to_numpy(), (df["a"].to_numpy(), df["b"].to_numpy())), shape=(self.n, self.n))

    def distances(self, weights: np.ndarray) -> dict:
        m = self.matrix(weights)
        out = {}
        for kind, src in self.sources.items():
            d = dijkstra(m, directed=False, indices=src, min_only=True)
            out[kind] = np.minimum(d, UNREACHABLE_MIN)
        return out

    def accessibility(self, weights: np.ndarray) -> tuple[float, dict]:
        dist = self.distances(weights)
        total_pop = self.pop.sum() or 1.0
        by_kind = {k: float((d * self.pop).sum() / total_pop) for k, d in dist.items()}
        wsum = sum(C.FACILITY_WEIGHT[k] for k in by_kind)
        return float(sum(C.FACILITY_WEIGHT[k] * v for k, v in by_kind.items()) / wsum), by_kind

    def weights_with(self, damage: dict) -> np.ndarray:
        """damage: segment id -> multiplier."""
        w = self.base.copy()
        for sid, factor in damage.items():
            pos = self.seg_pos.get(sid)
            if pos is not None:
                w[pos] = self.base[pos] * factor
        return w


def single_segment_impact(net: Network, factor: float = DAMAGE_FACTOR["high"]) -> np.ndarray:
    """Increase of accessibility (minutes) when each segment alone is damaged.

    Only segments on a shortest-path tree can change any distance, so the others are exactly 0
    and are skipped. Returns an array aligned with net.seg_ids.
    """
    base_A, _ = net.accessibility(net.base)
    m = net.matrix(net.base)
    tight = np.zeros(len(net.seg_ids), dtype=bool)
    for src in net.sources.values():
        d = dijkstra(m, directed=False, indices=src, min_only=True)
        du, dv = d[net.u], d[net.v]
        tight |= np.isclose(np.abs(du - dv), net.base, rtol=1e-9, atol=1e-9) & np.isfinite(du) & np.isfinite(dv)

    impact = np.zeros(len(net.seg_ids))
    for i in np.flatnonzero(tight):
        w = net.base.copy()
        w[i] *= factor
        A, _ = net.accessibility(w)
        impact[i] = max(A - base_A, 0.0)
    return impact


def impact_to_score(impact: np.ndarray) -> np.ndarray:
    """Rank-normalise raw impact to 0..100; segments with no impact get 0."""
    score = np.zeros(len(impact))
    pos = impact > 0
    if pos.any():
        ranks = pd.Series(impact[pos]).rank(pct=True).to_numpy()
        score[pos] = np.round(ranks * 100, 2)
    return score


def whatif(net: Network, damage: dict, repairs: list[str]) -> dict:
    baseline_A, _ = net.accessibility(net.base)
    before_A, before_kind = net.accessibility(net.weights_with(damage))
    remaining = {sid: f for sid, f in damage.items() if sid not in set(repairs)}
    after_A, after_kind = net.accessibility(net.weights_with(remaining))
    repaired = [net.seg_pos[s] for s in repairs if s in net.seg_pos]
    length = float(net.length_m[repaired].sum()) if repaired else 0.0
    cost = sum(net.length_m[p] * COST_IDR_PER_M[net.road_group[p]] for p in repaired)
    gap = before_A - baseline_A
    return {
        "damaged_segments": len(damage),
        "accessibility_before": round(before_A, 4),
        "accessibility_after": round(after_A, 4),
        "accessibility_baseline": round(baseline_A, 4),
        "improvement_pct": round(100 * (before_A - after_A) / gap, 2) if gap > 1e-9 else 0.0,
        "by_facility": {k: {"before": round(before_kind[k], 4), "after": round(after_kind[k], 4)} for k in before_kind},
        "people_weight_regained": round(float(net.pop.sum()) * (before_A - after_A), 1),
        "cost_estimate_idr": int(round(cost, -5)),
        "duration_days": int(np.ceil(length / METERS_PER_DAY)) if length else 0,
        "assumptions": ASSUMPTIONS,
    }


def recommend(net: Network, damage: dict, budget_idr: float | None = None) -> dict:
    """Order damaged segments by individual accessibility gain per rupiah."""
    current_A, _ = net.accessibility(net.weights_with(damage))
    rows = []
    for sid in damage:
        pos = net.seg_pos.get(sid)
        if pos is None:
            continue
        rest = {s: f for s, f in damage.items() if s != sid}
        A, _ = net.accessibility(net.weights_with(rest))
        cost = float(net.length_m[pos] * COST_IDR_PER_M[net.road_group[pos]])
        rows.append({"segment_id": sid, "gain_minutes": max(current_A - A, 0.0), "cost_idr": cost})
    rows.sort(key=lambda r: r["gain_minutes"] / max(r["cost_idr"], 1.0), reverse=True)
    order, cumulative = [], 0.0
    for r in rows:
        if budget_idr is not None and cumulative + r["cost_idr"] > budget_idr:
            continue
        cumulative += r["cost_idr"]
        order.append({
            "segment_id": r["segment_id"],
            "gain_minutes": round(r["gain_minutes"], 5),
            "cost_idr": int(round(r["cost_idr"], -5)),
            "cumulative_cost_idr": int(round(cumulative, -5)),
        })
    return {"order": order, "assumptions": ASSUMPTIONS}
