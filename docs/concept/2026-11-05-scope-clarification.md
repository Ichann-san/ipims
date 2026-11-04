# IPIMS scope and capability clarification

Effective 2026-11-05. This addendum clarifies the approved Shift One work and the
[Shift One audit](shift-one-audit.md), findings
C01-C19. It does not replace historical results or implement analytical guardrails.

**IPIMS = Intelligence Public Infrastructure Management System.**

The platform supports reporting, assessment, prioritization, maintenance coordination
and public transparency for public infrastructure. Roads are one domain. Shift One
delivered a reusable multi-category reporting/lifecycle workflow and a specialized
road-network accessibility pilot. This is the basis for expansion, not a redo.

The current deployment/showcase is Kota Surabaya, covering its 31 kecamatan in the
road dataset. The original Kabupaten Kediri pilot remains reproducible through
`IPIMS_REGION=kediri`. A region switch changes regional artifacts; it does not
establish analytical validity for a new infrastructure domain.

## Capability matrix

| Capability | Current reporting workflow | Current road analytical pilot | Future, unimplemented capability |
|---|---|---|---|
| Intake | Road, Sidewalk, Drainage, Street light, Bus stop, Bridge, Other; photo, location, category, report code | Nearby-road association supplies context | Verified asset inventory, ownership and asset-specific geometry |
| Assessment | CLIP suggests six infrastructure categories; Other is manual intake; officer review/lifecycle exists | Advisory road damage-type and severity prompts | Validated field damage/severity detection and category-aware review gates |
| Priority | Existing queue and adjustable weights operate across intake categories | Six road-context criteria and main/local road profiles | Calibrated asset-specific criteria and a justified policy for cross-domain comparisons |
| Impact and what-if | Report workflow can run without a road association | Exact road accessibility simulation, with a separately evaluated GNN surrogate | Drainage, lighting, structural, utility or other domain models and validated couplings |
| Coordination/transparency | Approval, assignment, repair, completion/rejection, timeline and aggregate reporting | Road repair scenario recommendations | Verified responsibility routing and observed service-outcome measures |
| Facilities | OSM destination POIs can be displayed | Health, school, market and government destinations for accessibility | Maintained facility assets with identity, condition, ownership and linked reports |

Parks, utilities, public buildings and broader civic assets belong in the platform
scope. Their inclusion in that scope is not a claim of implemented asset management,
predictive maintenance or evaluated analytical coverage.

## Meaning of current results and known limitations

**Reports and assets (C02-C07, C14, C17).** A report is a submitted observation, not
an asset inventory record. Its category, code and known location identify it. A
snapped road is nearby-road context, not proof that the reported object is a road.
Counts currently group active reports from the last 30 days by road segment across
categories; they are neither unique assets nor confirmed duplicates.

The current backend applies active reports of any category to road travel-time
impairment and uses road-context priority criteria across categories. This is a
known implementation limitation: a lamp or drain near a road does not thereby
prove travel disruption. Off-network reports have no road impact and receive zero
road-derived criteria with a local-road weight fallback. That fallback does not
establish local-road identity or low urgency. Unsupported analytics must be described
as unavailable/uncalibrated, with manual triage, rather than given invented scores.
Copy changes do not repair these algorithms; see the [follow-up specification](analytical-followups.md).

**AI assessment (C08-C12, C18).** Current inference uses
`laion/CLIP-ViT-B-32-laion2B-s34B-b79K`, not the earlier proposed YOLO approach.
It recognizes `jalan`, `trotoar`, `drainase`, `lampu_jalan`, `halte`, `jembatan`
and a non-infrastructure class. `lainnya` (Other) is valid manual intake, not a
supported AI class. Inference supports a saved linear head; the recorded evaluation
selected zero-shot CLIP. Use returned model versions when describing a particular run.

Asset recognition, suggested damage/severity and officer-confirmed condition are
separate concepts. CLIP also produces zero-shot severity and road damage-type
suggestions; these have no labelled severity/damage evaluation. A non-null AI result
currently advances the stored `ai_verified` state even for a non-infrastructure
prediction. Its honest display meaning is **AI assessed**, not validated damage or
officer approval. Existing review flags omit some confidence/category disagreements;
changing category retains severity inferred for the previous category.

[CV evaluation](../../ml/cv/EVAL.md) records 95.0% +/- 1.8% seven-class category
accuracy over five stratified 50/50 splits of 157 hand-checked Commons photos.
This is not field accuracy, damage accuracy, severity accuracy or proof of the
original officer-validated citizen-photo KPI in either region. Keep the measured
results and their small-sample/domain limitations together.

**Road simulation and GNN (C13).** Seeded `impact_score` uses the exact road
simulation; `impact_score_gnn` stores the learned surrogate prediction separately.
Exact means computed under the simulation's assumptions, not observed ground truth.
The surrogate predicts simulation labels; it is not a universal live impact engine.
The [GNN evaluation](../../ml/gnn/EVAL.md) preserves both regions, baselines and
spatial holdouts (Surabaya held-out Spearman 0.690 versus linear 0.387 and road
class 0.102). Agreement with simulated labels is not validation against real traffic
or infrastructure outcomes.

**Proxies and estimates (C15-C16).** Accessibility is a facility-weighted mean
travel time using assumed road speeds and OSM buildings as origin/population weights.
Health, school, market and government POIs are accessibility destinations. Damage
multiplies travel time by 1.5/2.5/5 for low/mid/high; unreachable origins use 60 minutes.
These are model assumptions. Road-scenario repair estimates use Rp1,200,000/m for
main roads, Rp600,000/m for local roads and 150 m/day for one crew. They are rough
estimates, not quotations for lamps, drains, bridges or any verified repair scope.

**Demo provenance (C19).** Seed reports use Commons photos, generated descriptions,
synthetic timestamps/lifecycle events and locations sampled near real road segments.
Photos are attributed but do not document those exact Surabaya assets or incidents.
Seed department assignments include a generic fallback; they are not verified
ownership or routing policy. OSM geography is real source data with its own coverage
limits; that does not make seed report evidence or repair outcomes real.

## Shared content and metric dictionary

Use short labels only where the surrounding context retains the full meaning.
Stored API keys and historical events remain unchanged.

| Concept/key | Full label | Short label / action | Definition |
|---|---|---|---|
| IPIMS | Intelligence Public Infrastructure Management System | IPIMS | Platform name; use Intelligence exactly |
| `reported` | Reported | Reported | Citizen submission recorded |
| `ai_verified` | AI assessed | AI assessed | AI result exists; no officer validation implied |
| `gov_approved` | Government approved | Approved / Approve | Officer approval event |
| `assigned` | Assigned | Assigned / Assign | Recorded department assignment |
| `in_repair` | In repair | In repair / Start repair | Recorded repair stage |
| `completed` | Completed | Completed / Complete | Recorded completion event; seed events are synthetic |
| `rejected` | Rejected | Rejected / Reject | Recorded rejection with lifecycle rules preserved |
| Report identity | Category + report code + known location | Nearby road | Road association is secondary context |
| `priority_score` | Road-context priority | Priority | Legacy weighted criteria, not a validated universal urgency score |
| `impact_score` | Modeled road-network impact | Road impact | Normalized exact simulation result for an associated segment |
| `median_hours_to_verify` | Median time to approval | Approval median | Creation to government approval, in hours; not AI processing time |
| `median_hours_to_complete` | Median time to completion | Completion median | Creation to completion, in hours |
| `accessibility_before/after` | Modeled weighted travel time | Travel time | Minutes, building-origin and facility weights; lower is better |
| `improvement_pct` | Modeled travel-time gap reduction | Gap reduction | Share of excess travel time above undamaged baseline removed: 100*(before-after)/(before-baseline); zero when gap is negligible |
| `people_weight_regained` | Building-weighted travel-time improvement | Weighted improvement | Total building weight times mean minutes gained; building-weighted minutes, not people or a building count |
| `node_changes.population` | Building weight at origin | Building proxy | OSM building proxy assigned to that graph node, not measured residents |
| `cost_estimate_idr` | Estimated road-scenario repair cost | Estimated cost | IDR under the road length/rate assumptions |
| `duration_days` | Estimated road-scenario repair duration | Estimated days | Ceiling of selected road length / 150 m per crew-day |
| Collections | Reports; accessibility destinations | Reports; Destinations | Plural collection controls; Report is a submission action only when explicit |

Presentation conventions: priority uses one decimal; distinguish unavailable from
zero; use IDR/Rp currency consistently and show dates/times in WIB (UTC+7). A loading
or failed request is not zero reports. Counts from limited lists describe shown/latest
records, not complete coverage. Preserve contextual explanations for analytical values.

## Historical scope and expansion

The November 3 system design and earlier stage-two design (Git history) are historical records.
This addendum governs current scope/model terminology where they differ; their
evaluations and delivered workflow remain intact. C01-C19 are addressed here as
clarifications, not claims of functional remediation. Future domains require asset
identity, data, responsibility, criteria, models and separate evidence of validity.
