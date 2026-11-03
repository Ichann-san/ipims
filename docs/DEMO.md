# Demo script (about 5 minutes)

Shows the closed loop from the proposal (Tabel 2.1) on real Kabupaten Kediri data: citizen report → AI verification → graph and GNN impact → decision support → government approval → repair monitoring, visible to the public.

## Before the demo (15 minutes before)

1. Laptop and phone on the same Wi-Fi.
2. Start everything (README "Run locally"): `docker compose up -d db`, API on port 8000, then the web app **with HTTPS** so the phone can use GPS: `cd frontend && npm run dev:https`.
3. Check: `http://localhost:8000/api/v1/health` shows `"cv": true, "graph": true` (the AI model needs about 20 s after the API starts).
4. Run the browser check: `.venv/Scripts/python e2e/smoke.py --base https://localhost:5288`. It must end with `14 steps passed`. (It adds one completed test report.)
5. Optional clean slate: `cd backend && ../.venv/Scripts/python -m app.seed --reset && ../.venv/Scripts/python -m app.demo` (deletes all reports, recreates 30 demo reports).
6. On the phone open `https://<laptop Wi-Fi IP>:5288` (Vite prints it as "Network"), accept the self-signed certificate warning once, allow location.
7. On the laptop open `https://localhost:5288/admin` and log in (`admin` / your password).
8. Have a damage photo ready on the phone (or point the camera at a printed pothole photo).

## Script

| # | Screen | Do | Say |
|---|---|---|---|
| 1 | Phone: Beranda | Show live stats | "Every number here comes from the database, not from the design." |
| 2 | Phone: Lapor, step 1 | Take the photo | "A vision transformer (CLIP ViT) classifies the category and estimates severity in about a tenth of a second." Point at the AI line. |
| 3 | Phone: step 2 | GPS fills in; tap the map to adjust if needed | "Location from GPS; the citizen can correct it on the map." |
| 4 | Phone: steps 3–4 | Category is preselected by the AI; add a short note; send | "No account needed; the server strips photo metadata." Read the report code aloud. |
| 5 | Phone: success | Read "Terhubung ke ruas …" and the initial priority | "The report is snapped to a real road segment of the OpenStreetMap graph of Pare, Badas, Plemahan and Gurah." |
| 6 | Laptop: Antrian prioritas | Find the new code in the queue | "Reports are ranked by an MCDM Priority Score, not by arrival time." |
| 7 | Laptop: report detail | Show the Priority Score table | "Six criteria: severity, traffic, population, facility importance, network Impact Score and number of reports. Each contribution is visible, so the ranking can be explained." |
| 8 | Laptop: Bobot MCDM | Move one slider, save | "Weights differ for main and local roads and are set by the government; saving re-ranks every active report." |
| 9 | Laptop: Jaringan & what-if | Show the coloured network, then "Simulasikan 3 teratas" | "Impact Score = how much travel time to health, school, market and government facilities rises if this road is damaged, simulated on 9,337 segments. Repairing the top three recommended roads restores about a third of the lost access, with a rough cost and duration." Mention the GNN line: "A graph neural network reproduces this ranking on a kecamatan it never saw (Spearman 0.78), which is how the system scales to new areas." |
| 10 | Laptop: back to the report | Approve → assign to Dinas PUPR → Dalam Perbaikan → Selesai | "Government approval and repair monitoring." |
| 11 | Phone: refresh the report page | Show status "Selesai" and the full timeline | "The citizen sees every step: the loop is closed." |
| 12 | Phone or laptop: Transparansi | Show completion rate and median times | "Public accountability: completion rate and response times are computed from the timeline." |

## Questions to expect, with honest answers

- *How accurate is the AI?* 95.0% category accuracy on 157 hand-checked public photos (`ml/cv/EVAL.md`). These are not Kediri citizen photos yet; the proposal KPI (>85% against field officers) is measured in the pilot. Severity is an estimate the officer verifies.
- *Where does the Impact Score come from?* An accessibility simulation on the OSM road network with buildings as a population proxy (`ml/gnn/EVAL.md`). It uses assumed speeds per road class, not observed traffic.
- *Why both a simulation and a GNN?* The simulation is exact but needs one run per road; the GNN needs one shortest-path run per facility type, so it scores new areas instantly. In the pilot the exact simulation drives the priority.
- *Is the data real?* Roads, buildings and facilities are real OpenStreetMap data. The 30 background reports are demo data with freely licensed photos; each says so in its description.

## If something fails

- AI line says "AI tidak tersedia": the model is still loading; wait 20 s and retake the photo, or pick the category manually (the flow still works).
- Phone GPS fails: tap the map to place the pin (manual pin).
- Phone cannot reach the laptop: use the laptop browser with a phone-sized window for steps 1–5.
- Map tiles do not load (no internet): the reports, roads and scores still work; only the background map is missing.
