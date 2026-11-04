# Handoff - Codex R5 implementation complete

## State

Approved plan implemented on `rebuild/v1`; nothing pushed.
Plan and measured limits: `docs/plans/2026-11-04-shell-map-reports-plan.md`.
Previous review docs remain background; this handoff supersedes their pending layout work.

## Implemented

- SiteFrame owns the fixed navbar/footer on all public, officer, login and catalog
  routes. ResizeObserver supplies shared header/footer insets. Pages, drawers, map
  overlays and pagination clear the chrome, including a short phone viewport.
- Home/public Map canvas is 110% tall and clipped without extra page scroll. The
  homepage retains its globe entrance, city camera, night scene, headline and orbit.
- One matte-glass map dock replaces the detached 3D/native controls. Desktop is
  vertical; phone is horizontal above panels. 44 px targets, zoom, compass and 3D.
  Interactive-map wordmarks sit above panels; the homepage wordmark remains below.
- Full-screen maps share visible footer credits and no circled attribution button.
  Genuine Mapbox wordmarks stay. Embedded report maps keep their attribution control.
  User believed watermark alone was sufficient; official Standard requirements were
  checked and text credits retained: https://docs.mapbox.com/help/dive-deeper/attribution/
- Home prefetches reports during fly-in, attaches report layers after initial move
  completion plus idle/750 ms fallback, then starts the original orbit. Reduced motion,
  unmount cancellation and hidden-tab pause/resume are handled.
- Reports wrap as 3/2/1 compact cards with bounded page sizes 3/6/9/18. Server offset
  pagination, URL filters/page state, Back/Forward and drawer return preserve context.
  Invalid pages and changing totals clamp safely. Shared useAsync cancels/ignores
  superseded requests; listReports accepts an optional AbortSignal.
- Removed three Link/Button nests using ButtonLink. Shared centered Stat retained.
  Catalog demonstrates dock/card/pager and its mobile overflow is fixed.
- No backend/schema/API contract change, new dependency or model retraining in R5.

## Verified

- Frontend production build passes. `npm test`: 8 tests (entrance lifecycle, pagination
  validation/navigation, WIB calendar). Lint has existing React warnings; detector
  returned no findings. `git diff --check` passes.
- `e2e/layout.py --base http://127.0.0.1:5289`: 16 route/viewport checks (1366x900,
  390x844), plus 137 mocked reports. Covers last/invalid pages, changed totals, filter
  reset, Back/Forward, drawer return, empty/error states, stale responses and narrow
  reflow. No page errors or horizontal overflow. No reports written by this test.
- `e2e/smoke.py --base http://127.0.0.1:5289`: 11 steps pass through photo/GPS,
  report creation, approval/assignment/repair/completion, weight save and simulation.
  Test selectors now parse code from URL path and target chart headings explicitly.
- Reduced-motion home and report form at 390x500 pass. Final 3D toggle and wordmark
  clearance checked after last small fix. Hidden-tab handling was source-reviewed;
  a physical phone / real device performance check remains open.
- Three smoke reports were created: IPIMS-2026-000189/190/191. The first two runs
  stopped on test-selector issues; their reports were completed through the normal
  lifecycle afterward. All three are completed; no reseed or report deletion.
- Backend 16 tests and ML 5 tests last passed in earlier shifts; not rerun for this
  frontend-only change. Current backend was exercised by the full end-to-end test.

## Performance evidence and limits

Exploratory headless Edge samples against commit 2d670ff:
- Desktop p95 frame interval before/after: 33.3/17.1 ms; reversed ordering: 66.2/17.2 ms.
- Phone-size p95: 17.2/17.2 ms, no clear improvement.
- Long-task totals before/after: desktop 2420/852 ms (reverse 2727/1887), phone 525/491.
- New overlay-ready marker: about 6.7 s desktop / 7.1 s phone from navigation.
Short local samples have large baseline variance and are not a device-wide guarantee.
Canvas overscan adds pixels. Keep the original scene; no static replacement approved.
The original Mapbox bundle remains 524.58 kB gzip; the earlier ESM experiment is reverted.
The isolated baseline preview on 5290 was stopped; benchmark output was in ignored dist.

## Runtime and next steps

Review preview: http://127.0.0.1:5289 (updated API on 8001). Original API on 8000
was left alone. Normal dev port is 5288; PostGIS is running on 5433. No reseed needed.
A new build clears ignored dist screenshots; regenerate using e2e/layout.py --shots DIR.

- U5: physical phone/GPS check and demo recording remain open. For LAN phone GPS,
  use npm run dev:https. Demo script still needs its older button names updated.
- Restrict Mapbox token to intended local URLs in the account.
- Optional English route names remain deferred.
- Known ML limits: CV not measured on Surabaya citizen photos; severity not evaluated;
  impact uses assumed speeds/buildings rather than traffic; relation-only OSM
  facility polygons are not counted. Region remains configurable (Surabaya default).
- Graphify index refreshed: 26 source files, 181 nodes, 475 edges; zero extraction
  LLM/API tokens. Health warning: 44 dangling endpoints, 3 collapsed relations.
  Source/browser verification remains authoritative over incomplete graph traversal.
