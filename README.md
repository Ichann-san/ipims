# IPIMS — Intelligent Public Infrastructure Management System

Decision support for public infrastructure in Kabupaten Kediri (Lomba Kediri Cerdas 2026, Kategori Digital).
Citizens report damage with a photo; a vision transformer classifies it; the report is snapped to the OSM road
graph; an accessibility simulation (and a GNN surrogate) scores the network impact; an MCDM Priority Score ranks
the queue; officers move each report through approval, assignment and repair while the public follows progress.

Design: [docs/plans/2026-11-03-ipims-design.md](docs/plans/2026-11-03-ipims-design.md) ·
API: [docs/contracts/v1/api.md](docs/contracts/v1/api.md) ·
Tasks: [docs/TASKS.md](docs/TASKS.md) ·
Agent guide: [AGENTS.md](AGENTS.md)

## Run locally

Requirements: Docker, Python 3.10, Node 24.

```sh
docker compose up -d db                      # PostGIS on port 5433
python -m venv --system-site-packages .venv
.venv/Scripts/pip install -r backend/requirements.txt -r ml/requirements.txt transformers osmium

# 1. Road graph for the pilot area (Pare, Badas, Plemahan, Gurah)
.venv/Scripts/python -m ml.graph.build       # Overpass; if it is down, download the East Java extract
                                             # into ml/data/osm/ and run python -m ml.graph.extract first
.venv/Scripts/python -m ml.graph.impact      # simulation Impact Score per segment
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
```

Default officer login is `admin` / `admin123`; set `IPIMS_ADMIN_PASSWORD` and `IPIMS_JWT_SECRET` in `backend/.env`
(see `backend/.env.example`) for anything beyond local use.

## Checks

```sh
cd backend && ../.venv/Scripts/python -m pytest -q
.venv/Scripts/python -m pytest -q ml
cd frontend && npm run build
.venv/Scripts/python -m pip install playwright   # once; uses the installed Microsoft Edge
.venv/Scripts/python e2e/smoke.py               # full loop in a real browser, servers must be running
```

Demo: [docs/DEMO.md](docs/DEMO.md). For a phone on the same Wi-Fi run `npm run dev:https` (GPS needs HTTPS).

## Evaluation

- CV: [ml/cv/EVAL.md](ml/cv/EVAL.md)
- GNN: [ml/gnn/EVAL.md](ml/gnn/EVAL.md)

Map data © OpenStreetMap contributors (ODbL). The earlier static prototype is kept in `legacy/` for reference.
