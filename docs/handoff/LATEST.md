# Claude handoff - completed IPIMS web and branch promotion

Updated November 5, 2026. User says the web is finished and everything looks good.
This handoff records completed work, not authorization to start another refactor.
This session changed branch references and documentation only; no application code edits.

## Start here

1. Read `AGENTS.md` (`CLAUDE.md` already imports it).
2. Read this handoff, then `docs/frontend.md` for current UI ownership and behavior.
3. Read `docs/concept/2026-11-05-scope-clarification.md`,
   `docs/concept/shift-one-audit.md`, and `docs/concept/analytical-followups.md`.
4. Use `docs/contracts/v1/api.md` as the frontend/backend/ML interface contract.
5. Consult `docs/TASKS.md` and `docs/DEMO.md`; preserve measured ML results in
   `ml/cv/EVAL.md` and `ml/gnn/EVAL.md`. Historical design is
   `docs/plans/2026-11-03-ipims-design.md`, not a replacement for current scope.

## Branches - completed before writing this handoff

Repository: https://github.com/Ichann-san/ipims.git

| Branch | Purpose | Application baseline |
|---|---|---|
| `main` | Current completed React/FastAPI/ML web; continue work here | `9c67dff` (`position fix`), followed by this documentation-only handoff |
| `1.0` | Preserved previous main / old IPIMS implementation | `4683ef832b7e61330ba55cd4a6a27d515f7a0156` |
| `rebuild/v1` | Retained development branch for the current rebuild | `9c67dff` |

Fetched GitHub first. Old main was an ancestor of the rebuilt web. Created `1.0`
from the exact old main, switched to main, and fast-forwarded main to rebuild/v1.
Published `1.0` and main together with an atomic, non-force push. Main remains the
repository's default branch. No history was discarded and no branch was deleted.
Verified main's application tree exactly matched rebuild/v1 before documentation edits.

Deployment does not require a branch named main: a deployment service can build a
configured non-main branch. No hosting provider was selected or manual deployment
performed in this session. Main is now the intended deployment source. Before a
future deployment, configure frontend SPA routing, production API/media routing,
backend/PostGIS, persistent media, ML artifacts and environment configuration.
The Vite development proxy is not a production backend deployment. Do not assume
ignored local datasets, model artifacts or environment files exist on a new server.

## Product concept - preserve the exact definition

**IPIMS = Intelligence Public Infrastructure Management System.** Use Intelligence,
not Intelligent. The subject is public infrastructure, not roads alone.

- Shared intake/lifecycle covers Road, Sidewalk, Drainage, Street light, Bus stop,
  Bridge and Other. This does not establish validated analytics for every category.
- Current deployment/demo geography is Kota Surabaya / Inovboyo 2.0. Original
  Kabupaten Kediri pilot remains reproducible through `IPIMS_REGION=kediri`.
- Roads are the analytical pilot. Nearby road associations are context, not the
  identity of lamps, drains or other reported assets. Facility POIs are accessibility
  destinations, not a managed municipal asset inventory.
- Current CV is CLIP, not the historical YOLO proposal. Category recognition is
  distinct from validated damage/severity. Other supports manual intake.
- `ai_verified` is displayed as AI assessed; a non-null inference is not officer
  validation. Keep stored API enum keys and historical events compatible.
- Exact road simulation supplies seeded impact scores; the GNN is a learned
  surrogate of simulation labels. Buildings/traffic are proxies. Repair costs,
  durations and travel-time improvements are modeled estimates, not field outcomes.
- Cross-category road disruption/priority, segment-level report grouping,
  off-network fallback, review eligibility/confidence and severity after category
  correction remain known backend/model limitations. C04-C09 functional changes
  require a separately approved Concept/API task. Copy/UI fixes did not solve them.
- Seed incidents, locations, statuses and department assignments are synthetic;
  attributed photos do not prove those exact local incidents. Preserve provenance.

## What is already built

### Architecture and working flows

- `frontend/`: React + TypeScript, Vite, Tailwind v4, locally hosted Plus Jakarta
  Sans, Phosphor icons, Mapbox GL and Chart.js. Public and officer routes are lazy-loaded.
- `backend/`: FastAPI, SQLAlchemy/GeoAlchemy2, PostGIS, bearer-token officer auth,
  report/photo storage, listing/search/filtering, detail/history, lifecycle,
  priority breakdown, weights, statistics and road what-if/recommendation endpoints.
- `ml/graph`, `ml/cv`, `ml/gnn`: reproducible region graph/accessibility simulation,
  CLIP assessment and GNN surrogate packages. Preserve evaluated artifacts/results.
- `legacy/` retains the older static prototype and referenced test/photo assets.
- Citizen flow: photo upload/camera, GPS or manual pin, advisory AI/category,
  optional note, submission, report detail/history and public completion tracking.
- Officer flow: login, prioritized queue, approval, assignment, repair/completion,
  weights/re-ranking, operations map and road repair scenario comparison.

### Public desktop UI and shared components

- Preserve the approved dark navy/coral/cyan identity, glass panels, supplied
  favicon/navbar mark, institutional logos, divider, logo centerline and team names.
- Home retains the original live globe-to-city entrance, night scene and tilted
  camera. Static homepage replacement was explicitly rejected. Report data is
  prefetched and attached after camera motion settles; reduced motion is honored.
- Shared SiteFrame owns measured navbar/footer clearance. Desktop footer contains
  institutional branding, Agil - Khalisya - Ikhsan, copyright and linked map credits.
- Shared typography, labels, palette, statistics, status controls, error states,
  nested Sheet/Modal focus trapping/restoration and centered KPI components exist.
- Reports supports URL search/scope/category/sort, explicit sizes 3/6/9/12,
  page clamp/reset, Back/Forward and desktop numbered pagination/wrapping cards.
- Public map and Operations share controls. Working maps use bounded region views
  and optional detailed 3D; GPS picker remains unrestricted. Requests cancel stale data.
- Statistics use WIB months/dates and correct approval/completion definitions.
  Five Chart.js views retain accessible text/table alternatives. Unknown counts
  must not render as zero. Scope of latest/loaded records stays explicit.

### Completed mobile repair

- Compact layout applies below 768px width, or below 1024px with height 500px or less;
  `responsive.ts` and CSS share the same query. Phone landscape is deliberately compact.
- Mobile header has brand, Report/Map action and labelled Menu destinations.
  Compact fixed footer shows copyright/credits; About exposes logos/team.
- One measured workspace sits between chrome. Full-screen mobile forms/details own
  their header and scroll body; safe areas and dynamic viewport height are included.
- Home has a stronger scrim, grouped actions and centered KPI strip. Desktop orbit
  remains; compact idle orbit pauses after the original entrance settles.
- Reports has search/Filters, scope, aligned full-width cards, a labelled filter
  sheet and an in-flow Previous/Page/Next pager. It no longer floats over reports.
- Public map starts with Layers collapsed; one non-modal surface shows layers or
  selected report/road peek. Details expand into a full-screen sheet. Short landscape
  uses side surfaces. Operations reuses panel conventions and expandable pilot context.
- Transparency groups/discloses metrics and charts, previews three reports and links
  to all reports. Officer Dashboard brings queue cards early with filters/context
  and weights still accessible. Desktop tables/visual direction remain.
- Large-text scope/status wrapping, touch targets, draft/selection retention across
  resize, and dialog focus behavior were addressed. At 320x568, header/footer measured
  56px/49px versus old 66px/124px plus a 120px fixed pager; paging is now in content flow.

## Latest user changes - do not undo

After the completed repair, the user committed `9c67dff` (`position fix`) and said
all looks good. It changes only `frontend/src/index.css` and `map/MapCanvas.tsx`:

- Overscan-specific bottom-left native Mapbox control CSS rules are commented out.
- The imperative native control `bottom`/`left` style assignment block is commented out.
- Current source and the user's accepted position are authoritative. Earlier frontend
  documentation describes the measured-position implementation before these overrides;
  do not reactivate it as an unsolicited cleanup or infer a new desired position.
- Likewise preserve the user's simplified code/category labels and intentionally
  hidden secondary copy. Do not automatically restore earlier verbose presentation.

## Verification already completed - distinguish history from this session

These were run for the completed repair before the user's later position-only commit:

- Production frontend build passed; the existing large Mapbox bundle warning remains.
- Eleven frontend unit tests passed. Lint had React/Fast Refresh advisory warnings,
  no errors. No new framework or dependency was needed for the repair.
- Mobile suite: 63 route samples across 320x568, 360x640, 375x667, 390x844, 412x915,
  430x932, 844x390, 768x1024 and 1366x900. Final targeted phone/landscape confirmation
  covered filters, usable hit targets, selection rotation, full-screen details,
  reduced-height keyboard-like geometry, draft retention and 200% text.
- Consistency suite: 40 route checks, nested focus/return, fonts/metadata/icons,
  off-road identity, map deep links and unavailable/error distinctions passed.
- Layout suite: 16 routes plus mocked 137-report pagination/history/clamp/filter,
  empty/error and stale-response cases passed.
- Real 11-step smoke passed: photo/GPS/AI, create/search/public views, officer
  approval/assignment/repair/completion, weights and road simulation.
- Smoke reports 000194/000195/000196 were completed through normal lifecycle;
  none were deleted/reset. Earlier smoke attempts exposed a test typing before
  drawer navigation finished; it now waits for the drawer to close.
- Edge emulation only. No claim of physical iOS/Android keyboard testing or
  measured real-device FPS improvement. Real-phone QA and demo recording remain.
- This branch/handoff session ran Git/tree/document checks only; it did not rerun
  these application tests or change runtime data. Do not describe historical test
  results as new validation of the user's position overrides.

Reproducible commands are in `docs/frontend.md` and README. Public routes are `/`,
`/laporan`, `/laporan/:code`, `/peta`, `/transparansi`; officer login `/admin/login`,
Dashboard `/admin`, Operations `/admin/peta`. Local default auth is admin/admin123
unless overridden; production configuration must use its own credentials.
Dev frontend 5288, production preview 5289, API 8000 and PostGIS 5433 were used previously;
check actual running services rather than assuming they remain available.

## Graphify and cleanup status

- Persistent frontend graph: `graphify-out/graph.json`, `graph.html`, `GRAPH_REPORT.md`.
  Snapshot is code commit `dee3195e0696adb965d174a9a999acb2b90386d4`:
  32 TypeScript/TSX files, 220 nodes, 664 edges, nine communities, zero extraction API tokens.
- It predates the user's `9c67dff` MapCanvas comments. Use it for navigation, then
  inspect current source. Do not label it fully current or refresh it during this
  documentation-only session. CSS/HTML/assets/tests/docs/backend/ML are outside its corpus.
- Raw extraction limits: 49 unresolved edges omitted, six duplicate undirected pairs
  collapsed, no raw self-loops. Exported endpoints were checked. These are extractor
  limitations, not proven application defects.
- Eight superseded UI proposal/review/completion documents were removed after
  consolidating current rules in `docs/frontend.md`; C01-C19 evidence remains in
  `docs/concept/shift-one-audit.md`. Old proposals remain in Git history.
- Six generated audit/baseline/cache folders were removed. Nested source Graphify
  cache is explicitly ignored. Preserve dependencies, environment files, media,
  datasets, model artifacts, current contracts/concept/evaluations and legacy fixtures.

## Next Claude session

Use main. Read the references above and wait for the user's next task. Web development
is accepted as complete; do not start new UI, analytics, graph or deployment work
without a task. Keep exact product scope, API compatibility, user position tweaks,
branding, original globe scene and desktop/mobile behavior. Never reset demo data
or copy old 1.0 code over current main during context restoration. Branch 1.0 is the
historical version, not the active app. Never commit secrets or push unrelated work.
