# Task board

Status: `todo` | `doing` | `done` | `blocked`. One task per shift. Update this file and `docs/handoff/LATEST.md` before ending a shift.

| ID | Track | Task | Status | Done when |
|---|---|---|---|---|
| A1 | Concept | Design doc, API contract, task board, agent guides | done | `docs/plans/2026-11-03-ipims-design.md`, `docs/contracts/v1/api.md` exist |
| A2 | Concept | Scaffold repo: compose (PostGIS), backend skeleton, frontend skeleton, legacy move | done | `docker compose up -d db`, backend `/api/v1/health` ok, frontend dev server boots |
| C1 | ML | Build pilot graph from OSM (segments, facilities, buildings proxies) | done | `ml/graph` artifacts written, counts recorded |
| C3a | ML | Accessibility simulation → `impact_score_sim` per segment, what-if functions | done | scores for all segments, unit tests on toy graph |
| B1 | Website | Backend core: models, report create/list/detail, photos, lifecycle, scoring, admin auth, seed | done | pytest passes against PostGIS |
| B2 | Website | React public: report flow (camera, GPS, AI preview), list, detail+timeline, map, transparency | done | report created in browser appears in list, detail, map, stats (phone test is in D1) |
| B3 | Website | React admin: login, queue with breakdown, manage status, weights, graph map, what-if | done | full lifecycle clickable |
| C2 | ML | CV: CLIP ViT category + zero-shot damage type and severity, eval (YOLO dropped: untrusted pickle weights) | done | `ml/cv/EVAL.md` with held-out numbers |
| C3b | ML | GNN surrogate trained on simulation labels, eval vs baselines | done | `ml/gnn/EVAL.md` |
| D1 | Integration | Wire CV + GNN into backend, seed demo data, docs, phone test | doing | demo script runs end to end |
| U1 | Website | Visual design pass (direction A) | todo | later, after D1 |
