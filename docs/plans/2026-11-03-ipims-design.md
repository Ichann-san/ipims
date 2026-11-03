# IPIMS v1 — Concept and system design

Status: approved direction 2026-11-03 (plan C, React rebuild, UI design pass later with direction A: calm civic public app + dense admin ops console).
Source of requirements: `PROPOSAL DIGITAL (1).pdf` (Lomba Kediri Cerdas 2026, Kategori Digital).

## 1. What v1 must prove

The proposal promises a closed loop: citizen report → AI verification → graph construction → GNN impact analysis → what-if simulation → decision support → government approval → repair monitoring, visible to the public. v1 makes every step of that loop run on real data for a pilot area of Kabupaten Kediri.

Acceptance (observable):

1. A citizen on a phone takes a photo, the location is captured, the AI suggests category and severity, and the report is stored with the photo.
2. The report appears in the public list, map, detail page (with status timeline) and transparency statistics.
3. The report is snapped to a road segment of the Kediri OSM graph and receives an Impact Score and a Priority Score with a visible breakdown.
4. An admin logs in, sees the priority queue, moves the report through the lifecycle (approve, assign to OPD, repair, complete) and the public pages reflect each change.
5. The admin runs a what-if simulation over the current damaged segments and gets the accessibility change computed on the real graph, plus a recommended repair order.
6. CV and GNN have written evaluation numbers (`ml/*/EVAL.md`) measured on held-out data, compared against a simple baseline.

Non-goals for v1 (roadmap items in proposal §4.1.4 or out of scope tonight):

- Flutter native app (v1 is a mobile-first React PWA).
- Citizen accounts, login, profile page, comments.
- Multi-role permissions per OPD; v1 has one admin role.
- Predictive maintenance, cascade prediction, digital twin.
- Integration with existing government systems (proposal §4.1.2).
- Visual design polish (separate pass after v1 works).

## 2. Pilot area

Kecamatan Pare and neighbouring kecamatan in **Kabupaten** Kediri (not Kota Kediri). The drivable OSM network of the area is the infrastructure graph. Facilities (hospital/clinic, school, market, government office) come from OSM POIs. Exact boundary list lives in `ml/graph/config.py` so the area can grow later.

## 3. Architecture

```
frontend/  React (Vite, TS, Tailwind, react-leaflet)  — public PWA + /admin
   │ REST JSON /api/v1
backend/   FastAPI + SQLAlchemy + GeoAlchemy2
   │            ├─ services/scoring   MCDM Priority Score
   │            ├─ services/lifecycle status transitions
   │            ├─ services/spatial   snap report → nearest road segment (PostGIS)
   │            └─ ml adapters        CV inference, impact scores, what-if
   ▼
PostgreSQL + PostGIS (docker compose)      media/ (photos on disk)
ml/
   ├─ graph/  build Kediri graph from OSM, accessibility simulation (ground truth Impact Score)
   ├─ gnn/    GNN surrogate trained on simulation labels, evaluated vs baseline
   └─ cv/     category classifier (ViT/CLIP) + road damage detector, evaluation
```

The backend imports ML code as a library through small adapters; the ML packages never import backend code. Precomputed graph artifacts (segments, facilities, impact scores) are loaded into PostGIS by a seed command.

## 4. Data model

**Report** — `id` (uuid), `code` (`IPIMS-YYYY-NNNNNN`), `created_at`, `location` (Point 4326), `manual_pin`, `gps_accuracy_m`, `category`, `category_source` (`ai` | `user`), `description`, `photo_path`, `ai` (json: category, category_confidence, damage_type, severity, severity_score, is_infrastructure, model_version), `segment_id` (nullable), `snap_distance_m`, `impact_score`, `priority_score`, `priority_breakdown` (json), `status`, `assigned_to`, `updated_at`.

**StatusEvent** — `id`, `report_id`, `from_status`, `to_status`, `actor` (`system`, `citizen`, `admin:<username>`), `note`, `created_at`. Every status change writes one event; the public timeline is this table.

**Segment** (road asset) — `id` (stable OSM-derived id), `name`, `highway`, `road_group` (`utama` | `lingkungan`), `length_m`, `geom` (LineString 4326), `traffic_proxy`, `population_proxy`, `facility_proxy`, `impact_score` (value used for priority), `impact_score_sim` (simulation), `impact_score_gnn` (GNN prediction), `kecamatan`.

**Facility** — `id`, `kind` (`health`, `school`, `market`, `government`), `name`, `geom` (Point 4326).

**Admin** — `username`, `password_hash` (PBKDF2). Seeded from environment.

**WeightProfile** — `road_group`, `weights` (json). Editable by admin.

Categories (from the existing UI and Gemini prompt): `jalan`, `trotoar`, `drainase`, `lampu_jalan`, `halte`, `jembatan`, `lainnya`.

## 5. Status lifecycle

Statuses match the six status colours already in the design tokens, plus rejection.

| Status | Workflow stage (proposal Tabel 2.1) | Set by |
|---|---|---|
| `reported` | 1 Citizen report | citizen submit |
| `ai_verified` | 2–6 AI verification, graph, GNN, DSS | system, right after scoring succeeds |
| `gov_approved` | 7 Government approval | admin |
| `assigned` | 7 Assignment to OPD | admin (requires `assigned_to`) |
| `in_repair` | 8 Repair monitoring | admin |
| `completed` | 8 Done, visible to public | admin |
| `rejected` | not valid / duplicate / not infrastructure | admin (requires note) |

Allowed transitions: `reported → ai_verified | rejected`, `ai_verified → gov_approved | rejected`, `gov_approved → assigned | rejected`, `assigned → in_repair`, `in_repair → completed`. If AI scoring fails the report stays `reported` and the admin can still approve it manually (`reported → gov_approved` is allowed for admins). Anything else returns HTTP 409.

## 6. Priority Score (MCDM)

Weighted sum of normalised criteria, all in [0, 1], result scaled to 0–100:

| Criterion | Source |
|---|---|
| `severity` | CV severity score; 0.5 when no AI result |
| `traffic` | road class proxy: trunk 1.0, primary 0.9, secondary 0.7, tertiary 0.5, unclassified 0.35, residential 0.3, other 0.2 |
| `population` | OSM buildings within 250 m of the segment, normalised by area max |
| `facility` | importance of nearest facilities within 500 m (health 1.0, school 0.7, market 0.6, government 0.5) |
| `impact` | segment Impact Score / 100 |
| `reports` | active reports on the same segment in the last 30 days: `min(1, ln(1+n)/ln(11))` |

Default weights (admin-editable, renormalised to sum 1):

| Group | severity | traffic | population | facility | impact | reports |
|---|---|---|---|---|---|---|
| `utama` (trunk, primary, secondary) | 0.25 | 0.25 | 0.10 | 0.10 | 0.20 | 0.10 |
| `lingkungan` (others) | 0.25 | 0.10 | 0.15 | 0.25 | 0.15 | 0.10 |

The breakdown (each criterion value, weight, contribution) is stored with the report so the dashboard can explain the rank. Reports not snapped to a segment (more than 150 m from any road) use the `lingkungan` profile with traffic, population, facility and impact set to 0 and are flagged for manual review.

## 7. Impact Score and GNN

Ground truth comes from simulation, not from guessed labels:

- Origins: graph nodes weighted by the number of OSM buildings nearest to them (population proxy).
- Accessibility `A(G)`: population-weighted mean shortest travel time from origins to the nearest facility of each kind, combined with facility weights.
- Damage on a segment multiplies its travel time (default ×5 for severe, i.e. effectively impassable for normal traffic; configurable).
- `impact_score_sim(e)` = relative increase of `A` when segment `e` alone is damaged, rank-normalised to 0–100 within the area.

The GNN (plain PyTorch message passing, no PyG) predicts `impact_score_sim` from local graph structure and node/edge features (road class, length, degree, distances to facilities, building counts). Train/test split is spatial (by kecamatan) so the model is tested on roads it never saw. It is compared with baselines: the road class proxy alone, and a linear model on the same segment features without message passing. Metrics: Spearman correlation and top-10% overlap with simulation. Its use in the product: instant impact scores without the per-segment simulation (only one shortest-path run per facility kind), for new areas or edited networks. In the pilot area the exact simulation is available for every segment, so the Priority Score uses `impact_score_sim`; the GNN out-of-fold prediction is stored as `impact_score_gnn` and its agreement with the simulation is reported in `ml/gnn/EVAL.md`.

What-if simulation uses the exact accessibility simulation on the current damage state (all active reports): given a set of segments to repair it returns accessibility before/after, change per facility kind, people-weighted origins that regain access, a rough cost and duration estimate (constants labelled as assumptions), and a greedy recommended repair order by gain per cost.

## 8. Computer vision

- Category: zero-shot or lightly fine-tuned vision transformer (CLIP ViT) over the seven categories plus "not infrastructure damage". Matches proposal Tabel 2.2 "CNN / Vision Transformer".
- Road damage type and severity: YOLO road damage detector (pretrained weights trained on RDD2022 or a pothole dataset; CPU-only machine, so no large training tonight). Severity from detected damage class and box area relative to image.
- Evaluation on a held-out labelled image set; accuracy reported honestly against the proposal KPI (>85%), including the confusion matrix.
- The AI result is advisory: the citizen can override the category, and the admin verifies (proposal: PUPR validates AI results).

## 9. API

Contract: `docs/contracts/v1/api.md`. The contract changes only through a concept task recorded in `docs/TASKS.md`.

## 10. Data sources

| Data | Source | Use |
|---|---|---|
| Road network, buildings, facilities | OpenStreetMap via OSMnx / Overpass | graph, proxies, map |
| Road damage images | RDD2022 (Arya et al.), public pothole datasets | CV evaluation / fine-tune |
| Road condition statistics | BPS Kabupaten Kediri Dalam Angka 2026 | transparency page context |

No scraping of complaint websites (personal data and terms-of-service risk). Demo reports are seeded from public road damage images placed on real Kediri segments and clearly marked as seed data.
