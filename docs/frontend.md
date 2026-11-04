# Frontend behavior and maintenance

Current reference after the approved mobile repair, November 5, 2026. Earlier
proposals and investigation logs are superseded; Git history retains their evidence.
The [historical system design](plans/2026-11-03-ipims-design.md), [scope clarification](concept/2026-11-05-scope-clarification.md),
[Shift One audit](concept/shift-one-audit.md), [analytical follow-ups](concept/analytical-followups.md)
and [API contract](contracts/v1/api.md) remain authoritative for their own subjects.

## Visual and responsive ownership

- Keep the existing navy/coral palette, locally hosted Plus Jakarta Sans, genuine
  supplied branding and shared semantic typography in `frontend/src/index.css`.
- `SiteFrame` measures the single navbar and footer. Compact mode supplies one
  scrolling workspace between them; reading pages scroll there, map routes fill it.
  Safe-area insets and dynamic viewport height are included. Full-screen mobile
  Sheet/Modal overlays own their header and scrolling body, preserving nested focus
  trapping, Escape, return focus and scroll locking.
- `responsive.ts` and the compact CSS block share one condition: width below 768px,
  or width below 1024px with height 500px or less. Short landscape is deliberately
  compact. Desktop keeps its floating pill navigation and full institutional footer.
- Compact navigation exposes text-labelled destinations through Menu. Footer keeps
  copyright and map credits visible; About exposes institutional logos and team.
  Do not force all branding into a short phone viewport again.

## Home and maps

- Home retains the live original globe-to-city entrance, night style and city scene.
  Report data is prefetched but attached after camera motion settles. Reduced motion
  skips the entrance. Compact mode stops idle orbit; desktop orbit remains unchanged.
  A stronger mobile scrim protects headline, actions and centered statistics.
- Public map has reports, modeled road impact and accessibility destinations. Working
  maps constrain navigation around the configured region, use restrained pitch and
  opt-in detailed 3D. The report GPS picker remains unrestricted.
- On compact public maps, Layers starts collapsed. One active non-modal surface shows
  either layer controls or a selected report/road peek; report details expand into the
  shared Sheet. Operations uses the same map panel and queue/simulation conventions.
  Short landscape uses a side panel rather than stacked bottom panels.
- Camera padding and native Mapbox wordmark use measured workspace/panel bounds.
  Home/public map canvases remain 110% tall and clipped, with no added page scroll;
  Operations overscans only in compact mode. The clipped tenth is relative to the
  workspace, not the entire viewport. Native wordmark and linked footer attribution
  remain visible. Map options retain detailed 3D and compass controls.
- Road/facility requests cancel stale responses. No new tile service, static homepage
  replacement, custom3D model, culling engine or claimed measured FPS gain is included.
  The large Mapbox bundle remains a known build warning.

## Reports, transparency and officer workflow

- Compact Reports has heading/count, search/Filters, scope, full-width cards and
  an in-flow Previous/Page/Next pager. Category, sort and page size live in a sheet.
  Desktop retains numbered paging and wrapping cards. URL filters, Back/Forward,
  page reset/clamp and explicit page sizes 3/6/9/12 use shared logic.
- Respect current code/category report titles. Nearby roads are context, not the
  identity of a lamp, drain or other asset. Shared labels preserve stored enum keys.
  Empty inventories, unknown totals, loading and errors remain distinct.
- Compact Transparency groups primary metrics, discloses response times/charts and
  previews three progress reports with View all. Every chart retains accessible data.
  Compact Dashboard puts queue cards after a short summary; filters/context/weights
  remain available in labelled controls. Desktop tables and charts are retained.
- Report photo/GPS/category/AI suggestion and officer approval/assignment/repair,
  weights and road simulation are shared across viewport sizes. Drafts and selections
  must survive responsive changes. Presentation work changes no model, schema or API.
- Calendar months and display dates use WIB. Approval means government approval,
  not AI processing time. Scores remain provisional road-context analytics as
  specified in the concept references; UI wording does not fix eligibility/review.

## Verification

Run frontend build, unit tests and lint, then browser checks with API and preview up:

```powershell
cd frontend
npm run build
npm test
npm run lint
cd ..
.venv/Scripts/python e2e/mobile.py
.venv/Scripts/python e2e/layout.py --base http://127.0.0.1:5289
.venv/Scripts/python e2e/consistency.py
.venv/Scripts/python e2e/smoke.py --base http://127.0.0.1:5289
```

Mobile regression covers 320x568, 360x640, 375x667, 390x844, 412x915, 430x932,
844x390 landscape, 768x1024 tablet and 1366x900 desktop. Check actual hit targets,
first usable task, pager/card separation, single active map surface, keyboard-like
viewport reduction, selection/draft retention, focus, long content and text scaling.
Bounds-only checks previously missed content hidden behind fixed chrome.
Emulation does not establish physical iOS/Android rendering or keyboard behavior.
Real-phone verification and demo recording remain team work.

## Graph and cleanup

`graphify-out/` is a navigation graph for frontend TypeScript/TSX only. CSS, HTML,
assets, tests, docs, backend and ML require separate inspection. The graph report
records extraction limits and source commit; it does not certify visual quality.

Keep `.venv` dependencies, media, datasets, weights, source icons/photos, fixtures,
and referenced `legacy/` prototype assets. Remove generated audit/baseline folders
and superseded planning documents after current behavior/evidence has a maintained
home. Historical evaluations stay intact in `ml/*/EVAL.md` and Git history.
