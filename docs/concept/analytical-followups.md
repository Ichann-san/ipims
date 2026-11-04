# Analytical follow-ups: domain eligibility and review

Specification only, 2026-11-05. Implements none of these changes. Read the
[scope clarification](2026-11-05-scope-clarification.md) and C04-C09 in the
[Shift One audit](shift-one-audit.md).
Backend, API, schema, scoring, model and dataset changes require a separate Concept/API
task with compatible contract updates and regression proof.

## Required decisions and deliverables

| Finding | Future change | Acceptance evidence |
|---|---|---|
| C04 | Introduce explicit road-disruption eligibility and reason/evidence, independent of report category and proximity. Define who confirms disruption and which road edges it affects. | A road-association alone cannot change road travel time; confirmed eligible disruptions change only their declared edges. Review bridge/drain cases explicitly. |
| C05 | Define category-specific criteria/calibration, provenance and a reviewed cross-domain queue policy. | Unsupported domains have no falsely validated universal score; officer triage remains usable. Preserve reproducible existing road scores unless separately approved changes are measured. |
| C06 | Represent missing network context and unavailable analytics explicitly; define manual triage and escalation. | Off-network intake/lifecycle works; no implicit local-road identity, low-urgency conclusion or invented numeric replacement. |
| C07 | Separate reports, issues and managed assets; choose reviewed asset/issue grouping or category/location clustering. | Nearby lamp and road reports do not count as corroboration of the same damaged asset; duplicates remain traceable to source reports. |
| C08 | Add an auditable review/validation gate with backward-compatible eligibility and reason fields. | Non-null AI output is assessment only; non-infrastructure results require review; officer validation records actor, evidence and time. Existing status/history remains readable. |
| C09 | Add review reasons for missing/low-confidence AI, non-infrastructure, category disagreement and unavailable context. Define category-aware reassessment or officer-entered severity. | Category correction does not silently retain incompatible severity as validated evidence; original inference and correction history remain auditable. |

Do not choose confidence thresholds without a documented calibration decision.
Do not equate model confidence with damage probability. API field names, nullability,
migration/backfill and legacy-client handling must be agreed in that future task;
this document does not introduce a new contract by implication.

## Required scenario acceptance

1. **Street light beside a road:** submit a lamp report with a valid nearby-road
   association. Keep lamp/category/code/location visible and support approval,
   assignment and repair. Without verified road disruption, road travel-time weights
   and what-if baseline remain unchanged. Its priority is not presented as calibrated
   across asset domains. A confirmed fallen pole blocking a road is a separate,
   evidence-backed disruption relation.
2. **Drain near a road:** report a blocked drain without evidence of carriageway
   flooding. No automatic road impairment or shared damaged-road report count follows.
   A reviewed flooding/closure scenario may affect identified road edges only through
   the explicit disruption policy, with provenance and reversible eligibility.
3. **Off-network report:** submit an off-network lamp or Other report. Retain report
   identity, public timeline and officer triage. Road impact is unavailable; no
   local-road classification or low urgency is inferred. A true numeric zero in an
   eligible road scenario remains distinguishable from unavailable analytics.
4. **AI/category disagreement:** AI suggests Road while the citizen/officer selects
   Drainage. Surface disagreement for review, preserve both values/provenance and
   prevent the old road severity silently becoming validated drain severity. Test
   low confidence, missing AI and non-infrastructure output as distinct reasons.
5. **Preserved road case:** an eligible road report and a confirmed road disruption
   retain reproducible simulation/scoring behavior, weight editing, status history,
   public views and recommendation units. Completing/rejecting the report updates
   active disruption state under the documented policy.

## Expansion beyond the road pilot

Asset-specific work must define identity, ownership/responsibility, location/geometry,
condition, report relations, supported failure modes and dataset provenance first.
Destination POIs do not become managed assets by renaming a layer. New AI classes
require labelled data and evaluation; damage and severity need separate field labels.
Lighting, drainage, structural, utility or facility models need their own assumptions,
units, costs, baselines and observed-outcome validation. Couplings to road accessibility
must be explicit and justified rather than inherited from nearest-road snapping.

## Future validation and stop condition

Use focused backend/ML tests for eligibility, scoring/grouping, review reasons and
category correction; compatible API/serialization tests; and citizen/officer smoke
flows covering the scenarios above. Compare the eligible road case against preserved
artifacts, not newly invented accuracy targets. Exercise legacy rows and missing
values without resetting user reports. The future task is complete only when those
acceptance cases, compatibility decisions and documented analytical limits are proven.
No backend or model remediation is claimed by the present documentation/UI work.
