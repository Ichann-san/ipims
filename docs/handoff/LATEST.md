# Handoff - mobile repair audit and proposal

## Current request

User reports poor mobile hierarchy, homepage contrast, report stacking, map control
placement and spacing. Requested analysis across phone sizes and a repair plan first.
Preserve desktop concept; mobile may use different layouts and disclosure.

## Audit delivered

- Current baseline is user commit bee5bab (reduce ai slop) on rebuild/v1. Preserve
  those current content choices; no application source was edited this turn.
- Used Impeccable adapt, design-taste-frontend, investigate-first and existing Graphify
  ownership query. No new model/graph extraction or skill installation.
- 57 read-only page/state samples: 320x568, 360x640, 375x667, 390x844, 412x915,
  430x932, 844x390 landscape, 768x1024 tablet and 1366x900 desktop reference.
- Routes/states: Home, Reports, Map idle/selected, Transparency, officer login,
  Dashboard, Operations, report form and normal animated homepage. No report writes.
- Local ignored screenshots and measurements: .venv/mobile-audit/.

## Findings

- At 320x568: header66 + footer124 + pager120 occupy about55% of the screen.
  Report filters y142-334, first card y350-476, fixed pager y314-434, footer y444-568.
  Pager covers filters and most of the first report; footer covers its bottom.
- Filters are192px tall through390px width; unrelated wrap rows and card gutters drift.
- Home has a45% tint plus desktop-positioned radial gradient; mobile readability is
  insufficient despite the overlay existing.
- Selected map popup competes with persistent dock/layers/footer; at320px it is
  mostly covered. Width-only md breakpoint activates desktop arrangements in landscape.
- Dashboard table begins at y711 on the568px-high phone; report form sheet is326px tall.
- Earlier fit/overflow tests did not establish visual hierarchy, unobstructed controls,
  useful map workspace, keyboard geometry or early task visibility. No claim of
  physical iOS/Android testing or performance measurement.

## Proposed direction - awaiting approval

See docs/plans/2026-11-05-mobile-repair-proposal.md for evidence, alternatives,
phone wireframes, ownership/sequence and acceptance gates.

- Keep desktop navy/coral/Jakarta, globe and current features/layout.
- Mobile compact header and persistent copyright/map-credit footer. Expand institutional
  logos/team details via About. This is an explicit mobile-only presentation change.
- One workspace/scroll owner; fluid shared gutters; deliberate touch targets and safe areas.
- Home: stronger content scrim, organized actions/KPIs, live entrance retained; pause
  mobile idle orbit after settling. Desktop motion unchanged.
- Reports: search/scope hierarchy, filter sheet, full-width cards, compact in-flow pager.
- Map: collapsed idle layers; one active layers/report surface; portrait report peek,
  short-landscape detail surface; camera and controls respect available workspace.
- Adapt officer queue/operations, Transparency and full-screen mobile forms/keyboard behavior.
- Approval precedes implementation. No backend/model/schema changes proposed.

## Repository state and previous work

This turn commits proposal/task/handoff documentation only. No build/test gate needed
for app code because none changed. Plan whitespace checked with git diff --check.
Nothing pushed; existing services remain running (dev5288, preview5289).

Prior completed scope is documented in docs/plans/2026-11-05-consistency-completion.md
and docs/concept/2026-11-05-scope-clarification.md. Original graph snapshot remains
at code8ae4f4a (210nodes/595edges), with its extraction limits recorded. Backend analytical
eligibility/review/domain-model follow-ups remain separately scoped.
