# Mobile UI repair proposal

Status: proposed; implementation awaits approval. Application code is unchanged.
Baseline: current development site at commit `bee5bab`, including the user's recent
content simplification. Preserve the desktop visual direction and current product
concept. This is a mobile presentation/interaction repair, not another concept rewrite.

## Audit scope and evidence

Read-only Edge mobile emulation, current source review and 57 captured page/state
samples. Examined six portrait sizes, landscape, tablet and a desktop reference:

| Viewport | Purpose |
|---|---|
| 320 x 568 | Small/short phone; most severe obstruction |
| 360 x 640 | Common narrow phone |
| 375 x 667 | Short phone |
| 390 x 844 | Reference modern phone |
| 412 x 915 | Larger Android-sized viewport |
| 430 x 932 | Large phone |
| 844 x 390 | Phone landscape |
| 768 x 1024 | Tablet portrait |
| 1366 x 900 | Desktop preservation reference |

Covered Home, Reports, public Map, selected map reports and Transparency. Additional
samples cover officer login, Dashboard, Operations, report form and the normal animated
homepage. Browser emulation does not establish physical iOS keyboard/browser-toolbar
behavior or real-phone rendering performance.

Raw screenshots and measurements are local ignored artifacts in `.venv/mobile-audit/`.
No reports were created or modified. Officer authentication only established a local
browser session for read-only inspection.

### Confirmed problems

| Problem | Evidence | Consequence |
|---|---|---|
| Fixed chrome consumes the phone | At 320 x 568, header 66px, footer 124px and pager 120px together occupy about 55% of the screen. | Too little useful working space remains. |
| Pager obstructs content | At 320px, filter block is y142-334, first card y350-476, pager y314-434, footer y444-568. | Pager covers part of the filters and most of the first card; the footer covers its bottom. Merely staying within screen bounds is not success. |
| Uncontrolled filter wrapping | Report filters are 192px tall at widths 320/360/375/390, 148px at 412/430 and 44px on desktop. | Controls move between unrelated rows with no deliberate hierarchy. |
| Gutters change between sections | At 390px, filters start x12 but the fixed-basis 340px report cards start x25. | Search, heading and report content do not align. |
| Home readability depends on the map | Home.tsx:63 supplies a 45% tint; the radial gradient is anchored at 15%/85% for every viewport. Screens show labels and pins competing with small supporting copy and controls. | Dimming exists, but the desktop treatment does not adequately protect mobile content. |
| Map overlays compete | Selected report popup remains anchored inside the map while a separate dock, layer panel and full footer stay open. At 320px, most of the selected card is covered. | No clear primary surface; marker/card relation and available actions become confusing. |
| Width-only breakpoint misclassifies landscape | At 844 x 390, desktop-style navigation and a 211px vertical dock activate. The report pager overlaps the first card again. | A wide but short phone is treated as a roomy desktop. |
| Officer workflow starts below the fold | Dashboard table starts at y711 on the 320 x 568 sample. | Metrics, filters and explanatory copy precede the actual queue across multiple screens. |
| Form workspace is constrained | The report sheet is only 326px tall on a 568px-high phone because header/footer clearances are subtracted. | A photo/location form has little room; keyboard-open behavior needs explicit handling. |
| Tests missed visual obstruction | Earlier checks emphasized page overflow, footer uniqueness and control bounds. | They did not establish readable hierarchy, unobstructed cards, task visibility or sensible simultaneous panels. |

Fixed pixel values contribute, but units alone are not the root cause. Several
independent fixed/absolute surfaces compete for the same viewport. Replacing every
`px` with `rem` would preserve that conflict.

## Recommended direction

Keep the desktop world: navy/coral, Jakarta, glass surfaces, globe entrance, reporting
and map features. Give mobile a deliberate hierarchy and compact interaction patterns,
sharing the same data, business logic, URLs and core components.

| Approach | Trade-off |
|---|---|
| CSS spacing/dimming patch | Smaller change, but full footer, floating pager and concurrent map panels continue competing for space. |
| Mobile shell and state-specific panels (recommended) | More targeted frontend work; recovers space and fixes interaction ownership while preserving desktop and shared logic. |

## 1. Mobile shell and spacing

- Compact mobile app bar, approximately 56px: brand, primary Report action, and a
  clearly labelled accessible menu. Navigation destinations keep text labels in the menu.
  Desktop floating pill remains unchanged.
- Compact persistent footer, target roughly 48px at default text size, growing if
  content/text scaling requires it. Show copyright and map attribution with an About
  control; institutional logos and team names remain available in the expanded panel.
- This is an explicit mobile-only change to the earlier full-footer presentation.
  Full desktop logos/names/footer remain unchanged. Map credits and the genuine
  Mapbox wordmark remain visible while a map is displayed.
- One mobile workspace bounded by header and footer. Use grid/flex rows and actual
  available height; page controls should not independently subtract/add several
  footer/header constants. Keep one primary content scroll region per page.
- Share responsive gutters and spacing tokens across titles, filters, cards and sheets.
  Use relative units/fluid gutters and content-based widths; retain deliberate fixed
  border widths and usable touch targets.
- Main reading/form text stays readable; primary controls retain about 44px tap areas.
  Reclaim space through grouping and disclosure rather than shrinking all text/buttons.
- Account for safe-area insets, browser viewport changes and short landscape. Select
  compact layouts by actual available width/height, not phone brand or width alone.

## 2. Homepage

- Keep the live globe-to-city entrance and original scene; desktop motion unchanged.
- On mobile, pause idle orbit after the entrance settles to reduce moving distractions.
  Continue honoring reduced-motion preferences. Do not replace the scene with a bitmap.
- Give mobile a stronger full-width gradient and predictable dark backing behind the
  content. Establish explicit map/scrim/content layers instead of relying on paint order.
- Keep the headline and primary actions dominant; use a short region line. Put secondary
  coordinates/long product explanation in supporting details where space is constrained.
- Align Report/Open map as one action group. Use a compact centered KPI strip with
  bounded number sizes and readable labels.
- Position the hero within the mobile workspace. Short screens may scroll its content
  naturally; no clipping, footer collision or awkward nested scroll as the default.

## 3. Reports

- Explicit structure: title/count, search plus Filters button, scope selector, report list,
  then pagination. Category, sort and page size live in a labelled filter sheet.
- Show active filter summaries when relevant. Preserve current URL query, reset/clamp,
  browser Back/Forward and page-size capabilities; application logic remains shared.
- Full-width mobile cards aligned to the page gutter. Give category, code, date, status
  and priority distinct visual roles; avoid a run-together long title. Put secondary
  values together where they fit, not on an arbitrary new line for every field.
- Keep photos compact and proportional; no unnecessary desktop card width/basis on phones.
- Mobile pagination becomes Previous / Page x of y / Next. Place it after the results
  in the content layout so it cannot float across filters or cards. Desktop numbered
  pagination remains available.
- Keep a small default page size, but allow a short, controlled scroll. Do not force
  every report onto one screen by making its text tiny.

## 4. Public Map

- Let the map occupy the mobile workspace. Position UI relative to that workspace,
  not the overscanned canvas or the entire document.
- Idle: compact zoom controls and a Layers entry point; no permanently expanded filter card.
  Move secondary 3D/compass options into the map control sheet where appropriate.
- Layers open: one sheet with visibility controls, legend and coverage information.
- Report selected: replace the layer sheet with a compact report peek containing
  thumbnail, identity, status, View details and explicit Close. Expand for full details.
  Desktop keeps anchored popups and its current controls.
- Use one panel-state owner so layer controls and selected-report cards cannot both
  occupy the same space. The map camera keeps the marker in the unobstructed region.
- In portrait, keep the report peek to a minority of available workspace where possible.
  In short landscape, use a compact side detail surface with its own scroll instead
  of piling bottom panels into the remaining height.
- Preserve 110% canvas overscan as a background treatment, clipped to the map workspace.
  Recalculate native control/watermark and camera geometry against that workspace;
  do not reuse `10dvh` as if it meant 10% of every container.

## 5. Other routes and overlays

- Transparency: compact metric groups, section disclosure/chart selection, and a short
  report-progress preview with View all. Preserve all metrics and accessible chart data.
- Dashboard: put the actionable queue first after a compact summary; use mobile queue
  cards instead of squeezing the desktop table. Filters/weights become deliberate controls.
- Operations: reuse the mobile map panel rules for queue/simulation. Keep model scope
  and assumptions discoverable and accurate, without using a large permanent paragraph
  as the queue's first visible item.
- Report creation/detail and long officer forms: mobile full-screen sheet with its own
  close/back header, one scroll body and reachable actions. Keyboard-open space takes
  precedence over keeping the decorative full branding footer in view.
- Reuse focus trapping/restoration and URL/history behavior. Preserve entered text,
  filters and map selection across responsive layout changes.

## Mobile layout sketches

```text
HOME                         REPORTS
+------------------------+   +------------------------+
| IPIMS   Report   Menu   |   | IPIMS   Report   Menu   |
+------------------------+   +------------------------+
|                        |   | Reports             47 |
|    live map / globe    |   | [ Search... ] [Filters]|
|                        |   | [ All Active Completed]|
| stronger content scrim |   | +--------------------+ |
| Broken Infrastructure, |   | |photo category/code | |
| Fixed.                 |   | |      date / status | |
| [Report] [Open map]    |   | +--------------------+ |
| 31 active 16 done 29h  |   |       more reports     |
|                        |   | [Prev]  1/16   [Next] |
+------------------------+   +------------------------+
| IPIMS / credits  About |   | IPIMS / credits  About |
+------------------------+   +------------------------+

MAP: idle                    MAP: selected report
+------------------------+   +------------------------+
| IPIMS   Report   Menu   |   | IPIMS   Report   Menu   |
+------------------------+   +------------------------+
|                   [+]  |   |                   [+]  |
|                   [-]  |   |                   [-]  |
|                        |   |       selected pin     |
|      usable map        |   |                        |
|                        |   | +--------------------+ |
| [Layers]  small legend |   | |photo report     [X]| |
|                        |   | |status  View details| |
+------------------------+   +------------------------+
| IPIMS / credits  About |   | IPIMS / credits  About |
+------------------------+   +------------------------+
```

The compact footer includes visible attribution text on map views. Logos and team
details are expanded through About; they are not removed from the product.

## Implementation sequence after approval

1. Preserve current desktop screenshots/state and user content edits. Establish a
   mobile layout/scroll/overlay contract in SiteFrame, Navbar, Footer and CSS.
2. Build the compact shell and mobile form/sheet geometry, then Home contrast/layout.
3. Reorganize Reports filters/cards/pagination using existing query/data behavior.
4. Implement the public map's idle/layers/report panel states and camera clearances.
5. Apply the same conventions to officer pages and Transparency; keep desktop variants.
6. Validate the whole matrix, fix findings as one bounded batch, confirm visually,
   update regression checks and refresh Graphify for any new shared components.

Likely owners: ui/SiteFrame.tsx, ui/Navbar.tsx, ui/Footer.tsx, ui/core.tsx,
ui/Pagination.tsx, ui/ReportSummary.tsx, index.css, public/officer page presentations,
map/MapDock.tsx, map/MapCanvas.tsx and map/layout.ts. No backend/model/schema work.

## Acceptance gates

- At 320 x 568, the first report is visible and tappable after loading; pager and
  footer do not cover filters, cards or focus targets.
- Page titles, search, cards and sheet content share coherent mobile gutters.
- Home headline, supporting copy and primary actions remain readable across busy map
  positions and during the entrance, not only against a favorable static camera frame.
- Idle Map does not begin with an expanded multi-control panel; selected detail and
  layer selection do not overlap. Selected markers remain in useful visible map space.
- Short landscape uses a compact layout, not the desktop arrangement solely because
  its width exceeds 768px.
- Officer queue becomes an early actionable surface rather than starting below several
  screens of summary content. Login and all form actions remain reachable.
- Test menu, filters, selection, report/detail sheets, errors/loading, long labels,
  larger text/200% zoom, orientation changes, keyboard-reduced viewport and safe areas.
- Check visible hit targets with actual occlusion/hit testing, not only scrollWidth
  and bounding-box assertions. Add visual review gates alongside functional checks.
- Compare 1366/1440px desktop references to prevent unintended visual regressions;
  preserve desktop map, shell, report layout and functionality.
- Build/lint/relevant tests and existing report/officer/map workflows still pass.
- Verify real iOS Safari/Android Chrome keyboard/browser bars when devices are available;
  label emulation limits rather than claiming physical-phone validation.

This plan deliberately changes the mobile full-footer presentation and panel behavior.
Approval should cover those mobile-specific choices before implementation starts.
