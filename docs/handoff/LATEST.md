# Handoff - mobile repair and documentation cleanup

User approved the mobile repair and requested Graphify refresh plus unused-file cleanup.
Branch: rebuild/v1. Current frontend behavior is maintained in docs/frontend.md.

## Implemented

- Compact labelled Menu navigation and copyright/map-credit footer; About preserves logos/team.
- One measured mobile workspace, safe areas, short landscape and full-screen form/detail overlays.
- Stronger homepage scrim, grouped actions/KPIs, original entrance retained, compact idle orbit paused.
- Reports search/scope/filter sheet, full-width cards and in-flow compact paging; desktop retained.
- One public map layer/report panel, compact selection/details, shared Operations panels, measured camera/wordmark.
- Compact Transparency disclosures/progress preview and early officer queue cards/context controls.
- Large-text scope/status wrapping; prevent overlay cleanup stealing newly focused page controls.
- No backend, model, schema or API behavior changes. Existing analytical follow-ups remain open.

## Verification

- Production build passes, existing large Mapbox bundle warning remains.
- Eleven frontend unit tests pass. Lint has advisory React warnings and no errors.
- Main mobile suite: 63 route samples across nine viewport sizes; final small-phone/landscape
  confirmation covers selection rotation, full-screen details, filter page size, focus,
  keyboard-like viewport reduction, draft retention and 200% text. Browser errors: none.
- Consistency: 40 route checks; nested focus trap/return, non-road identity, deep links,
  font/metadata/manifest, unknown-versus-zero and network failure checks pass.
- Layout: 16 routes plus mocked 137-report paging, URL history, clamp/reset, empty/error/stale cases pass.
- Real 11-step smoke: photo/GPS/AI, creation/search/public pages, officer lifecycle,
  completion, weights and real road simulation pass. Test report IPIMS-2026-000196 completed.
  Earlier runs 000194/000195 stopped at a test that typed before the drawer route closed;
  verified their exact test descriptions and completed both through normal API lifecycle.
  No reports were deleted or reset.
- Emulated Edge only; physical iOS/Android and demo recording remain team work.

## Cleanup and continuation

Eight superseded UI proposal/review/completion files removed after consolidating current
rules in docs/frontend.md. C01-C19 baseline evidence retained in docs/concept/shift-one-audit.md.
Historical system design, contracts, ML evaluations, current concept and legacy fixture assets retained.
Documentation links checked. No application assets/dependencies/datasets/media removed.

Graphify final export and generated audit/cache cleanup are being finalized in the next commit.
Graph covers frontend TypeScript/TSX only; CSS/HTML/assets/tests/docs/backend/ML are separate.
Nothing pushed. Local API8000/PostGIS5433 and preview5289 support the checks.
