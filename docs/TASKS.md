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
| D1 | Integration | Wire CV + GNN into backend, seed demo data, docs, phone test | done | `docs/DEMO.md`; `e2e/smoke.py` 14/14 in Edge over HTTPS with phone emulation + GPS (real phone: team) |

## Stage 2 (see `docs/plans/2026-11-04-stage2-ui-design.md`)

| ID | Track | Task | Status | Done when |
|---|---|---|---|---|
| S0 | ML/Backend | Region switch to Surabaya, faster simulation, GNN folds, demo data, API v1.1 | done | Surabaya live in the API; eval docs updated |
| U0 | Website | Design system, glass components, navbar, Mapbox base, `/dev/ui` | done | style page + map render; screenshots reviewed |
| U1 | Website | Beranda, Laporan (single page), Peta | done | screenshots 390/1366 reviewed; e2e passes |
| U1b | Website | Transparansi with progress | done | same |
| U2 | Website | Dasbor | done | same |
| U2b | Website | Peta Operasi with live simulation + comparison | done | click recolours map; before/after toggle (swipe dropped, user OK) |
| U4 | Website | Quality pass + PWA | done | axe: no serious/critical issues; phone layouts checked; lazy-loaded map chunk; manifest + icons |
| U5 | Demo | Real phone test, demo video run | todo | demo script runs |

## Codex continuation — 2026-11-04

| ID | Track | Task | Status | Done when |
|---|---|---|---|---|
| R1 | Review | Restore prior session; review map performance and statistics ideas | done | Source findings, build baseline, alternatives and chart mapping recorded in `docs/plans/2026-11-04-performance-statistics-review.md` |
| R2 | Concept/Website | Implement approved working-map performance controls and Chart.js statistics; preserve original homepage map | done | Bounded city working maps, optional 3D, cancelled stale requests, five accessible charts, WIB calendar and full-dataset KPI fixes; contract updated; frontend build/tests, backend 16 tests and e2e 11 steps pass |
