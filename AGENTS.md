# Working on IPIMS (Claude Code and Codex)

IPIMS = **Intelligence Public Infrastructure Management System**. It supports public infrastructure reporting, assessment, prioritization, maintenance coordination and transparency. Current deployment: Kota Surabaya (Inovboyo 2.0); the original Kabupaten Kediri pilot remains reproducible with `IPIMS_REGION=kediri`. Shift One is a shared multi-category workflow plus a road analytical pilot.

Read before working:

1. `docs/concept/2026-11-05-scope-clarification.md` — current scope, capability matrix and metric dictionary. `docs/plans/2026-11-03-ipims-design.md` is the historical system design; preserve its results.
2. `docs/contracts/v1/api.md` — the only interface between frontend, backend and ML adapters.
3. `docs/TASKS.md` — pick one task; `docs/handoff/LATEST.md` — what the previous shift left.
4. `docs/frontend.md` — current responsive shell, map, reports and validation rules; replaces completed UI proposals.

## Capability boundaries

- Current intake: Road, Sidewalk, Drainage, Street light, Bus stop, Bridge, Other. Broader public infrastructure is the platform subject; intake coverage is not validated analytics for every asset.
- Current CV uses CLIP, not historical YOLO plans. Six infrastructure classes plus non-infrastructure; Other remains manual. AI assessed (`ai_verified`) is not officer-validated damage. Category evaluation does not validate damage/severity or field performance.
- Exact road simulation supplies seeded impact/priority; GNN predicts simulation labels. Nearby roads are context; facility POIs are accessibility destinations, not managed assets. Keep buildings/traffic proxies and rough road cost/duration assumptions explicit.
- Current category-independent road disruption, shared segment counts, road-based priority and off-network fallback are known limitations. Review also misses some confidence/disagreement cases and retains old severity after category correction. Follow `docs/concept/analytical-followups.md` for separate C04-C09 work; copy edits do not fix these algorithms.
- Preserve historic evaluations. Keep synthetic seed photo/location/status provenance and fallback department assignments explicit; do not claim real local incidents or verified responsibility.

## Layout

- `frontend/` — Vite + React + TypeScript + Tailwind. `npm run dev` (port 5288, proxies `/api` and `/media` to 8000).
- `backend/` — FastAPI + SQLAlchemy + GeoAlchemy2 on PostGIS. `uvicorn app.main:app --reload --port 8000` from `backend/`.
- `ml/` — `graph/` (OSM graph + accessibility simulation), `gnn/`, `cv/`. Pure Python packages; never import backend code.
- `legacy/` — old static prototype, reference only.
- Database: `docker compose up -d db` (PostGIS on host port 5433).

## Rules

- Shift start: read `docs/handoff/LATEST.md`, review the previous shift's diff (`git log`, `git diff`), then start your task.
- Shift end: run the checks for what you touched, update `docs/TASKS.md` and overwrite `docs/handoff/LATEST.md` (done, verified how, open issues, next step).
- Contract changes go through a Concept task; update `docs/contracts/v1/api.md` in the same commit as the code.
- Never commit secrets, `.env`, model weights, downloaded datasets or the proposal PDF (personal data). Large artifacts live in ignored folders listed in `.gitignore`.
- Report evaluation numbers as measured. No invented accuracy.
- Commit on a branch, never push without the user asking.

## Checks

- Backend: `cd backend && python -m pytest -q`
- Frontend: `cd frontend && npm run build`
- ML: `python -m pytest -q ml`
- End to end (servers running): `python e2e/smoke.py` → `14 steps passed`
