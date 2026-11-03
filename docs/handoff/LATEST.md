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

## Since the stage 2 build (2026-11-04)

- UI is English (headline "Broken Infrastructure, Fixed." is the user's; keep it). Demo seed data is English.
- Navbar one size larger; footer over the home map; home map dimmed; stats panel in the hero column with centred content.
- Home map hides the (i) attribution button because the footer carries "© Mapbox © OpenStreetMap · Improve this map". The Mapbox wordmark must stay on every map (Mapbox terms).
- e2e updated to English labels: 11/11.

## Open

- Real phone test. Plain `npm run dev` works on a phone except GPS (needs HTTPS or localhost); `npm run dev:https` gives GPS.
- Record the demo video following `docs/DEMO.md` (update its button names to the English UI first: Report, Top 3 repairs, Before/After, Approved, Assigned, In repair, Completed).
- Restrict the Mapbox token to localhost URLs in the Mapbox account.
- Optional: rename URLs (`/laporan`, `/peta`, `/transparansi`) to English.
- Known limits: photo AI not measured on Surabaya citizen photos; severity not evaluated; impact uses assumed speeds and buildings, not observed traffic; OSM facilities mapped only as relation polygons are not counted.
- Nothing is pushed; all work is on branch `rebuild/v1`.
