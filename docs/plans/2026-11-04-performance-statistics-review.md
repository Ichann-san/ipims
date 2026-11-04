# Map performance and statistics review — 2026-11-04

Status: approved and implemented as R2, with the homepage exception below.

## Final scope and validation

The user approved implementation, then explicitly rejected the static homepage
preview. The original globe entrance, tilted city view, lighting, report markers,
and continuous rotation are restored. Static assets were removed. Do not replace
or reduce the homepage scene without a new agreed approach.

Working public/admin maps start with Mercator, restrained pitch and padded region
bounds. Detailed 3D buildings are opt-in; trees, facades and landmarks remain off
in working views. The GPS picker is unrestricted. Stale road/facility requests are
aborted and report GeoJSON is memoized. No extra culling engine or new tile service.

Five Chart.js charts replace the handmade graphs; each has a text/table alternative.
Chart code stays out of map-only routes. Empty/error states and 1366/390 px layouts
were checked in Edge with no browser errors or horizontal overflow. Stage colors
resolve the existing CSS tokens to concrete canvas colors. Zero counts have no bar.

Statistics now group calendar months in WIB; the trend fills six consecutive months,
and the dashboard selects the actual current month. Approval/overdue KPI counts use
the full dataset rather than the queue page. Event loading is batched. API contract
records the two additive aggregates and calendar semantics.

Validation: frontend production build, 2 calendar tests, backend 16 tests, full e2e
11 steps (report -> completion, weights, graph simulation). Final responsive checks
cover 3D toggling, accessible data tables, empty/error states and chart/map bundle
isolation. Lint has existing React warnings; the design detector returned no findings.

The ESM Mapbox experiment increased observed JS response bytes in this local setup
(~623 kB to ~967 kB) and was reverted, including its build alias. The original Mapbox
bundle remains 524.58 kB gzip. Do not claim a measured FPS improvement: the baseline
working map already sampled ~16.9 ms p95 frame spacing in this headless run, which
does not reproduce the user's device lag. Homepage optimization remains open.

The sections below preserve the original review and alternatives as background;
the static homepage and ESM suggestions were not retained.

## Context restored

Continued in Codex from Claude session `01e834b0-5fb1-43f7-ba73-8b213409b1d5`.
The unfinished request was to review map lag, Surabaya-only rendering / Minecraft-like
culling, and using Chart.js for more professional statistics. The user confirmed that
both initial loading and moving the map are slow.

Preserve the approved dark navy / blue / orange identity, Plus Jakarta Sans, short
copy, the headline "Broken Infrastructure, Fixed.", Surabaya scope and working
report / simulation flows. Phone testing and demo video remain open.

## Evidence and limits

- `frontend/src/pages/Home.tsx`: starts at zoom 2.1, flies for 5.2 seconds into a
  city view at pitch 58, then changes bearing through requestAnimationFrame.
  There is reduced-motion support, but no explicit visibility listener despite
  the comment describing one. Browsers generally throttle background RAF; do not
  claim the animation necessarily runs at full speed in hidden tabs.
- `frontend/src/map/MapCanvas.tsx`: every map shares Mapbox Standard, night lighting
  and globe projection. POI/transit labels are disabled; there are no bounds,
  zoom constraints or explicit 3D quality controls.
- `frontend/src/map/layers.tsx`: roads already request the viewport bbox from zoom
  13; facilities from zoom 12. Requests happen after movement ends. Cleanup ignores
  stale results but does not abort requests. The backend caps roads at 5,000 per
  response. Do not replace this cap with a smaller arbitrary cap that hides roads.
- Route chunks are already lazy loaded, but Home imports the map immediately, so
  the initial home route still requires its library.
- Current installed Mapbox GL JS: 3.34.2. Production build passes. Mapbox JS chunk:
  1,879.95 kB minified, 524.58 kB gzip. These are emitted bundle sizes, not measured
  browser transfer times, parse times, FPS or memory use.
- No browser performance trace or visual inspection was performed in this review.
  Continuous camera updates and scene complexity are credible contributors, not
  a measured allocation of the slowdown.

## Rendering idea

Mapbox already selects visible tiles and uses frustum checks. Building a second
culling engine is unnecessary. `maxBounds` constrains navigation; it does not
clip tiles to the administrative boundary or remove every nearby feature.
A mask can communicate the city boundary, but is not proof of rendering savings.
The deployment already uses Surabaya infrastructure data.

| Approach | Benefit | Trade-off |
|---|---|---|
| A. Tune current scene | Remove orbit, shorten intro, reduce decorative 3D | Retains the live homepage map's startup cost |
| B. Lighter home + focused working maps (recommended) | City-first views, no continuous orbit, restrained pitch, bounded navigation, optional detailed 3D; static home preview if acceptable | Changes the globe entrance; detailed 3D becomes an explicit choice |
| C. Dedicated city tiles / custom basemap | More control of geometry and detail by zoom | Extra data generation, hosting and styling work; defer until profiling justifies it |

For B, reuse region config with enough boundary padding for edge reports and map
aspect ratios. Do not clamp the report form's GPS flow without preserving its
existing out-of-network behavior. Keep full-city report and simulation coverage.
Check Mapbox's ESM entry through react-map-gl's map library integration for a
smaller initial payload. Add request cancellation, caching and stable source data
where profiling supports them. Do not introduce a second map engine.

Before/after validation: same device/browser, production build, cold and warm
loads, time to first useful map, transfer size, long tasks, pan/zoom frame times,
memory and requests. Include a real phone. Preserve all active report locations,
road selection and simulation before/after behavior.

## Statistics findings and proposal

`frontend/src/pages/Transparency.tsx` uses custom HTML bars and a small grouped
monthly chart. Chart.js is not installed. Confirmed issues:

- Zero counts are drawn at a minimum 2% width.
- The trend selects the latest six populated month entries; missing calendar
  months are not filled, so "6-month trend" can show a misleading interval.
- Dashboard "Completed this month" uses the last populated month rather than
  matching the current month.
- Dashboard active / approval / overdue counts derive from the queue response
  (requested limit 200), so they can undercount larger datasets.
- `completed_rate` in the API means completed / (completed + rejected); the public
  completed KPI means completed / total. Name denominators explicitly.
- Approval time is correct: backend `median_hours_to_verify` measures the first
  `gov_approved` event. The field name alone must not be used to infer AI timing.

Recommended chart mapping:

| Question | Presentation |
|---|---|
| Active / completed / rejected share | One doughnut with counts and labelled percentages |
| Reports by workflow stage | Horizontal bars, preserving stage order |
| New versus completed over time | Grouped columns for six consecutive calendar months |
| Category / district comparison | Sorted horizontal bars |
| Progress of an individual report | Keep the existing stage tracker |

Use shared Chart.js theme/options and typed adapters over `/stats`, selective
component registration, responsive containers, restrained animation and text/table
alternatives for canvas content. Charts must remain out of map-only route bundles.
Most replacements can reuse `/stats`; any new aggregate or filter must update the
API contract in the same change. Charts alone do not correct metric semantics.

## Primary references

- [Mapbox performance](https://docs.mapbox.com/help/troubleshooting/mapbox-gl-js-performance/)
- [Mapbox tile/frustum source](https://github.com/mapbox/mapbox-gl-js/blob/main/src/geo/transform.ts)
- [Navigation bounds](https://docs.mapbox.com/mapbox-gl-js/example/restrict-bounds/)
- [Standard 3D controls](https://docs.mapbox.com/map-styles/reference/standard/)
- [ESM bundler integration](https://docs.mapbox.com/mapbox-gl-js/guides/bundler/)
- [Chart.js selective imports](https://www.chartjs.org/docs/latest/getting-started/integration.html)
- [Chart.js accessibility](https://www.chartjs.org/docs/latest/general/accessibility.html)

Next: develop a homepage performance approach that preserves the original appearance,
and validate on the user's real phone. U5 demo recording remains open.
