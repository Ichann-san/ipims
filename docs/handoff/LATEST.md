# Handoff ? 2026-11-04 (Codex), working maps and statistics

## State

Branch `rebuild/v1`; nothing pushed. Stage 2 is built. R1 restored the Claude session;
R2 implements the approved working-map and chart changes. U5 (real phone + demo video)
remains open. Design/review: `docs/plans/2026-11-04-performance-statistics-review.md`.

## Done this shift

- Public/admin maps: padded region bounds, lower initial pitch, Mercator projection,
  optional detailed 3D buildings; decorative 3D trees/landmarks/facades disabled.
  Report GPS picker stays unrestricted. Stale viewport requests are aborted; report
  GeoJSON is memoized. Report selection and simulation remain functional.
- Transparency: Chart.js doughnut, stage/category/district bars and grouped monthly
  columns, shared theme, text/table alternatives, responsive/empty/error states.
  Zero counts have no bar; six consecutive calendar months include empty months.
- Statistics: WIB month boundaries, actual current-month dashboard selection,
  full-dataset approval/overdue counts (independent of 200-row queue page), batched
  status-event loading. API contract and regression tests updated.

## User correction ? preserve the homepage

The user rejected the static homepage preview. The original globe fly-in, pitched
city view, night lighting, live markers and rotation are restored. Static previews
were deleted. Keep the headline "Broken Infrastructure, Fixed." and the approved
navy/blue/orange identity and Plus Jakarta Sans. Homepage efficiency needs a new
approach that keeps its original appearance. No static replacement is approved.

The modular Mapbox experiment increased observed JS response bytes locally and was
reverted. Original map library is retained (524.58 kB gzip); no measured FPS gain is
claimed. Baseline headless working-map p95 frame interval was already ~16.9 ms;
profiling must be repeated on the device where lag occurs.

## Verified

- `frontend`: production build passes; `npm test` 2/2 calendar regressions.
- `backend`: pytest 16/16, including >200-report totals and UTC/WIB month boundary.
- Full e2e: 11 steps pass (new report, GPS/photo AI, public map, transparency,
  officer lifecycle through completion, weight save, real-graph simulation).
  It created and completed one test report; demo data was not reset.
- Final Edge checks at 1366x900 and 390x844: 5 charts, data tables, 3D toggle,
  no page errors/overflow; empty/error states pass. Screenshots in ignored
  `frontend/dist/qa/` (a future build clears these).
- Lint exits successfully with existing React warnings. Design detector: no findings.

## Runtime and remaining work

Verification preview is on http://127.0.0.1:5289, proxied to the updated API on 8001.
The original API on 8000 was left untouched; restart it to load backend changes if
using the normal frontend dev server. PostGIS is running on 5433. Normal web port:
5288 (other projects use 5173/5174). No reseed or model retraining is needed.

- Real phone check (use `npm run dev:https` for GPS on a LAN phone).
- Record demo following `docs/DEMO.md`; its button names still need English updates.
- Restrict the Mapbox token to the intended local URLs in the Mapbox account.
- Optional English route names remain deferred.
- CV is not evaluated on Surabaya citizen photos; severity is not evaluated.
  Impact uses assumed speeds and building counts, not observed traffic.
  OSM facilities mapped solely as relation polygons are not counted.
- Region: Surabaya by default, all 31 kecamatan; Kediri remains configurable.
  Custom Standard night data layers require emissive strength 1.
