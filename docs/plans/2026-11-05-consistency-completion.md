# Concept clarification and consistency completion

Implemented the approved scope without rewriting Shift One, resetting data,
retraining models or changing backend/API behavior.

## Concept work

- Canonical name: **Intelligence Public Infrastructure Management System**.
- Current scope/capability/metric owner:
  [scope clarification](../concept/2026-11-05-scope-clarification.md).
- C01-C19 are individually documented and corrected in current descriptions.
  Historical design and measured evaluation results remain available with addendum links.
- README, agent guide and demo distinguish multi-category reporting from the road
  analytical pilot, current Surabaya from original Kediri, exact simulation from
  GNN surrogate, CLIP recognition from damage validation, and proxies from observed outcomes.
- [Analytical follow-up specification](../concept/analytical-followups.md) records
  C04-C09 eligibility/review requirements and representative acceptance scenarios.
  These functional problems remain open; documentation and frontend wording do not
  make the legacy cross-category road scores or AI validation behavior correct.

## Frontend finding disposition

| Findings | Delivery |
|---|---|
| U01-U02 | Application map popups inherit Jakarta; chart ticks/tooltips resolve app fonts/colors. Chart redraw after font readiness avoids fallback font measurements. Vendor basemap labels remain vendor-controlled. |
| U03 | Shared page/section/dialog/body/label/metadata/caption roles and consistent body size. Hero hierarchy remains distinct. Theme tokens are retained for dynamic canvas/catalog consumers. |
| U04 | Brand constant, canonical HTML/title/manifest and configured region label on Home. |
| U05-U08 | One median definition, WIB dates, IDR formatting, score precision, unavailable-value formatting, status full/short/action labels and collection terms. Simulation percentage is the modeled excess travel-time gap removed, not observed restoration. |
| U09-U12 | Shared button/link styling, icon-control variants, pressed segmented controls and default/compact form sizing. No dependency/framework added. |
| U13 | Shared centered Stat labels wrap rather than silently truncate. |
| U14 | Typed status palette supplies CSS variables, map pins and chart outcomes. Facility/impact/criterion scales keep their distinct meanings. |
| U15-U16 | Shared category-first report identity, coordinates, optional nearby-road context and actual event-history timeline. |
| U17-U19 | Explicit queue table headers/caption, keyboard report links, shared nested overlay focus trap/restoration and scroll locking. |
| U20-U21 | Context-aware errors, retry/state feedback for maps/queue, and deterministic catalog examples. Compact chart/list empty states intentionally fit their surfaces. |
| U22 | Unknown counts no longer look like zero. Latest100/latest12/queue200 coverage is visible; deep links fetch reports outside the map's latest100. A comprehensive map endpoint remains a separate contract follow-up. |
| U23 | Missing map configuration gets a user-facing unavailable message. |
| U24 | Conflicting footer object-fit classes/comment removed while retaining user-selected logo sizes, centerline, divider and names. |
| U25-U26 | Narrow navbar corrected; active panel height informs dock placement. Short screens cap/scroll panels; camera framing uses actual chrome/panel bounds. Native Mapbox wordmarks remain above footer/panels with overscan accounted for. |
| U27 | Manifest references the supplied SVG favicon; deleted old icon filenames are no longer required. No claim of a tested native-phone installation. |
| U28 | Deterministic catalog covers typography, controls/links, forms, progress, reports, overlays, empty/loading/error states and the shared shell. |

## Preserved behavior

- Original globe/city entrance, night style, staged markers, orbit and reduced-motion path.
- 110% clipped map canvas without added document scroll; fixed shared shell and credits.
- Existing route/query/pagination/Back-Forward behavior and user page-size options 3/6/9/12.
- Photo/GPS/AI suggestion reporting, officer lifecycle, weights and road scenario mechanics.
- Stored status enums, API contract, model artifacts and region datasets.

## Validation

- Production build passes; existing large Mapbox bundle warning remains.
- Eleven frontend tests pass, including off-road identity, unknown-versus-zero values,
  WIB boundary formatting and canonical metadata/icon references.
- Lint passes with React lifecycle/Fast Refresh advisory warnings; no lint errors.
- Existing layout suite: 16 public/officer route checks and mocked 137-report
  pagination, last-page clamp, filter reset, drawer navigation, error/empty and stale
  response scenarios pass. The suite respects the user's 12-item maximum option.
- New consistency suite: 40 route checks over desktop/tablet/two phones/short layout
  equivalent to 200% desktop zoom; nested focus trap/return, off-road identity,
  latest100 deep link, map popup font, unavailable-count and manifest checks pass.
- Eleven-step real smoke flow passes: photo/AI/GPS, report creation/search, public
  map/transparency, officer login/lifecycle, public completion, weights and simulation.
- Smoke-created reports IPIMS-2026-000192 and IPIMS-2026-000193 are completed. The
  first was left by an outdated test assertion and completed through normal status
  transitions after verifying its exact test description. No report deletion/reset.
- Desktop/phone visual review plus targeted theme, keyboard and map clearance checks.

## Graph and remaining boundaries

The refreshed graph is a navigation aid for frontend TypeScript/TSX. CSS, HTML,
manifest/assets, tests and concept/backend/ML documents were checked separately.
See `graphify-out/GRAPH_REPORT.md` for counts, extraction cost and unresolved raw
AST edge limitations. It does not certify styling, accessibility or analytical validity.

No backend test run or model evaluation is claimed: neither layer changed. Domain
asset registries, score calibration, disruption/review eligibility and broader CV
validation remain explicitly specified follow-ups, not concealed unfinished refactor work.
