# Handoff — 2026-11-04 (Claude Code), end of stage 2 build

## State

Stage 2 (Surabaya + UI) is built; only U5 (real phone test and demo video) is left for the team.

- Region: Kota Surabaya (default, `IPIMS_REGION`), all 31 kecamatan. 42,724 intersections, 58,445 segments, 660,208 buildings, 3,218 facilities. Kediri stays reproducible with `IPIMS_REGION=kediri`.
- Simulation: Surabaya 700.7 s (10 processes); what-if about 0.3 s over HTTP. GNN Spearman 0.690 on held-out sectors (linear 0.387, road class 0.102) — `ml/gnn/EVAL.md`.
- UI: dark matte-glass design on Mapbox Standard (night, 3D, globe). Public: Beranda, Laporan (form sheet + detail drawer), Peta, Transparansi. Officer: Dasbor (queue, drawer, weights modal), Peta Operasi (queue + live what-if with before/after toggle and regained-access heatmap). Design reference at `/dev/ui`.
- Checks: `e2e/smoke.py` 11/11 with no browser errors (Edge, HTTPS, phone emulation with GPS), backend pytest 15, `pytest ml` 5, `npm run build`, axe-core: no serious/critical issues on any page.
- DB reset to 40 Surabaya demo reports.

## Notes

- Mapbox token lives in `frontend/.env.local` (gitignored). Restrict it to localhost URLs in the Mapbox account.
- Custom map layers need `*-emissive-strength: 1`, otherwise the Standard night lighting renders them almost black.
- Facilities that OSM maps only as relation polygons are not counted (totals slightly low).
- Dev ports: web 5288, API 8000, PostGIS 5433. Another project on this machine uses 5173/5174.

## Open

- U5: real phone test (`npm run dev:https`, open the Network URL), demo video following `docs/DEMO.md`.
- Photo AI not measured on Surabaya citizen photos; severity not evaluated.
