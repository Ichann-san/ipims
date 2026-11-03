# Handoff — 2026-11-03 night shift (Claude Code)

## Done and verified

- Concept: design doc, API contract v1, task board, agent guide (`AGENTS.md`).
- Backend (FastAPI + PostGIS): reports with photo storage (EXIF stripped), snapping to the nearest road segment, MCDM Priority Score with stored breakdown, status lifecycle with validated transitions, admin login (JWT), weights editing with rescoring, stats, segments/facilities GeoJSON, what-if and recommendation endpoints. `cd backend && ../.venv/Scripts/python -m pytest -q` → 12 passed.
- CV: CLIP ViT-B/32 (LAION, MIT, safetensors) zero-shot category, damage type and severity. Category accuracy 95.0% ± 1.8% on 157 hand-checked Commons images (see `ml/cv/EVAL.md`, including the limits). Severity is not evaluated.
- Graph: builder for the Pare/Badas/Plemahan/Gurah pilot, accessibility simulation (exact, tested on a toy graph), Impact Score computation, GNN surrogate with leave-one-kecamatan-out evaluation. `python -m pytest -q ml` → 4 passed.
- Frontend (React): public report flow (photo → AI preview → GPS/map pin → category → submit), list, detail with timeline, map, transparency; admin queue, report management, weights, network map with what-if. `npm run build` passes. Live smoke test through the Vite proxy: health, analyze and report creation return real results.

## Open

- D1 partly done: graph built from the openstreetmap.fr East Java extract (Overpass was down all night): 7,543 nodes, 9,337 segments, 114,792 buildings, 88 facilities. Simulation impact computed (146 s). GNN Spearman 0.784 on held-out kecamatan (`ml/gnn/EVAL.md`). PostGIS seeded, 30 demo reports created with real CV analysis. Live API check through the Vite proxy: queue, graph summary, recommend, what-if (top 3 repairs recover 32% of lost accessibility), segments, photos all OK.
- Not done in D1: phone test, deployment.
- Dev ports: frontend 5288 (5173/5174 are used by another project on this machine), API 8000, PostGIS 5433.
- The UI has not been looked at in a real browser by the agent (no browser tool for localhost). Click through it once.
- Phone GPS needs HTTPS when the site is opened from another device by IP (browsers block geolocation on plain HTTP). The map-pin fallback works without it.
- U1 visual design pass (direction A) not started.

## Next step

Run the app (README "Run locally"), click through public and admin flows, then start U1.
