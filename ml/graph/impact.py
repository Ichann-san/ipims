"""Compute simulation Impact Scores for every segment (ground truth for the GNN).

Writes ml/artifacts/graph/impact.json {segment_id: score 0..100} and impact_raw.csv
(segment_id, impact_minutes). Run: python -m ml.graph.impact
"""
import json
import time

import pandas as pd

from . import config as C
from .sim import DAMAGE_FACTOR, Network, impact_to_score, single_segment_impact


def load_network() -> tuple[Network, pd.DataFrame]:
    nodes = pd.read_csv(C.ARTIFACTS_DIR / "nodes.csv")
    seg = pd.DataFrame([f["properties"] for f in json.loads((C.ARTIFACTS_DIR / "segments.geojson").read_text(encoding="utf-8"))["features"]])
    fac = pd.DataFrame([f["properties"] for f in json.loads((C.ARTIFACTS_DIR / "facilities.geojson").read_text(encoding="utf-8"))["features"]])
    return Network.from_frames(nodes, seg, fac), seg


def main():
    net, seg = load_network()
    t0 = time.time()
    raw = single_segment_impact(net, DAMAGE_FACTOR["high"])
    elapsed = time.time() - t0
    score = impact_to_score(raw)
    pd.DataFrame({"segment_id": net.seg_ids, "impact_minutes": raw}).to_csv(C.ARTIFACTS_DIR / "impact_raw.csv", index=False)
    (C.ARTIFACTS_DIR / "impact.json").write_text(json.dumps(dict(zip(net.seg_ids.tolist(), score.round(2).tolist()))))
    info = {"segments": int(len(raw)), "nonzero": int((raw > 0).sum()), "seconds": round(elapsed, 1),
            "max_minutes": float(raw.max()), "mean_minutes": float(raw.mean())}
    (C.ARTIFACTS_DIR / "impact_info.json").write_text(json.dumps(info, indent=2))
    print(json.dumps(info, indent=2))


if __name__ == "__main__":
    main()
