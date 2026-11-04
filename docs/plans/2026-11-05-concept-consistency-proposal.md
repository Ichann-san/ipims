# IPIMS concept clarification and frontend consistency proposal

Status: proposed, awaiting approval. No application, model, data or contract changes
are implemented by this proposal. Two parallel read-only audits informed this plan.

## Canonical definition

**IPIMS = Intelligence Public Infrastructure Management System.** Use the user's
exact expansion, including **Intelligence**.

IPIMS supports reporting, assessment, prioritization, maintenance coordination and
public transparency for public infrastructure. Roads are one infrastructure domain.
Shift One delivered a reusable reporting/lifecycle workflow across several categories
and a specialized road-network accessibility analytical pilot. Preserve those
achievements and their evaluations; clarify their applicability rather than redo them.

The current report taxonomy is Road, Sidewalk, Drainage, Street light, Bus stop,
Bridge and Other. This is current intake coverage, not proof of validated analytics
for every public asset. Broader facilities, parks, utilities and other civic assets
belong in the product's scope discussion; they must not be presented as implemented
asset-management or predictive capabilities without corresponding data and models.

## Task 1: misconception and correction register

These are observed mismatches, not an assertion that all of Shift One is wrong.
Historical design decisions remain historical; current documentation should point
to an explicit clarification/addendum rather than erase the original record.

| ID | Finding and evidence | Clarification possible now | Separate functional follow-up |
|---|---|---|---|
| C01 | README expands the name as Intelligent (`README.md:1`). | Use the canonical Intelligence expansion in current brand/glossary/copy. | None. |
| C02 | The drivable road graph is described as the infrastructure graph (`docs/plans/2026-11-03-ipims-design.md:30`). | Define platform-wide workflow separately from the road analytical module. | Domain-specific asset/network models when those domains are implemented. |
| C03 | Every category is snapped to a road (`backend/app/services/reports.py:108`, `backend/app/models.py:58`). | Show road association as nearby-road context, not the reported asset's identity. | Optional asset ID, ownership, geometry and explicit context relations. |
| C04 | Any active report category can impair road travel time (`backend/app/services/network.py:38`). | Document the implementation limitation; do not describe non-road reports as proven road disruptions. | Explicit road-disruption eligibility; a lamp, drain or bridge report must not automatically change travel capacity merely because of its category/location. |
| C05 | Road criteria and road-group weights rank every infrastructure category (`backend/app/services/reports.py:80`, `backend/app/services/scoring.py:26`). | Name and explain the legacy road-context priority calculation and its limits. | Category-specific criteria/calibration and policy for comparing asset types. A copy change alone cannot validate these scores. |
| C06 | Off-road reports lose road-derived criteria and fall back to local-road weighting (`backend/app/services/reports.py:82`, `backend/app/services/scoring.py:26`). | Unknown road context is unavailable analytics, not evidence of low urgency; remove misleading local-road identity from UI. | Explicit eligibility/unavailable state and manual triage policy. Do not invent a replacement numeric score. |
| C07 | Different asset categories share a segment-level report count (`backend/app/services/reports.py:71`). | Distinguish reports from assets and explain the existing grouping. | Asset/issue-aware grouping or reviewed category/location clustering. |
| C08 | AI verified means a non-null AI result, including non-infrastructure predictions (`backend/app/services/reports.py:121`). | Use AI assessed as the display meaning; distinguish officer validation. Preserve stored status keys. | Review/validation gate and backward-compatible eligibility/reason fields. |
| C09 | Review excludes some confidence/category disagreements; manual category correction retains earlier severity (`backend/app/services/reports.py:84`, `backend/app/routers/admin.py:62`, `ml/cv/infer.py:102`). | Describe predictions as advisory and expose existing information honestly. | Confidence/disagreement review reasons and category-aware reassessment/manual severity. |
| C10 | CV is treated as whole-taxonomy coverage; it actually has six infrastructure classes plus non-infrastructure (`ml/cv/infer.py:16`). | Publish a coverage matrix; Other remains valid manual intake with no supported AI category. | New classes require datasets, evaluation and model work, not just enum edits. |
| C11 | Infrastructure recognition is conflated with damage confirmation (`ml/cv/infer.py:19`, `ml/cv/infer.py:98`, `docs/contracts/v1/api.md:21`). | Separate asset recognition, suggested damage/severity and officer-confirmed condition. | Validate damage and severity independently. |
| C12 | Category evaluation can be read as field damage/severity accuracy (`ml/cv/EVAL.md:9`, `ml/cv/EVAL.md:40`). | Scope every claim to its task, small evaluation set and limitations. | Representative field validation; no invented performance numbers. |
| C13 | GNN can be read as the live universal impact engine; deployed scores use road simulation and GNN predicts its labels (`backend/app/seed.py:35`, `ml/gnn/EVAL.md:8`). | Separate exact road simulation from its learned surrogate and their measured evaluations. | Domain-specific models and real-world validation where applicable. |
| C14 | Facility POIs appear to be managed assets (`backend/app/models.py:31`, `ml/graph/config.py:61`). | Label them accessibility destinations, not a maintained asset inventory. | Asset identity, ownership, condition and report associations. |
| C15 | Road scenario repair cost/duration can sound like a multi-asset quotation (`ml/graph/sim.py:18`, `ml/graph/sim.py:224`, `frontend/src/pages/admin/Operations.tsx:205`). | Show estimated road-scenario costs, units and assumptions. | Asset-specific cost/duration models and verified repair scope. |
| C16 | Access restored and People affected overstate modeled travel-time/building proxies (`frontend/src/pages/admin/Operations.tsx:195`, `frontend/src/labels.ts:30`, `ml/graph/sim.py:24`). | Use modeled travel-time improvement and accurately named building proxy metrics. | Actual population/service-outcome data before claiming observed restoration. |
| C17 | Report identity and officer groupings default to road names and Not on a road (`frontend/src/pages/Reports.tsx:118`, `frontend/src/pages/admin/Dashboard.tsx:57`, `frontend/src/pages/MapPage.tsx:63`). | Lead with category, report code and known location; show nearby road secondarily. Keep road groups inside road context. | Additional category-specific asset identities as the data model grows. |
| C18 | Current docs disagree about region/model: AGENTS says Kediri; current deployment is Surabaya; old design mentions YOLO after CLIP replacement (`AGENTS.md:3`, `docs/plans/2026-11-04-stage2-ui-design.md:8`, `docs/TASKS.md:14`). | Current guide: Surabaya deployment, Kediri reproducible original pilot; label superseded model statements historical. | No regional data rebuild or retraining required for clarification. |
| C19 | Seed photos/locations and fallback departments can appear authoritative (`backend/app/demo.py:64`, `backend/app/demo.py:85`, `backend/app/demo.py:106`). | Keep synthetic/demo provenance explicit; do not imply sourced photos depict those exact Surabaya assets. | Realistic domain locations and verified responsibility/routing policies. |

### Task 1 deliverables

1. One canonical concept clarification/addendum with glossary and capability matrix:
   product scope, implemented workflow, evaluated road analytics, unsupported domains,
   known semantic limitations and future domain expansion.
2. Reconcile current README, agent guide and demo narrative; preserve historical
   Shift One design/evaluation results with a clear supersession link.
3. An agreed content/metric dictionary for Task 2, including full/short/action labels.
4. A separate analytical follow-up specification for C04-C09 and asset expansion.
   These backend/schema/scoring/model changes are **not** silently included in the
   frontend refactor or the documentation clarification.

## Task 2: frontend inconsistency register

One app font already exists: Plus Jakarta Sans is loaded for body and ordinary
buttons/inputs/selects in the browser. The correction is font inheritance plus a
consistent hierarchy, not replacing the site's font or making every text size equal.

| ID | Finding and evidence | Planned fix |
|---|---|---|
| U01 | Map DOM/popups inherit Mapbox Helvetica; popup CSS only resets surfaces (`frontend/src/index.css:3`, `frontend/src/index.css:134`). | Apply app typography to application-owned map DOM/popups. Preserve vendor map labels, watermark and attribution. |
| U02 | Chart ticks set Jakarta but tooltips retain Chart.js's Helvetica default (`frontend/src/ui/Charts.tsx:28`). | Resolve CSS font/colors for chart construction, including tooltip title/body/footer. |
| U03 | Equivalent labels/controls use 10/11/12/13/14/15px and inconsistent weight/leading; headings lack role ownership (`frontend/src/ui/core.tsx`, `frontend/src/map/MapDock.tsx:18`, page files). | Define a small semantic scale for page/section/dialog titles, body, controls, metadata, captions and metrics; preserve hero and intentional compact variants. |
| U04 | Canonical expansion is absent; region copy can be hardcoded (`frontend/src/pages/Home.tsx:66`, HTML/manifest). | Share brand constants and derive deployment region from existing region data. Keep official organization/place names accurate. |
| U05 | One median metric has Approval time, Approval median and Median to approval labels (`Home.tsx:79`, `Transparency.tsx:34`, `Dashboard.tsx:75`). | Verify backend event semantics, then use one metric definition/label/formatter. |
| U06 | Priority precision, placeholders, dates/time zones and IDR formatting vary (`frontend/src/labels.ts:49`, `frontend/src/labels.ts:53`, Reports/Dashboard/Operations). | Central formatters for precision, unavailable values, currency and WIB date/time conventions; distinguish a true zero from unavailable. |
| U07 | Status full/short/action labels drift; officer actions use past-tense states (`frontend/src/ui/Progress.tsx:6`, `frontend/src/labels.ts:14`, `Dashboard.tsx:200`). | Explicit full/short/action dictionaries; retain API enums and progress-history behavior. |
| U08 | Collection controls use singular Report/Facility (`frontend/src/pages/MapPage.tsx:82`). | Consistent collection/action vocabulary from the shared dictionary. |
| U09 | Button/ButtonLink duplicate sizes/variants with different interaction styling (`frontend/src/ui/core.tsx:15`). | One style owner, separate native button and anchor semantics. |
| U10 | Icon controls repeat styling/state handling in dock, pagination, navbar and core (`MapDock.tsx:15`, `Pagination.tsx:15`, `Navbar.tsx`, `core.tsx:35`). | Small explicit control variants with consistent focus, disabled, hover and motion behavior; preserve distinct shapes where justified. |
| U11 | Chip, Queue/Simulate and Before/After implement related selections differently; tab semantics incomplete (`core.tsx:69`, `Operations.tsx:144`, `Operations.tsx:183`). | Reuse a narrow segmented-selection primitive; use pressed buttons or complete keyboard/tab relationships as appropriate. |
| U12 | Inputs/selects mix shared colors with ad hoc heights/width overrides and caption sizes (`core.tsx:79`, `Dashboard.tsx:236`, `index.css:139`). | Shared default/compact control sizes and field-label rules. Compact officer layouts remain explicit. |
| U13 | Centered Stat labels truncate without full access (`frontend/src/ui/core.tsx:93`). | Preserve centered values; allow readable wrapping or an accessible full label. |
| U14 | Status colors duplicated in CSS, badges, map and charts (`index.css:27`, `core.tsx:47`, `map/layers.tsx:7`, `Charts.tsx:99`). | One semantic source with CSS/canvas/map adapters. Keep impact ramps, category and facility scales distinct. |
| U15 | Report identity/category/location/time/status rebuilt in public cards, popups, transparency and officer screens. | Extract small report identity/metadata pieces; keep page-specific photo layout and actions. Apply Task 1 category-first vocabulary. |
| U16 | Public/officer timelines repeat markup (`Reports.tsx:157`, `Dashboard.tsx:241`). | Share timeline presentation while preserving actual status history, notes and role-specific actions. |
| U17 | Table semantics/typography vary; queue has no scopes/caption and abbreviates Priority to P (`Charts.tsx:54`, `Dashboard.tsx:92`). | Shared table conventions, explicit accessible labels and role-appropriate density. |
| U18 | Dashboard rows only open on mouse click (`frontend/src/pages/admin/Dashboard.tsx:105`). | A genuine report link usable by keyboard; preserve convenient pointer hit area. |
| U19 | Modal/sheet claim modality without complete focus trap/return behavior (`frontend/src/ui/core.tsx:134`). | Shared overlay focus, return-focus and scroll ownership; preserve ESC, URL-close and browser navigation. |
| U20 | ErrorNote always says Could not load, including report submission (`core.tsx:118`, `Reports.tsx:305`). | Context-aware error heading/message and appropriate announcements. |
| U21 | Empty/loading/error states differ or disappear in map, charts, transparency and officer queue (`Charts.tsx:68`, `Transparency.tsx:64`, `Operations.tsx:153`, `map/layers.tsx:24`). | Consistent compact states and retry behavior appropriate to each surface. |
| U22 | Loading/error can display 0 reports; bounded lists imply complete coverage (Reports:69; Home/Map limit100; officer limit200; Transparency limit12). | Separate unknown/loading/error from zero; label latest/shown/total honestly. A new comprehensive map-data endpoint is a separate contract task, not an implicit refactor. |
| U23 | Map configuration errors expose VITE_MAPBOX_TOKEN to end users (`frontend/src/map/MapCanvas.tsx:64`). | User-facing map-unavailable state; configuration details remain developer diagnostics. |
| U24 | Footer's object-cover/object-contain conflict and framing comment disagree with current user-edited sizes (`frontend/src/ui/Footer.tsx:17`). | Reconcile classes/comments after a visual baseline, preserving the user's chosen optical sizes, centerline, divider, names and credits. |
| U25 | Existing navbar exceeds 320px by about 1.7px; fixed overlay offsets assume panel sizes (`Navbar.tsx:18`, `index.css:157`). | Fix narrow navigation and any reproduced collisions; measure active panel clearance where fixed assumptions demonstrably fail. |
| U26 | Operations camera padding hardcodes left420/top120/bottom80 (`frontend/src/pages/admin/Operations.tsx:89`). | Frame against actual viewport/panel/footer bounds; preserve home camera/entrance/overscan. |
| U27 | Manifest references deleted icon-192/icon-512 assets (`frontend/public/manifest.webmanifest:12`). Browser requests return HTML, not icons. | Reconcile installable icons with the supplied branding and required declared dimensions; do not blindly undo user deletions. |
| U28 | DevUI omits important variants/states and its report example depends on live data (`frontend/src/pages/DevUI.tsx:64`). | Deterministic fixtures and a reference catalog of type, controls, forms, reports, overlays, states and shell variants. |

## Delivery plan after approval

### 0. Preserve and establish the baseline

- Record existing user diffs and current rendered states. They are part of the
  baseline, not disposable noise and not automatically included in our commits.
- Cover public/officer pages, report creation/detail, modal/sheet and map modes at
  desktop, tablet, 320/390px phone, short viewport and 200% zoom.
- Record the behavior boundary: routes/URLs, filters/pagination/back-forward,
  report lifecycle, API contracts, current analytical outputs and error behavior.

### 1. Run the two approved tracks in parallel

- Concept agent owns current concept/glossary/capability and misconception documents,
  README/agent-guide/demo wording proposals. It does not migrate backend data/models.
- Frontend agent owns the consistency inventory, minimal style/token proposal and
  shared primitive refactor. It uses the approved dictionary before changing copy.
- Parent coordinates shared vocabulary, integration, validation and graph output.
  File ownership is explicit; two agents never edit the same module concurrently.

### 2. Establish shared ownership before touching all pages

- Define brand, full/short/action labels, metric descriptions and formatters.
- Define semantic type/control roles using existing Jakarta/navy/coral styling.
- Resolve actual font leaks and branding/manifest defects.
- Consolidate the repeated button styles, icon-control variants, fields, report
  metadata/timeline, state feedback and overlay behavior only where reuse exists.
- Keep interfaces stable and intermediate changes buildable. No new UI framework,
  generic infrastructure plugin system or font dependency is needed.

### 3. Apply the conventions across routes

- Update Home, Reports, public Map, Transparency, sign-in, Dashboard and Operations.
- Lead with category/report identity and known location; use nearby road as context.
- Correct misleading metric names and scope notes without pretending that a copy
  change fixes unsupported backend analytics.
- Fix reproduced responsive/keyboard/focus failures and truncation.
- Complete deterministic DevUI examples as the shared reference.

### 4. Validate the preserved behavior and the actual corrections

- Frontend build, lint and relevant existing tests; focused checks for changed
  formatters, shared controls and overlay behavior where regression proof is useful.
- Desktop/tablet/phone/short viewport/200% zoom checks; keyboard, focus return,
  reduced-motion, loading/empty/error and image/font loading verification.
- Existing report/officer/map smoke flows without resetting demo data. Use fixtures
  for multi-category, off-road, unavailable-analytics and empty/error presentation.
- Any later backend guardrail change gets a separate Concept/API task, compatible
  contract changes, relevant backend/ML tests and explicit analytical acceptance.

### 5. Refresh Graphify and hand off

- Existing graph: 181 nodes, 475 edges, 26 frontend source files. It is tagged at
  commit 2d670ff and seven indexed files are newer; its paths guide navigation but
  do not certify present styling/content.
- Query before targeted reads, then validate against current source. Refresh from
  the correct frontend source root after integration, including relationships for
  new/extracted components and deletion of obsolete nodes where applicable.
- Check extraction coverage, source paths/locations and edge endpoints; inspect
  relevant component paths and report actual cost/limitations.
- Verify CSS, HTML, manifest/assets and tests separately when AST indexing cannot
  represent them; record that boundary instead of claiming complete coverage.
- Update graph/report/manifest, task board and handoff with changes, checks, remaining
  analytical limitations and the follow-up register. Commit scoped work; no push.

## Preserve these intentional differences

- Original homepage globe, city entrance, staged markers, slow orbit and hero type.
- 110% clipped map canvas; fixed navbar/footer; shared credits and genuine watermark.
- Public exploratory map, officer simulation and embedded report picker have
  different purposes and need not have identical layers/controls.
- Centered shared statistics; dense officer queue versus public cards.
- Navbar pills, control radii, panel radii and individual optical logo sizes.
- Existing backend status keys, routes, history, model results and regional artifacts.

## Stop conditions

The clarification is complete when product scope, current capability and unsupported
analytics are distinguishable everywhere current documentation and matching UI copy
make claims. It does not claim universal public-infrastructure analytical coverage.

The refactor is complete when the U01-U28 register is resolved or explicitly scoped
to a follow-up, equivalent UI roles use shared conventions, regression checks pass,
user-approved behavior is preserved and Graphify reflects the final source.

A valid off-road street-light report should remain recognizable as a street-light
report. Nearby road context is secondary. Its normal lifecycle remains usable; a
future analytical guardrail task must ensure it does not automatically damage road
travel times or obtain a falsely validated universal priority score.
