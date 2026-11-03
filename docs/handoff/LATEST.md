# Handoff — 2026-11-04 (Claude Code), end of build stage

## State

The build stage (shifts 1–5) is complete. The whole closed loop runs on real Kediri OSM data and is checked in a real browser.

- Checks: backend `pytest` 12 passed, `pytest ml` 4 passed, `npm run build` ok, `e2e/smoke.py` 14/14 (Edge, HTTPS, phone emulation with GPS, then officer flow on desktop).
- Evaluation: CV 95.0% ± 1.8% category accuracy on 157 hand-checked Commons photos (`ml/cv/EVAL.md`); GNN Spearman 0.784 on held-out kecamatan (`ml/gnn/EVAL.md`). Priority uses the exact simulation inside the pilot.
- Demo: `docs/DEMO.md` (5-minute script, expected questions, fallbacks). DB reset to 30 demo reports.

## Fixed this session

- CV model could fail to load when `/health` was polled during startup (concurrent first import of transformers; the failure was cached). Loading is now locked and `/health` never blocks (`backend/app/services/vision.py`).
- `/stats.active` added to the contract.

## Open

- Real phone test by the team (`npm run dev:https`, open the "Network" URL, accept the certificate).
- Deployment (stable public URL) not done.
- U1 visual design pass (direction A) is the next stage. `e2e/smoke.py` locates elements by visible Indonesian labels; update it when labels change.
- Severity is not evaluated; CV numbers are not from Kediri citizen photos yet.

## Dev environment

Ports: web 5288 (5173/5174 belong to another project), API 8000, PostGIS 5433. Docker Desktop must be running.
