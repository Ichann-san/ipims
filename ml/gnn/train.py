"""Train and evaluate the Impact Score GNN against the accessibility simulation.

Protocol: leave-area-out. Kecamatan are grouped into spatial folds (config FOLDS; one kecamatan per
fold when there are few). For each fold, train on the other folds and predict the held-out one, so every
segment gets an out-of-fold prediction from a model that never saw labels from its area. Compared with
feature baselines that ignore graph structure.
Features use only one Dijkstra per facility kind (no per-segment simulation), so they are cheap.

Writes ml/artifacts/<region>/gnn/eval.json and predictions.json (out-of-fold scores 0..100).
Run: python -m ml.gnn.train
"""
import json
import time

import numpy as np
import pandas as pd
import torch
from scipy.sparse.csgraph import dijkstra
from scipy.stats import spearmanr

from ..graph import config as C
from ..graph.impact import load_network
from .model import ImpactGNN

OUT = C.GNN_DIR
HIGHWAYS = ["trunk", "primary", "secondary", "tertiary", "unclassified", "residential"]
EPOCHS = 400
VERSION = "impact-gnn-v1"


def features(net, seg: pd.DataFrame):
    m = net.matrix(net.base)
    dist = {k: np.minimum(dijkstra(m, directed=False, indices=s, min_only=True), 60.0) for k, s in net.sources.items()}
    deg = np.bincount(np.concatenate([net.u, net.v]), minlength=net.n)
    node_x = np.column_stack(
        [np.log1p(net.pop), np.log1p(deg)] + [dist[k] / 30.0 for k in C.FACILITY_WEIGHT if k in dist]
    )
    hw = seg["highway"].to_numpy()
    du = np.column_stack([dist[k][net.u] for k in dist])
    dv = np.column_stack([dist[k][net.v] for k in dist])
    # How close the segment is to lying on a shortest path towards facilities (0 = exactly on one).
    slack = np.abs(np.abs(du - dv) - net.base[:, None]).min(axis=1)
    edge_x = np.column_stack(
        [(hw == h).astype(float) for h in HIGHWAYS]
        + [np.log1p(seg["length_m"].to_numpy()) / 7, net.base / 5, np.log1p(seg["building_count"].to_numpy()) / 7,
           seg["facility_proxy"].to_numpy(), np.minimum(slack, 5) / 5]
    )
    return node_x.astype(np.float32), edge_x.astype(np.float32)


def top_overlap(pred, true, frac=0.1):
    k = max(1, int(len(true) * frac))
    return len(set(np.argsort(-pred)[:k]) & set(np.argsort(-true)[:k])) / k


def metrics(pred, true):
    return {"spearman": round(float(spearmanr(pred, true).statistic), 3), "top10_overlap": round(top_overlap(pred, true), 3)}


def train_fold(node_x, edge_x, u, v, y, train_idx, seed=0):
    torch.manual_seed(seed)
    model = ImpactGNN(node_x.shape[1], edge_x.shape[1])
    opt = torch.optim.Adam(model.parameters(), lr=3e-3, weight_decay=1e-5)
    X, E = torch.tensor(node_x), torch.tensor(edge_x)
    U, V = torch.tensor(u), torch.tensor(v)
    Y = torch.tensor(y, dtype=torch.float32)
    tr = torch.tensor(train_idx)
    for _ in range(EPOCHS):
        opt.zero_grad()
        loss = torch.nn.functional.mse_loss(model(X, U, V, E)[tr], Y[tr])
        loss.backward()
        opt.step()
    model.eval()
    with torch.no_grad():
        return model(X, U, V, E).numpy(), model


def linear_baseline(edge_x, y, train_idx):
    A = np.column_stack([edge_x, np.ones(len(edge_x))])
    w, *_ = np.linalg.lstsq(A[train_idx], y[train_idx], rcond=None)
    return A @ w


def spatial_folds(net, seg: pd.DataFrame, n_folds: int) -> dict:
    """Kecamatan name -> fold name. Kecamatan are ordered by angle around the region centre and cut into
    n_folds contiguous sectors of similar segment counts, so each fold is one connected part of the city."""
    kec = seg["kecamatan"].to_numpy()
    mid_lon = (net.lon[net.u] + net.lon[net.v]) / 2
    mid_lat = (net.lat[net.u] + net.lat[net.v]) / 2
    names = [k for k in C.KECAMATAN if (kec == k).any()]
    if n_folds >= len(names):
        return {k: k for k in names}
    cx, cy = np.nanmean(mid_lon), np.nanmean(mid_lat)
    stats = []
    for k in names:
        sel = kec == k
        stats.append((np.arctan2(mid_lat[sel].mean() - cy, mid_lon[sel].mean() - cx), k, int(sel.sum())))
    stats.sort()
    total, target = sum(n for *_, n in stats), sum(n for *_, n in stats) / n_folds
    folds, acc, fold = {}, 0, 0
    for _, k, n in stats:
        folds[k] = fold
        acc += n
        if acc >= target * (fold + 1) and fold < n_folds - 1:
            fold += 1
    members = {}
    for k, f in folds.items():
        members.setdefault(f, []).append(k)
    return {k: " + ".join(sorted(members[f])) if len(members[f]) <= 2 else f"fold {f + 1} ({len(members[f])} kecamatan)"
            for k, f in folds.items()}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    net, seg = load_network()
    impact = json.loads((C.ARTIFACTS_DIR / "impact.json").read_text())
    y = np.array([impact[s] for s in net.seg_ids]) / 100.0
    t0 = time.time()
    node_x, edge_x = features(net, seg)
    feature_seconds = time.time() - t0
    fold_of = spatial_folds(net, seg, C.FOLDS)
    kec = seg["kecamatan"].map(fold_of).fillna("outside").to_numpy()

    oof = {"gnn": np.zeros(len(y)), "linear_features": np.zeros(len(y))}
    folds = {}
    for area in dict.fromkeys(fold_of.values()):
        test = np.flatnonzero(kec == area)
        train = np.flatnonzero((kec != area) & (kec != "outside"))
        t1 = time.time()
        pred, _ = train_fold(node_x, edge_x, net.u, net.v, y, train)
        train_seconds = time.time() - t1
        lin = linear_baseline(edge_x, y, train)
        oof["gnn"][test], oof["linear_features"][test] = pred[test], lin[test]
        folds[area] = {
            "kecamatan": sorted(k for k, f in fold_of.items() if f == area),
            "test_segments": int(len(test)),
            "gnn": metrics(pred[test], y[test]),
            "linear_features": metrics(lin[test], y[test]),
            "traffic_proxy": metrics(seg["traffic_proxy"].to_numpy()[test], y[test]),
            "train_seconds": round(train_seconds, 1),
        }
        print(area, folds[area], flush=True)

    inside = kec != "outside"
    sim_info = json.loads((C.ARTIFACTS_DIR / "impact_info.json").read_text())
    result = {
        "version": VERSION,
        "region": C.REGION,
        "protocol": "leave-area-out over spatial folds of kecamatan; metrics on the held-out area",
        "folds": folds,
        "test": {
            "gnn": metrics(oof["gnn"][inside], y[inside]),
            "linear_features": metrics(oof["linear_features"][inside], y[inside]),
            "traffic_proxy": metrics(seg["traffic_proxy"].to_numpy()[inside], y[inside]),
        },
        "compute": {"simulation_seconds": sim_info["seconds"], "gnn_feature_seconds": round(feature_seconds, 2)},
    }
    (OUT / "eval.json").write_text(json.dumps(result, indent=2))
    # Out-of-fold predictions, rescaled to 0..100. Segments outside the pilot polygons keep the simulation value.
    pred = np.where(inside, np.clip(oof["gnn"], 0, 1) * 100, y * 100)
    (OUT / "predictions.json").write_text(json.dumps(dict(zip(net.seg_ids.tolist(), np.round(pred, 2).tolist()))))
    print(json.dumps(result["test"], indent=2), result["compute"])


if __name__ == "__main__":
    main()
