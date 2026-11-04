# Shared shell, map controls and reports - implementation plan

Status: approved and implemented in R5. Text attribution stays in the shared footer;
Mapbox Standard requires it in addition to the genuine Mapbox wordmark. The compact
attribution button is removed on full-screen maps; embedded pickers keep it.

## Completion evidence

- Shared fixed chrome on all 8 routes, checked at 1366x900 and 390x844. One footer
  and correct navbar per route; no horizontal overflow, including the catalog.
- Home/public Map canvas ratio is 1.10; no extra document scroll. Dock and wordmark
  clear the visible footer and map panels. Report form also checked at 390x500.
- 8 frontend tests cover entrance event/timeout/cancellation/reduced-motion behavior,
  page validation/navigation and WIB calendar logic. Production build passes.
- `e2e/layout.py`: 16 route checks and 137 mocked reports; last/invalid page, changed
  totals, filter reset, drawer return, Back/Forward, errors, empty results, 200%-like
  viewport reflow and stale responses pass without page errors.
- `e2e/smoke.py`: 11 steps pass through photo/GPS, report creation, lifecycle to
  completion, weights and graph simulation. Its selectors now handle URL query
  parameters and accessible chart captions correctly.
- Existing React lint warnings remain; no design-detector findings. No backend
  schema/API change, new runtime dependency or model retraining.

Exploratory headless Edge entrance samples versus pre-implementation commit 2d670ff:

| Viewport / ordering | Before p95 frame interval | After p95 frame interval | Long-task time before / after |
|---|---|---|---|
| 1366x900, before then after | 33.3 ms | 17.1 ms | 2420 / 852 ms |
| 1366x900, after then before | 66.2 ms | 17.2 ms | 2727 / 1887 ms |
| 390x844, before then after | 17.2 ms | 17.2 ms | 525 / 491 ms |

These are short local samples with substantial baseline variance, not a controlled
device-wide guarantee. Phone frame time showed no clear improvement. Overlay-ready
state arrived at about 6.7 s desktop / 7.1 s phone from navigation in the first pair.
The extra canvas area is retained as requested. Real phone profiling remains open.

## Direction and boundaries

Refine the existing Surabaya interface: matte navy glass, blue/orange accents,
Plus Jakarta Sans, compact controls and little explanatory copy. Retain the current
homepage globe entrance, city camera, lighting, headline, final report markers and
slow orbit. No static preview, new map engine, 3D model assets, dependency or route
rename. User labels Home/Map/Report refer to existing `/`, `/peta`, `/laporan` routes.

User clarified the overflow requirement: map canvas is 110% of viewport height,
clipped below the viewport, without extra document scroll.

Design calibration: preserve the incumbent composition; DESIGN_VARIANCE 3,
MOTION_INTENSITY 2 for controls/content and the existing cinematic home animation,
VISUAL_DENSITY 5. The established palette, typography and glass treatment win.

## Evidence and approach selection

- Footer is rendered by Home, Reports and Transparency individually. PublicLayout
  and AdminLayout do not own it; Map, Dashboard, Operations, Login and the catalog
  therefore have no common footer. This is an ownership problem, not just a CSS fix.
- Home suppresses Mapbox's compact attribution control because its footer contains
  credits; other maps show it. The screenshot's circled `i` is attribution, not an alert.
- Map controls are split between a custom 3D button and native zoom/compass controls,
  positioned with unrelated bottom offsets. Phone CSS hides native navigation.
- Reports use two wide columns and increment `limit` by 24 for Load more. Backend
  already supports limit/offset/total; `limit` is capped at 100, so repeated Load more
  can eventually request 120 and fail. Numbered pagination avoids this too.
- Graphify scoped to 21 frontend files (~10,486 words): 160 nodes, 426 edges.
  Integrity diagnostic: 41 dangling-endpoint edges and 3 collapsed same-endpoint
  relations. It is an incomplete structural aid; ownership and API claims above
  were verified directly in source. Extraction used no LLM/API tokens.

Options considered:

1. Per-page fixes: smallest initial diff, but repeats footer and control offsets.
2. Shared shell + map dock + bounded report pages: recommended; addresses the owners
   of the inconsistencies and reuses existing components/API.
3. Broad UI rewrite: unnecessary risk to working report, GPS and simulation flows.

## 1. Shared visible navbar and footer

- Put Footer in the shared route shell, not individual pages. Render exactly once
  on every route, including Login, officer routes and the design catalog. Use the
  appropriate public/officer header without changing authentication guards.
- Implement the requested always-visible behavior with a fixed bottom footer,
  matching the already-fixed navbar. A normal sticky footer at the end of content
  would not meet this requirement.
- Use a compact matte navy surface, thin border and current typography. Keep branding
  and map credit links legible; wrap predictably on phones, including safe-area inset.
- One shared set of measured header/footer insets supplies content padding, report
  pagination, map overlays, controls and wordmark positioning. Do not duplicate the
  current hardcoded 44/64 px offsets on each page.
- Ordinary pages retain accessible scrolling between persistent chrome. Map pages
  have no document scroll. This minimizes travel without hiding long content.
- Sheets/dialogs remain higher-priority focus surfaces. Keep their usable content
  clear of the footer; allow internal form scrolling and preserve keyboard focus.

Owners: `App.tsx`, `ui/Footer.tsx`, `ui/Navbar.tsx`, shared layout CSS, and removal of
page-owned footer instances. Existing route layouts are the reuse point.

## 2. Map overflow, credits and controls

### Canvas and overlay separation

- Home and public Map: visible wrapper is 100dvh; canvas extends to 110dvh and is
  clipped at the bottom. The extra 10% is background, not scrollable page space.
- Anchor controls, layer panel, logo and popups to the visible viewport, not to the
  extended canvas bottom. Keep them above the actual measured footer plus a gap.
- Use map camera padding for the visible region and panel occlusion. Check the
  original home landmark/center after resizing; do not silently change the camera
  to compensate or hide reports behind the footer.
- Apply overscan only to the requested full-screen Home/public Map. The embedded
  report picker remains its own correctly sized interactive map. Operations shares
  the safe offsets/dock but keeps its own viewport unless overscan is requested.
- A 10% taller canvas draws more pixels. Treat this as a framing change, not an
  optimization; include it in before/after performance checks.

### Attribution consistency

- Use one `MapCredits` presentation next to the visible full-screen map, in the
  persistent footer: Mapbox, OpenStreetMap, Improve this map, plus any source-required
  notices. The feedback link should reflect the active map camera when available.
- Home and public Map use the same treatment, removing the mismatched circled `i`
  once equivalent attribution is visibly supplied. Retain the genuine Mapbox logo
  on every map and keep it above the footer/clip boundary.
- Embedded pickers/dialog maps keep compact on-map credits when the shared footer
  is not a sufficient visible/adjacent credit surface. Same credit content; placement
  follows map context. Do not hide required attribution to make the UI cleaner.

Primary reference: https://docs.mapbox.com/help/dive-deeper/attribution/

### Screenshot control redesign

- Replace detached black 3D badge + native black control stack with one matte-glass
  dock in the visible lower-right corner, 16-24 px above the footer.
- 44 px targets, consistent 12 px radii, shared foreground/border colors and Phosphor
  icons. Order: 3D toggle, subtle divider, zoom in, zoom out, reset north/compass.
- Show 3D state with aria-pressed and a quiet blue active treatment; no large separate
  black bubble. Zoom/compass actions use the existing MapRef, not a new map instance.
- One dock, one spacing system on public Map and Operations. Keep it clear of layer
  controls, attribution, queue panels, popups and the footer at all breakpoints.
- On short/narrow phones, use a compact horizontal dock above the layer strip or a
  single expanded-control trigger; required controls remain discoverable and operable.
- Home remains cinematic/noninteractive: shared credits and safe placement apply,
  but working-map zoom/3D controls are intentionally absent there.

Owners: `map/MapCanvas.tsx`, a small shared map-control dock, map-page overlay layout
and removal of conflicting native-control CSS. Keep rendering and visible UI layers
separate so overscan cannot move the dock off screen.

## 3. Approved homepage layer staging

- Prefetch reports during the existing globe entrance. Keep KPI data independent.
- Wait for completion of the initial fly-in, allow a bounded map-settling phase,
  then mount the report source and both circle layers exactly once.
- Start the same slow orbit after staging. Do not wait on permanent idle while
  continuous orbit is already running; it may never arrive.
- Register completion before flyTo/jumpTo; cover reduced motion, route departure,
  failed/late requests and remounts. Explicitly suspend orbit while hidden and reset
  the frame timestamp on resume to avoid a large bearing jump.
- Final scene, report colors and camera stay the same. No measured speed-up promised
  until the affected device is profiled, especially with the 110% canvas.

Owner: Home.tsx lifecycle and report-layer mounting. Share an event callback through
MapCanvas only if needed; do not add a global animation framework.

## 4. Compact, wrapped and paginated Reports

- Use wrapping report cards with space distributed around them, as requested. Start
  with a roughly 320 px flex basis and maximum width around 360 px inside the current
  page container. Target 3 columns on desktop, 2 where space permits, 1 on phones or
  increased browser zoom. Avoid fixed heights that clip translated/long content.
- Keep the useful thumbnail, road, category, status, date and priority. Place status
  on its own compact line when a narrow card would squeeze the road name. Cards share
  the existing border, matte surface, radius, hover/focus style and text hierarchy.
- Add Rows per page choices 3 / 6 / 9 / 18. Suggested initial counts: desktop 9,
  tablet 6, phone 3. Once selected, preserve the user's choice; zoom/reflow must not
  keep changing it or reset their page.
- Replace Load more with bounded Previous / page numbers / Next, range and total
  (e.g. 1-9 of 42). Keep this pager in a compact strip above the persistent footer.
- Reuse GET /reports with `limit=pageSize` and `offset=(page-1)*pageSize`. No backend
  or contract change is needed for these controls.
- Persist filters, search, sort, page and page size in URL parameters. Filter/sort/
  size changes reset to page 1. Browser Back and closing a report drawer restore the
  originating page. Preserve existing `buat=1` creation and direct report URLs.
- Clamp an invalid page after totals change. Ignore/abort stale page requests so a
  slow earlier response cannot overwrite the latest filter/page. Loading, empty and
  error states retain filters and pagination context.
- Keep creation/detail drawers and photo/GPS behavior. Pagination reduces browsing
  scroll; short viewports and zoom still allow content scrolling rather than clipping.

Owners: `pages/Reports.tsx`, its report-card view and a pager only as reusable as
needed. Reuse api.listReports rather than introducing another fetch/data library.

## 5. Reuse fixes within this work

- Retain centered shared Stat values/labels.
- Share button styles with actual link elements; remove the three Link-wrapping-
  Button nests when touching Home, report detail and Operations.
- Prefer existing theme tokens and control primitives for the dock; do not create
  another independent status/color palette.
- Add examples of the new dock/card/pager to `/dev/ui`; fix its known 11 px mobile
  grid overflow while making it the reference surface for this change.
- Preserve contextual simulation metrics and compact/detailed progress trackers;
  uniform styling does not require identical content hierarchy.

## Delivery order and completion gates

1. Shared shell/footer and chrome insets; check all routes first.
2. Separate map canvas from visible overlays; implement overscan and credit consistency.
3. Replace the screenshot's control stack with the shared dock.
4. Apply approved homepage overlay staging while preserving the cinematic scene.
5. Compact Reports and server pagination; preserve drawer/back/filter state.
6. Batched visual verification, focused fixes, then one confirmation pass.

Acceptance:

- Exactly one visible footer and appropriate navbar on every route; no content or
  pager hidden behind them. Report form remains usable with phone keyboard open.
- 110% canvas is clipped with no extra document scroll on Home/public Map. Credits,
  Mapbox logo and dock stay in the visible safe area.
- Home and public Map use consistent map credits. Public/Operations controls share
  design, targets and active states; Home keeps its intended cinematic behavior.
- Desktop report cards fit 3 across at normal zoom; smaller screens/200% zoom reflow
  without horizontal scrolling. Bounded page size prevents infinite list growth.
- Pagination covers >100 reports, last page, zero results, changed totals, filter
  reset, deep links, Back/Forward and late responses.
- Compare homepage intro frame times/long tasks/marker arrival against the current
  baseline on the affected device. Verify reduced-motion and hidden-tab paths.
- Frontend build and calendar tests; focused pagination/animation regression proof;
  full report-to-completion + weights/simulation smoke test. No ML retraining.

This document records the approved implementation and its measured limits.
