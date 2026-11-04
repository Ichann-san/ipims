# IPIMS stage 2 — Surabaya + UI design

> Historical design record. Current scope/model terminology is clarified by the [2026-11-05 addendum](../concept/2026-11-05-scope-clarification.md): Intelligence Public Infrastructure Management System; shared multi-category workflow plus road analytical pilot; Surabaya current, Kediri reproducible; CLIP inference supersedes earlier YOLO plans. Preserve the original design and evaluation results below.

Status: approved 2026-11-04. Builds on `2026-11-03-ipims-design.md` (stage 1, system working end to end).

## Context

- Showcased at Inovboyo 2.0 (Kota Surabaya) in a live presentation and demo video. Runs locally for now.
- Scope moves from Kabupaten Kediri to **all of Kota Surabaya** (31 kecamatan). Only data differs, so the region is a config switch (`IPIMS_REGION`, default `surabaya`); Kediri stays reproducible.
- Real-use product: short copy, no explanatory text (explanations happen in the pitch). Do not overdo effects.

## Visual direction

- Dark only. Palette aligned with the Inovboyo site: deep navy base, matte blue, cyan-blue for data, coral-orange accent.
- Font: Plus Jakarta Sans (self-hosted).
- Matte glass: semi-transparent navy panels, ~14px blur, 1px border at ~6% white, no gloss or reflection gradients. Solid fallback.
- One floating glass navbar (pill). Compact spacing (4px base), clear section gaps.
- Map: Mapbox GL JS v3 via `react-map-gl` (Standard style, night light preset, 3D buildings, globe projection when zoomed out). MapLibre + OpenFreeMap remains the fallback if no token.
- Map colour meaning: Impact Score = orange ramp; simulation change = blue (better) ↔ orange (worse).
- Home hero mirrors the Inovboyo "earth" layout: globe with HUD labels (e.g. `PUSAT // 00 · SURABAYA · 7.2575° S 112.7521° E`), then flies into 3D Surabaya.

## Pages

Public: **Beranda** (live globe→city map, buttons Lapor + Buka Peta, small stats strip) · **Laporan** (one page: list + filters; report form in a sheet as one scrolling form; detail in a drawer with its own URL) · **Peta** (full-screen map, layer toggles, glass cards) · **Transparansi** (KPI tiles, stage pipeline, per-report progress trackers, trend, category and kecamatan charts).

Officer: **Dasbor** (KPI strip, queue table, detail drawer with actions, weights in a modal) · **Peta Operasi** (the only admin map: queue panel, detail panel, simulation mode where clicking damaged roads marks them repaired and the map recolours roads and nodes immediately, before/after swipe comparison with delta chips).

## Backend additions (contract v1.1)

- `GET /region` → name, center, bbox, kecamatan list.
- `POST /admin/whatif` also returns per-node change (`node_changes`: lng, lat, minutes gained, population weight) for the map.
- `GET /stats` adds `by_kecamatan`.

## Shifts

| ID | Work | Done when |
|---|---|---|
| S0 | Region switch to Surabaya: config, faster simulation, graph, impact, GNN folds, demo data, API v1.1 | Surabaya live in the API; eval docs updated |
| U0 | Design system, fonts, glass components, navbar, Mapbox map base, `/dev/ui` | Style page and map render; screenshots reviewed |
| U1 | Beranda, Laporan, Peta | Screenshots at 390 and 1366 px reviewed; e2e passes |
| U1b | Transparansi | same |
| U2 | Dasbor | same |
| U2b | Peta Operasi with live simulation and comparison | Clicking a road recolours the map; swipe works |
| U4 | Responsive, accessibility (AA, 44px targets), states, performance, PWA | checklist green |
| U5 | Real phone test, demo video run | demo script runs |
