# Working on IPIMS (Claude Code and Codex)

IPIMS is a decision support system for public infrastructure in Kabupaten Kediri (Lomba Kediri Cerdas 2026). Read before working:

1. `docs/plans/2026-11-03-ipims-design.md` — scope, data model, lifecycle, scoring, ML approach.
2. `docs/contracts/v1/api.md` — the only interface between frontend, backend and ML adapters.
3. `docs/TASKS.md` — pick one task; `docs/handoff/LATEST.md` — what the previous shift left.

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
