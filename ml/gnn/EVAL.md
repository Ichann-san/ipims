# GNN evaluation — Impact Score surrogate

Measured 2026-11-04 with `python -m ml.graph.impact` then `python -m ml.gnn.train`. Numbers are copied from
`ml/artifacts/graph/impact_info.json` and `ml/artifacts/gnn/eval.json`.

## What is predicted

Ground truth is the accessibility simulation (`ml/graph/sim.py`): for each road segment, how much the
population-weighted travel time to the nearest health facility, school, market and government office rises when
that segment alone is badly damaged (travel time ×5), rank-normalised to 0–100. No hand labels are involved.

Pilot graph (OSM, openstreetmap.fr East Java extract of 2026-11-03): 7,543 intersections, 9,337 segments,
114,792 buildings (population proxy), facilities: 54 school, 11 health, 12 market, 11 government.
6,003 segments have non-zero impact; the rest have an equally fast detour.

The GNN (`ml/gnn/model.py`, 4 message-passing layers, plain PyTorch) sees only cheap features: road class, length,
buildings nearby, facility proximity, and distances from one shortest-path run per facility kind. It never runs
the per-segment simulation.

## Protocol

Leave-one-kecamatan-out: train on three kecamatan, test on the fourth, for all four. Metrics on held-out segments:
Spearman rank correlation with the simulation, and overlap of the top 10% most critical segments.

## Results

| Held-out kecamatan | Segments | GNN Spearman | Linear Spearman | Road class Spearman | GNN top-10% | Linear top-10% |
|---|---|---|---|---|---|---|
| Pare | 3,049 | **0.755** | 0.660 | 0.547 | 0.474 | 0.438 |
| Badas | 1,439 | **0.772** | 0.658 | 0.578 | 0.517 | 0.580 |
| Plemahan | 1,618 | 0.682 | **0.781** | 0.550 | 0.534 | 0.578 |
| Gurah | 1,993 | **0.793** | 0.757 | 0.481 | 0.513 | 0.583 |
| **All held-out** | 8,099 | **0.784** | 0.746 | 0.477 | 0.502 | **0.538** |

"Linear" is least squares on the same segment features without message passing. "Road class" is the traffic proxy alone.

Compute: the exact simulation took 145.7 s for the pilot; the GNN features took 0.03 s plus one forward pass.

## Reading the result

- The GNN ranks segments clearly better than road class alone and somewhat better than the linear model overall,
  but not in every kecamatan (Plemahan), and it is slightly worse than the linear model at picking the top 10%.
- The product therefore uses the exact simulation for the Priority Score inside the pilot (design §7). The GNN
  out-of-fold prediction is stored as `impact_score_gnn` for comparison and is the path for scoring new areas
  without running the simulation.
- Labels come from our own simulation, so the model learns our assumptions (speeds per road class, damage factor,
  buildings as population). It is not validated against observed traffic.
- Next steps: top-k aware loss, more kecamatan for training, and a test on a kecamatan outside the pilot.
