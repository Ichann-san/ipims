# IPIMS — Intelligence Public Infrastructure Management System

Decision support for public infrastructure in Kota Surabaya (Inovboyo 2.0 showcase).
The original Kabupaten Kediri pilot (Lomba Kediri Cerdas 2026) stays reproducible with
`IPIMS_REGION=kediri`.

Shift One delivered a shared reporting/lifecycle workflow for Road, Sidewalk,
Drainage, Street light, Bus stop, Bridge and Other, plus a road-network accessibility
analytical pilot. Citizens submit photos and locations; CLIP provides advisory
category/severity suggestions; officers approve, assign and track repair while the
public follows progress. A nearby road is context, not the reported asset's identity.

Road simulation supplies the current impact score; the GNN is its evaluated learned
surrogate. Existing priority and disruption calculations still apply road assumptions
across report categories, including unsupported cases. They are not validated
multi-asset urgency or damage models. AI assessed does not mean officer-validated
damage; Other is manual intake. See the [current scope, capability matrix and metric
dictionary](docs/concept/2026-11-05-scope-clarification.md) and [separate analytical
follow-ups](docs/concept/analytical-followups.md).

Historical design: [docs/plans/2026-11-03-ipims-design.md](docs/plans/2026-11-03-ipims-design.md) ·
API: [docs/contracts/v1/api.md](docs/contracts/v1/api.md) ·
Tasks: [docs/TASKS.md](docs/TASKS.md) ·
Agent guide: [AGENTS.md](AGENTS.md)

## Run locally

Requirements: Docker, Python 3.10, Node 24.

```sh
docker compose up -d db                      # PostGIS on port 5433
python -m venv --system-site-packages .venv
.venv/Scripts/pip install -r backend/requirements.txt -r ml/requirements.txt transformers osmium

# 1. Road graph for the region: IPIMS_REGION=surabaya (default, 31 kecamatan) or kediri (Pare pilot)
#    Download https://download.openstreetmap.fr/extracts/asia/indonesia/east_java.osm.pbf into ml/data/osm/
.venv/Scripts/python -m ml.graph.extract     # cut the region out of the extract (Overpass is the fallback)
.venv/Scripts/python -m ml.graph.build       # graph, buildings, facilities -> ml/artifacts/<region>/graph
.venv/Scripts/python -m ml.graph.impact      # simulation Impact Score per segment (IPIMS_WORKERS processes)
.venv/Scripts/python -m ml.gnn.train         # GNN surrogate + evaluation

# 2. CV evaluation data and numbers (optional; the model itself downloads on first use)
.venv/Scripts/python -m ml.cv.collect && .venv/Scripts/python -m ml.cv.evaluate

# 3. Database, demo data, API
cd backend
../.venv/Scripts/python -m app.seed          # loads graph into PostGIS, creates admin + weights
../.venv/Scripts/python -m app.demo --reset  # optional demo reports (marked as seed data)
../.venv/Scripts/python -m uvicorn app.main:app --port 8000

# 4. Web app (second terminal)
cd frontend && npm ci && npm run dev         # http://localhost:5288, officer login at /admin
# The map needs a Mapbox token: frontend/.env.local -> VITE_MAPBOX_TOKEN=pk....  (never commit it)
```

Default officer login is `admin` / `admin123`; set `IPIMS_ADMIN_PASSWORD` and `IPIMS_JWT_SECRET` in `backend/.env`
(see `backend/.env.example`) for anything beyond local use.

## Checks

Production hosting: [docs/deployment.md](docs/deployment.md). Deploy the repository
root to the original `ipims` Vercel project; its frontend is Vite, not Next.js.

```sh
cd backend && ../.venv/Scripts/python -m pytest -q
.venv/Scripts/python -m pytest -q ml
cd frontend && npm run build
.venv/Scripts/python -m pip install playwright   # once; uses the installed Microsoft Edge
.venv/Scripts/python e2e/smoke.py               # full loop in a real browser, servers must be running
.venv/Scripts/python e2e/layout.py              # chrome/map checks + mocked 137-report pagination (no report writes)
.venv/Scripts/python e2e/consistency.py         # shared typography, focus, responsive shell and non-road identity checks
.venv/Scripts/python e2e/mobile.py              # usable task/controls, nine viewport sizes, rotation and reduced-height forms
```

Demo: [docs/DEMO.md](docs/DEMO.md). Seed reports use attributed Commons photos with synthetic incidents, locations and lifecycle events; photos do not evidence those exact local assets. Facility POIs are accessibility destinations, not a managed asset inventory. For a phone on the same Wi-Fi run `npm run dev:https` (GPS needs HTTPS).

## Evaluation

- CV category classification on 157 Commons photos; damage/severity and local field performance remain unvalidated: [ml/cv/EVAL.md](ml/cv/EVAL.md)
- GNN agreement with road simulation labels, not observed traffic: [ml/gnn/EVAL.md](ml/gnn/EVAL.md)

Map data © OpenStreetMap contributors (ODbL). The earlier static prototype is kept in `legacy/` for reference.
