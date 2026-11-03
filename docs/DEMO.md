# Demo script (about 5 minutes)

IPIMS for Kota Surabaya: citizen report → AI verification → road-network impact → priority → government approval → repair, visible to the public. Spoken explanation happens in the pitch; the screens stay short.

## Before the demo (15 minutes before)

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
| 3 | Phone, report drawer | Show the code and the stage tracker at "AI". |
| 4 | Laptop, Dasbor | The new report is in the queue. Open it: priority bar with its six parts, AI result. |
| 5 | Laptop, Dasbor | **Bobot prioritas**: move one slider, save; the queue re-ranks. |
| 6 | Laptop, Peta Operasi | Queue tab: click a report, the camera flies to it. |
| 7 | Laptop, Peta Operasi | Simulasi tab: **3 rekomendasi**. The camera frames the three roads, the access figure and cost appear. Toggle **Sebelum / Sesudah**: orange roads turn cyan and the regained-access glow appears. Click another orange road to add it; the numbers update live. |
| 8 | Laptop, Dasbor | Back to the new report: Disetujui Pemerintah → Ditugaskan (Dinas Sumber Daya Air dan Bina Marga) → Dalam Perbaikan → Selesai. |
| 9 | Phone | Refresh the report: tracker complete, "Ditangani" shows the department. |
| 10 | Phone or laptop, Transparansi | Stage counts, per-report progress, trend, top kecamatan. |

## Numbers you can quote (measured, see `ml/*/EVAL.md`)

- Road graph: 58,445 road segments, 660,208 buildings and 3,218 facilities from OpenStreetMap, all 31 kecamatan.
- Impact simulation for every segment: about 12 minutes on a laptop; a what-if answers in about 0.3 s.
- GNN reproduces the simulation ranking on areas it never trained on: Spearman 0.69 (linear model 0.39, road class 0.10).
- Photo category AI: 95.0% on 157 hand-checked public photos. Not yet measured on Surabaya citizen photos; severity is an estimate the officer verifies.

## Honest answers to expect

- *Is the data real?* Roads, buildings and facilities are real OpenStreetMap data. The 40 reports are demo data with freely licensed photos; each says so.
- *Where does impact come from?* Travel time from homes (buildings) to hospitals, schools, markets and offices on the road network, with assumed speeds per road class. Not observed traffic.
- *Why a GNN if the simulation exists?* The simulation needs one run per road; the GNN needs one run per facility type, so it scores network edits and new areas instantly.

## If something fails

- AI line says "AI tidak tersedia": the model is still loading; wait 20 s and retake, or pick the category by hand.
- No GPS on the phone: tap the map to place the pin.
- Map stays blank: check the Mapbox token in `frontend/.env.local` and the internet connection.
