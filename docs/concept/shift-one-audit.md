# Shift One scope audit

Historical findings recorded before the November 5 clarification. File/line evidence
refers to that baseline, not current source locations. Current scope and corrections
are maintained in [scope clarification](2026-11-05-scope-clarification.md); functional
C04-C09 work remains in [analytical follow-ups](analytical-followups.md).

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

## Misconception and correction register

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
| C18 | Current docs disagree about region/model: AGENTS says Kediri; current deployment is Surabaya; old design mentions YOLO after CLIP replacement (`AGENTS.md:3`, historical stage-two design (available in Git history), `docs/TASKS.md:14`). | Current guide: Surabaya deployment, Kediri reproducible original pilot; label superseded model statements historical. | No regional data rebuild or retraining required for clarification. |
| C19 | Seed photos/locations and fallback departments can appear authoritative (`backend/app/demo.py:64`, `backend/app/demo.py:85`, `backend/app/demo.py:106`). | Keep synthetic/demo provenance explicit; do not imply sourced photos depict those exact Surabaya assets. | Realistic domain locations and verified responsibility/routing policies. |

