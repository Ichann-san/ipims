# Task board

Status: `todo` | `doing` | `done` | `blocked`. One task per shift. Update this file and `docs/handoff/LATEST.md` before ending a shift.

| ID | Track | Task | Status | Done when |
|---|---|---|---|---|
| A1 | Concept | Design doc, API contract, task board, agent guides | done | `docs/plans/2026-11-03-ipims-design.md`, `docs/contracts/v1/api.md` exist |
| A2 | Concept | Scaffold repo: compose (PostGIS), backend skeleton, frontend skeleton, legacy move | todo | `docker compose up -d db`, backend `/api/v1/health` ok, frontend dev server boots |
| C1 | ML | Build pilot graph from OSM (segments, facilities, buildings proxies) | todo | `ml/graph` artifacts written, counts recorded |
| C3a | ML | Accessibility simulation → `impact_score_sim` per segment, what-if functions | todo | scores for all segments, unit tests on toy graph |
| B1 | Website | Backend core: models, report create/list/detail, photos, lifecycle, scoring, admin auth, seed | todo | pytest passes against PostGIS |
| B2 | Website | React public: report flow (camera, GPS, AI preview), list, detail+timeline, map, transparency | todo | report created on phone appears everywhere |
| B3 | Website | React admin: login, queue with breakdown, manage status, weights, graph map, what-if | todo | full lifecycle clickable |
| C2 | ML | CV: category ViT/CLIP + road damage detector, eval | todo | `ml/cv/EVAL.md` with held-out numbers |
| C3b | ML | GNN surrogate trained on simulation labels, eval vs baselines | todo | `ml/gnn/EVAL.md` |
| D1 | Integration | Wire CV + GNN into backend, seed demo data, docs, phone test | todo | demo script runs end to end |
| U1 | Website | Visual design pass (direction A) | todo | later, after D1 |
