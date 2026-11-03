# GNN evaluation — Impact Score surrogate

Measured 2026-11-04 with `python -m ml.graph.impact` then `python -m ml.gnn.train` (per region, `IPIMS_REGION`).
Numbers are copied from `ml/artifacts/<region>/graph/impact_info.json` and `ml/artifacts/<region>/gnn/eval.json`.

## What is predicted

Ground truth is the accessibility simulation (`ml/graph/sim.py`): for each road segment, how much the
population-weighted travel time to the nearest health facility, school, market and government office rises when
that segment alone is badly damaged (travel time ×5), rank-normalised to 0–100. No hand labels are involved.

The GNN (`ml/gnn/model.py`, 4 message-passing layers, plain PyTorch) sees only cheap features: road class, length,
buildings nearby, facility proximity, and distances from one shortest-path run per facility kind. It never runs
the per-segment simulation.

Baselines: "Linear" is least squares on the same segment features without message passing; "Road class" is the
traffic proxy alone. Metrics on held-out segments: Spearman rank correlation with the simulation, and overlap of
the top 10% most critical segments.

## Kota Surabaya (active region)

Graph (OSM, openstreetmap.fr East Java extract of 2026-11-03, all 31 kecamatan): 42,724 intersections,
58,445 segments (5,217 main roads, 53,228 local), 660,208 buildings (population proxy), facilities: 1,770 school,
870 government, 417 health, 161 market. 49,241 segments have non-zero impact.

Simulation: 700.7 s with 10 processes. Protocol: leave-area-out over 5 spatial folds (kecamatan grouped by
direction from the city centre into contiguous sectors of similar size).

| Held-out fold | Kecamatan | Segments | GNN Spearman | Linear Spearman | Road class Spearman | GNN top-10% | Linear top-10% |
|---|---|---|---|---|---|---|---|
| 1 | Dukuh Pakis, Gayungan, Jambangan, Karang Pilang, Lakarsantri, Wiyung | 11,368 | **0.690** | 0.442 | 0.136 | **0.440** | 0.365 |
| 2 | Gunung Anyar, Rungkut, Sukolilo, Tenggilis Mejoyo, Wonocolo, Wonokromo | 13,697 | **0.687** | 0.425 | 0.101 | **0.399** | 0.283 |
| 3 | Bulak, Genteng, Gubeng, Mulyorejo, Tambaksari, Tegalsari | 9,288 | **0.686** | 0.357 | 0.019 | **0.440** | 0.151 |
| 4 | Asemrowo, Bubutan, Kenjeran, Krembangan, Pabean Cantian, Sawahan, Semampir, Simokerto, Sukomanunggal | 12,483 | **0.670** | 0.258 | 0.121 | **0.392** | 0.225 |
| 5 | Benowo, Pakal, Sambikerep, Tandes | 9,759 | **0.709** | 0.332 | 0.163 | **0.456** | 0.295 |
| **All held-out** | 31 | 56,595 | **0.690** | 0.387 | 0.102 | **0.421** | 0.275 |

Compute: exact simulation 700.7 s (10 processes); GNN features 0.17 s plus one forward pass. Training took about
5 minutes per fold on CPU.

In the dense Surabaya network the GNN clearly beats both baselines in every fold, unlike the small Kediri pilot,
where the linear model was close. Road class alone says almost nothing about network impact here.

## Kabupaten Kediri pilot (Pare, Badas, Plemahan, Gurah)

Graph: 7,543 intersections, 9,337 segments, 114,792 buildings, facilities: 54 school, 11 health, 12 market,
11 government. 6,003 segments have non-zero impact. Protocol: leave-one-kecamatan-out.

| Held-out kecamatan | Segments | GNN Spearman | Linear Spearman | Road class Spearman | GNN top-10% | Linear top-10% |
|---|---|---|---|---|---|---|
| Pare | 3,049 | **0.755** | 0.660 | 0.547 | 0.474 | 0.438 |
| Badas | 1,439 | **0.772** | 0.658 | 0.578 | 0.517 | 0.580 |
| Plemahan | 1,618 | 0.682 | **0.781** | 0.550 | 0.534 | 0.578 |
| Gurah | 1,993 | **0.793** | 0.757 | 0.481 | 0.513 | 0.583 |
| **All held-out** | 8,099 | **0.784** | 0.746 | 0.477 | 0.502 | **0.538** |

Simulation 145.7 s with the first implementation; 85.4 s single process and 26.8 s with 10 processes after the
2026-11-04 speed-up, with identical results (max difference 1e-16).

## Reading the result

- The product uses the exact simulation for the Priority Score (design §7). The GNN out-of-fold prediction is
  stored as `impact_score_gnn` and is the path for scoring areas or network edits without rerunning the simulation.
- Labels come from our own simulation, so the model learns our assumptions (speeds per road class, damage factor,
  buildings as population). It is not validated against observed traffic.
- Next steps: top-k aware loss; test on a region not used for training at all.
