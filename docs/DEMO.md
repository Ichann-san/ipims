# Demo script (about 5 minutes)

**IPIMS = Intelligence Public Infrastructure Management System.** Current showcase:
Kota Surabaya; the original Kabupaten Kediri pilot remains reproducible. Present
Shift One as a shared multi-category reporting/lifecycle workflow plus a road-network
accessibility pilot. Photo → AI assessment → officer review/approval → assignment →
repair tracking is the reporting story. Road impact/what-if is a specialized analytical
story with modeled assumptions, not proof of universal infrastructure analytics.

Use the [scope and metric dictionary](concept/2026-11-05-scope-clarification.md).
CLIP suggests asset category and severity; it does not validate damage. Nearby-road
context is secondary to the report category/code/location. Broader public assets are
in product scope; their asset inventories and domain models are future work.

## Before the demo (15 minutes before)

Use a disposable demo database for the reset step below; it deletes reports. Do not run it against a database containing reports to preserve.

1. Docker Desktop running, then `docker compose up -d db`.
2. API: `cd backend && ../.venv/Scripts/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`. Wait until `https://localhost:5288/api/v1/health` shows `"cv": true, "graph": true` (about 20 s).
3. Web, with HTTPS so the phone can use GPS: `cd frontend && npm run dev:https`. `frontend/.env.local` must hold `VITE_MAPBOX_TOKEN`.
4. Check: `.venv/Scripts/python e2e/smoke.py --base https://localhost:5288` → `11 steps passed`. It adds one completed test report.
5. Clean slate: `cd backend && ../.venv/Scripts/python -m app.seed --reset --skip-graph && ../.venv/Scripts/python -m app.demo` (40 demo reports across Surabaya).
6. Phone on the same Wi-Fi: open the "Network" URL Vite prints (`https://<laptop IP>:5288`), accept the certificate once, allow location.
7. Laptop: open `https://localhost:5288/admin`, log in, keep Dasbor and Peta Operasi in two tabs.
8. Have a damage photo ready on the phone, or point the camera at a printed pothole photo.

For the demo video, a GPU laptop renders the map smoothly; close other heavy apps.

## Script

| # | Screen | Do |
|---|---|---|
| 1 | Phone, Beranda | Let the globe fly into Surabaya. Point at the three numbers. |
| 2 | Phone, Lapor | Tap **Lapor**, take the photo. The AI line appears; GPS fills the map pin; category is preselected. Send. |
| 3 | Phone, report drawer | Show category, code, location and the AI-assessed stage. Explain that officer approval is separate. |
| 4 | Laptop, Dasbor | The new report is in the queue. Open it: road-context priority bar with its six parts and advisory AI result. Explain that these criteria are not calibrated for every asset category. |
| 5 | Laptop, Dasbor | **Bobot prioritas**: move one slider, save; the queue re-ranks. |
| 6 | Laptop, Peta Operasi | Queue tab: click a report, the camera flies to it. |
| 7 | Laptop, Peta Operasi | Simulasi tab: **3 rekomendasi**. The camera frames the three roads, the modeled travel-time gap reduction and estimated road-scenario cost appear. Toggle **Sebelum / Sesudah**: orange roads turn cyan and the modeled travel-time change glow appears. Click another orange road to add it; the numbers update live. |
| 8 | Laptop, Dasbor | Back to the new report: Disetujui Pemerintah → Ditugaskan (Dinas Sumber Daya Air dan Bina Marga) → Dalam Perbaikan → Selesai. |
| 9 | Phone | Refresh the report: tracker complete, "Ditangani" shows the department. |
| 10 | Phone or laptop, Transparansi | Stage counts, per-report progress, trend, top kecamatan. |

## Numbers you can quote (historical measurements, see `ml/*/EVAL.md`)

- Road graph: 58,445 road segments, 660,208 buildings (origin/population proxy) and 3,218 accessibility destination POIs from OpenStreetMap, all 31 kecamatan.
- Impact simulation for every segment: about 12 minutes on a laptop; a what-if answers in about 0.3 s.
- GNN predicts road simulation ranking on held-out spatial areas within Surabaya: Spearman 0.690 (linear model 0.387, road class 0.102). This is simulation agreement, not real-traffic validation or proof for an entirely unseen region. Seeded priority uses exact simulation, not the surrogate.
- CLIP photo category classification: 95.0% +/- 1.8% across five held-out 50/50 splits of 157 hand-checked Commons photos (seven classes: six infrastructure categories plus non-infrastructure). Other is manual intake. Local citizen-photo performance, damage type and severity are unvalidated; officer review is required.

## Honest answers to expect

- *Is the data real?* Roads, buildings and destination POIs come from OpenStreetMap, subject to source coverage limits. The 40 seed reports combine attributed Commons photos with synthetic descriptions, locations sampled near real roads, timestamps and lifecycle events. The photos do not depict those exact Surabaya assets. Department assignments include a generic fallback; they are not verified routing policy.
- *Where does impact come from?* Travel time from homes (buildings) to hospitals, schools, markets and offices on the road network, with assumed speeds per road class. Not observed traffic.
- *Why a GNN if the simulation exists?* The GNN is a separately evaluated surrogate for simulation labels, using cheaper graph features and a forward pass. Exact simulation currently supplies the seeded impact score and what-if calculations. Speed/evaluation evidence is in the GNN report; avoid universal or instantaneous performance claims.
- *Does every report impair road travel?* The current backend applies active reports on associated road segments regardless of category. This is a known limitation, not evidence that a lamp or drain blocks traffic. Road-context priority also applies across categories; off-network fallback does not prove low urgency. The [C04-C09 specification](concept/analytical-followups.md) defines separate future guardrails.
- *What do the scenario numbers mean?* Gap reduction is the share of modeled excess weighted travel time above an undamaged baseline removed, not observed access restoration. `people_weight_regained` is building-weighted minutes gained, not a population count. Costs assume Rp1,200,000/m main road or Rp600,000/m local road; duration assumes one crew at 150 m/day. These rough road estimates are not multi-asset repair quotations.

## If something fails

- AI line says "AI tidak tersedia": the model is still loading; wait 20 s and retake, or pick the category by hand.
- No GPS on the phone: tap the map to place the pin.
- Map stays blank: check the Mapbox token in `frontend/.env.local` and the internet connection.
