"""Accessibility simulation on the road graph.

Accessibility A = population-weighted mean travel time (minutes) from every node to the nearest
facility of each kind, combined with facility weights. Lower is better. Damage on a segment
multiplies its travel time. Impact of a segment = increase of A when that segment alone is damaged.
"""
from dataclasses import dataclass, field

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


MAX_NODE_CHANGES = 3000


@dataclass
class Network:
    node_index: dict            # node_id -> row
    pop: np.ndarray             # population weight per node
    lon: np.ndarray             # node coordinates (NaN when unknown)
    lat: np.ndarray
    seg_ids: np.ndarray         # segment ids, aligned with u/v/base
    u: np.ndarray
    v: np.ndarray
    base: np.ndarray            # base travel minutes per segment
    length_m: np.ndarray
    road_group: np.ndarray
    sources: dict               # facility kind -> array of node rows
    seg_pos: dict               # segment id -> position
    # Sparse structure built once: parallel segments collapse into one node pair (minimum weight),
    # and each pair owns one slot in the CSR data array, so only weights change between runs.
    pair_of_seg: np.ndarray = field(repr=False, default=None)
    slot_of_pair: np.ndarray = field(repr=False, default=None)
    template: csr_matrix = field(repr=False, default=None)
    _base_eval: tuple = field(repr=False, default=None)

    @classmethod
    def from_frames(cls, nodes: pd.DataFrame, segments: pd.DataFrame, facilities: pd.DataFrame) -> "Network":
        node_index = {nid: i for i, nid in enumerate(nodes["node_id"].to_numpy())}
        n = len(node_index)
        u = segments["u"].map(node_index).to_numpy()
        v = segments["v"].map(node_index).to_numpy()
        sources = {
            kind: np.unique(facilities.loc[facilities["kind"] == kind, "node_id"].map(node_index).dropna().astype(int))
            for kind in C.FACILITY_WEIGHT
        }
        a, b = np.minimum(u, v).astype(np.int64), np.maximum(u, v).astype(np.int64)
        pairs, pair_of_seg = np.unique(a * n + b, return_inverse=True)
        template = csr_matrix((np.arange(1, len(pairs) + 1, dtype=float), (pairs // n, pairs % n)), shape=(n, n))
        slot_of_pair = np.empty(len(pairs), dtype=np.int64)
        slot_of_pair[template.data.astype(np.int64) - 1] = np.arange(len(pairs))
        seg_ids = segments["segment_id"].to_numpy()
        nan = np.full(n, np.nan)
        return cls(
            node_index=node_index,
            pop=nodes["population"].to_numpy(dtype=float),
            lon=nodes["lon"].to_numpy(dtype=float) if "lon" in nodes else nan,
            lat=nodes["lat"].to_numpy(dtype=float) if "lat" in nodes else nan,
            seg_ids=seg_ids,
            u=u, v=v,
            base=np.maximum(segments["travel_min"].to_numpy(dtype=float), 1e-3),
            length_m=segments["length_m"].to_numpy(dtype=float),
            road_group=segments["road_group"].to_numpy(),
            sources={k: s for k, s in sources.items() if len(s)},
            seg_pos={sid: i for i, sid in enumerate(seg_ids)},
            pair_of_seg=pair_of_seg,
            slot_of_pair=slot_of_pair,
            template=template,
        )

    @property
    def n(self) -> int:
        return len(self.pop)

    def pair_weights(self, weights: np.ndarray) -> np.ndarray:
        pw = np.full(len(self.slot_of_pair), np.inf)
        np.minimum.at(pw, self.pair_of_seg, weights)
        return pw

    def matrix(self, weights: np.ndarray) -> csr_matrix:
        m = self.template.copy()
        m.data[self.slot_of_pair] = self.pair_weights(weights)
        return m

    def distances(self, weights: np.ndarray) -> dict:
        m = self.matrix(weights)
        return {k: np.minimum(dijkstra(m, directed=False, indices=src, min_only=True), UNREACHABLE_MIN)
                for k, src in self.sources.items()}

    def combine(self, dist: dict) -> tuple[float, dict]:
        total_pop = self.pop.sum() or 1.0
        by_kind = {k: float((d * self.pop).sum() / total_pop) for k, d in dist.items()}
        wsum = sum(C.FACILITY_WEIGHT[k] for k in by_kind)
        return float(sum(C.FACILITY_WEIGHT[k] * v for k, v in by_kind.items()) / wsum), by_kind

    def node_minutes(self, dist: dict) -> np.ndarray:
        """Facility-weighted travel time per node (same weighting as accessibility)."""
        wsum = sum(C.FACILITY_WEIGHT[k] for k in dist)
        return sum(C.FACILITY_WEIGHT[k] * d for k, d in dist.items()) / wsum

    def accessibility(self, weights: np.ndarray) -> tuple[float, dict]:
        return self.combine(self.distances(weights))

    def base_eval(self) -> tuple[float, dict, dict]:
        if self._base_eval is None:
            dist = self.distances(self.base)
            self._base_eval = (*self.combine(dist), dist)
        return self._base_eval

    def weights_with(self, damage: dict) -> np.ndarray:
        """damage: segment id -> multiplier."""
        w = self.base.copy()
        for sid, factor in damage.items():
            pos = self.seg_pos.get(sid)
            if pos is not None:
                w[pos] = self.base[pos] * factor
        return w


class _ImpactJob:
    """State shared by every single-segment run: base distances, which segments lie on a shortest
    path tree of each facility kind, and the CSR slot of every segment's node pair."""

    def __init__(self, net: Network, factor: float):
        self.net, self.factor = net, factor
        self.base_A, _, self.base_dist = net.base_eval()
        self.m = net.matrix(net.base)
        self.tight = {}
        for kind, src in net.sources.items():
            d = dijkstra(self.m, directed=False, indices=src, min_only=True)
            du, dv = d[net.u], d[net.v]
            self.tight[kind] = (np.isclose(np.abs(du - dv), net.base, rtol=1e-9, atol=1e-9)
                                & np.isfinite(du) & np.isfinite(dv))
        self.candidates = np.flatnonzero(np.logical_or.reduce(list(self.tight.values())))
        self.pair_w = net.pair_weights(net.base)
        self.order = np.argsort(net.pair_of_seg, kind="stable")
        self.bounds = np.searchsorted(net.pair_of_seg[self.order], np.arange(len(self.pair_w) + 1))

    def run(self, indices) -> np.ndarray:
        net, m = self.net, self.m
        out = np.zeros(len(indices))
        for n_i, i in enumerate(indices):
            p = net.pair_of_seg[i]
            slot = net.slot_of_pair[p]
            others = [j for j in self.order[self.bounds[p]:self.bounds[p + 1]] if j != i]
            m.data[slot] = min([net.base[i] * self.factor] + [net.base[j] for j in others])
            dist = dict(self.base_dist)
            for kind, src in net.sources.items():
                if self.tight[kind][i]:
                    dist[kind] = np.minimum(dijkstra(m, directed=False, indices=src, min_only=True), UNREACHABLE_MIN)
            m.data[slot] = self.pair_w[p]
            out[n_i] = max(net.combine(dist)[0] - self.base_A, 0.0)
        return out


_worker_job: _ImpactJob | None = None


def _init_worker(net: Network, factor: float) -> None:
    global _worker_job
    _worker_job = _ImpactJob(net, factor)


def _run_chunk(indices) -> np.ndarray:
    return _worker_job.run(indices)


def single_segment_impact(net: Network, factor: float = DAMAGE_FACTOR["high"], workers: int = 1) -> np.ndarray:
    """Increase of accessibility (minutes) when each segment alone is damaged.

    A damaged segment can only change distances towards a facility kind if it lies on a shortest
    path tree of that kind, so other kinds keep their base distances and other segments are exactly 0.
    `workers` > 1 splits the segments over processes. Returns an array aligned with net.seg_ids.
    """
    job = _ImpactJob(net, factor)
    impact = np.zeros(len(net.seg_ids))
    if workers <= 1 or len(job.candidates) < 1000:
        impact[job.candidates] = job.run(job.candidates)
        return impact
    from concurrent.futures import ProcessPoolExecutor

    chunks = np.array_split(job.candidates, workers * 8)
    with ProcessPoolExecutor(workers, initializer=_init_worker, initargs=(net, factor)) as pool:
        for chunk, values in zip(chunks, pool.map(_run_chunk, chunks)):
            impact[chunk] = values
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
    baseline_A, _, _ = net.base_eval()
    before_dist = net.distances(net.weights_with(damage))
    before_A, before_kind = net.combine(before_dist)
    repaired_ids = [s for s in dict.fromkeys(repairs) if s in net.seg_pos]
    remaining = {sid: f for sid, f in damage.items() if sid not in set(repaired_ids)}
    after_dist = net.distances(net.weights_with(remaining))
    after_A, after_kind = net.combine(after_dist)
    repaired = [net.seg_pos[s] for s in repaired_ids]
    length = float(net.length_m[repaired].sum()) if repaired else 0.0
    cost = sum(net.length_m[p] * COST_IDR_PER_M[net.road_group[p]] for p in repaired)
    gap = before_A - baseline_A
    return {
        "damaged_segments": len(damage),
        "repaired_segments": repaired_ids,
        "accessibility_before": round(before_A, 4),
        "accessibility_after": round(after_A, 4),
        "accessibility_baseline": round(baseline_A, 4),
        "improvement_pct": round(100 * (before_A - after_A) / gap, 2) if gap > 1e-9 else 0.0,
        "by_facility": {k: {"before": round(before_kind[k], 4), "after": round(after_kind[k], 4)} for k in before_kind},
        "people_weight_regained": round(float(net.pop.sum()) * (before_A - after_A), 1),
        "cost_estimate_idr": int(round(cost, -5)),
        "duration_days": int(np.ceil(length / METERS_PER_DAY)) if length else 0,
        "node_changes": node_changes(net, before_dist, after_dist),
        "assumptions": ASSUMPTIONS,
    }


def node_changes(net: Network, before: dict, after: dict, limit: int = MAX_NODE_CHANGES) -> list[dict]:
    """Nodes whose facility-weighted travel time changes, largest population-weighted change first."""
    gained = net.node_minutes(before) - net.node_minutes(after)
    idx = np.flatnonzero((np.abs(gained) > 1e-4) & np.isfinite(net.lon) & np.isfinite(net.lat))
    idx = idx[np.argsort(-np.abs(gained[idx]) * (net.pop[idx] + 1))][:limit]
    return [
        {"lng": round(float(net.lon[i]), 6), "lat": round(float(net.lat[i]), 6),
         "minutes_gained": round(float(gained[i]), 3), "population": int(net.pop[i])}
        for i in idx
    ]


def recommend(net: Network, damage: dict, budget_idr: float | None = None) -> dict:
    """Order damaged segments by individual accessibility gain per rupiah.

    Repairing a segment lowers its travel time, which changes distances towards a facility kind only
    if the gap between its endpoints' distances exceeds the repaired time; other kinds are reused.
    """
    current_w = net.weights_with(damage)
    current_dist = net.distances(current_w)
    current_A, _ = net.combine(current_dist)
    rows = []
    for sid in damage:
        pos = net.seg_pos.get(sid)
        if pos is None:
            continue
        w = current_w.copy()
        w[pos] = net.base[pos]
        m = None
        dist = dict(current_dist)
        for kind, d in current_dist.items():
            if abs(d[net.u[pos]] - d[net.v[pos]]) > net.base[pos] + 1e-9:
                m = net.matrix(w) if m is None else m
                dist[kind] = np.minimum(dijkstra(m, directed=False, indices=net.sources[kind], min_only=True),
                                        UNREACHABLE_MIN)
        A, _ = net.combine(dist)
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
