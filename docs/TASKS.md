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

## Stage 2 (historical delivery; current behavior in `docs/frontend.md`)

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
| R1 | Review | Restore prior session; review map performance and statistics ideas | done | Source findings, build baseline, alternatives and chart mapping recorded in `docs/frontend.md` |
| R2 | Concept/Website | Implement approved working-map performance controls and Chart.js statistics; preserve original homepage map | done | Bounded city working maps, optional 3D, cancelled stale requests, five accessible charts, WIB calendar and full-dataset KPI fixes; contract updated; frontend build/tests, backend 16 tests and e2e 11 steps pass |
| R3 | Website/Review | Center shared statistics; audit component reuse; review custom 3D and delayed homepage overlays | done | All 16 Stat instances centered at desktop/mobile widths; frontend build passes; findings and proposed experiments in `docs/frontend.md`; homepage timing changes remain proposed |
| R4 | Planning | Shared fixed footer, map overflow/controls/credits, staged homepage overlays and paginated Reports | done | `docs/frontend.md` contains source-verified scope, alternatives, delivery order and acceptance gates; user confirmed clipped 110% canvas; homepage staging approved, approved layout implemented in R5 |
| R5 | Website | Implement approved shared shell, map dock/overflow, staged homepage layers and paginated report cards | done | Build and 8 frontend tests pass; 16 route checks and 137-report pagination scenarios pass; e2e 11 steps pass; required attribution retained in shared footer; no backend migration |

| R6 | Website | Use supplied SVG favicon with PNG fallback | done | HTML references supplied assets; production build passes |
| R7 | Website | Use supplied favicon as shared navbar brand mark | done | Public/officer mark updated; production build passes |
| R8 | Website | Approved compact Inovboyo/IPIMS shared footer | done | Supplied logo, copyright and right-aligned map credits; production build and 15 responsive footer checks pass |
| R9 | Website | Fix expanded footer logo proportions and mobile fit | done | Four supplied marks load with intrinsic aspect ratios; build and 12 responsive route checks pass |
| R10 | Website | Balance footer logos by visible artwork and center alignment | done | ITS headroom framed without asset edits; four viewport checks and build pass |
| R11 | Website | Divider after Pemkot footer mark | done | Centered decorative divider added; production build passes |
| R12 | Website | Fix footer team-name placement | done | Names, copyright and credits stacked without grid overlap; build and four viewport checks pass |
| R13 | Concept/Planning | Audit Shift One scope and frontend consistency; propose two-track plan | done | 19 concept mismatches retained in docs/concept/shift-one-audit.md; current UI rules in docs/frontend.md; original 28-finding proposal remains in Git history |
| R14 | Concept | Clarify public infrastructure scope and Shift One road-pilot limits | done | Canonical glossary, capability matrix, C01-C19 corrections and explicit analytical follow-up specification delivered |
| R15 | Website | Implement approved U01-U28 consistency refactor | done | Build/lint/11 tests; 16 layout checks, 40 consistency checks and 11-step smoke pass; behavior and user styling preferences preserved |
| R16 | Documentation | Refresh Graphify for integrated frontend source | done | 30 source files, 210 nodes, 595 edges; snapshot tagged to 8ae4f4a; raw extraction limits and coverage recorded |
| R17 | Planning/Website | Audit mobile UI and propose dedicated responsive repair | done | 57 page/state samples across six phones, landscape, tablet and desktop; measured obstruction findings and mobile-only layout proposal recorded; approved implementation followed |
| R18 | Website | Repair mobile shell, page hierarchy, maps and overlays | done | Build/11 unit tests; 63 route samples over nine sizes plus final edge-case confirmation; 40 consistency checks and 11-step smoke pass |
| R19 | Documentation | Refresh Graphify and remove superseded plans/generated audits | done | 32 files, 220 nodes, 664 edges, nine communities at dee3195; eight superseded docs and six generated folders removed; current links resolve |
| R20 | Handoff/Git | Promote accepted web to main and preserve previous IPIMS as 1.0; brief Claude | done | Old main 4683ef8 preserved on local/origin 1.0; main fast-forwarded to accepted 9c67dff and pushed without force; docs/handoff/LATEST.md records full progress and latest user overrides; application code untouched |
| R21 | Deployment | Restore original Vercel URL with Vite/FastAPI, durable private photos, Neon PostGIS and bundled ML | done | Original ipims-one.vercel.app promoted after staged checks; anonymous API/AI/photo checks pass; 50 reports migrated plus completed synthetic 000197; build, 11 frontend/33 backend/5 ML tests; docs/deployment.md and latest handoff record setup and hosting limits |
