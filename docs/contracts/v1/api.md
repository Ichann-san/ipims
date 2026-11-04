# IPIMS API contract v1 (revision 1.1)

v1.1 (2026-11-04) adds, without breaking v1: `GET /region`, `GET /segments?active=1` without bbox,
`by_kecamatan` in `/stats`, `repaired_segments` and `node_changes` in `POST /admin/whatif`.

Base path: `/api/v1`. JSON unless noted. Times are ISO 8601 UTC. Coordinates are WGS84 (`lat`, `lng`).
Errors: `{"detail": "<message>"}` with HTTP 400 (bad input), 401 (no/invalid token), 404, 409 (invalid status transition), 422 (validation).
Admin endpoints need `Authorization: Bearer <token>` from `POST /auth/login`.

## Shared types

```ts
type Category = "jalan" | "trotoar" | "drainase" | "lampu_jalan" | "halte" | "jembatan" | "lainnya";
type Status = "reported" | "ai_verified" | "gov_approved" | "assigned" | "in_repair" | "completed" | "rejected";
type Severity = "low" | "mid" | "high";
type RoadGroup = "utama" | "lingkungan";

interface AIResult {
  category: Category;
  category_confidence: number;      // 0..1
  is_infrastructure: boolean;       // false = photo does not look like infrastructure damage
  damage_type: string | null;       // e.g. "pothole", "longitudinal_crack", "alligator_crack"; null if none/not road
  severity: Severity;
  severity_score: number;           // 0..1
  model_version: string;
}

interface PriorityItem { criterion: "severity"|"traffic"|"population"|"facility"|"impact"|"reports"; value: number; weight: number; contribution: number; }

interface SegmentRef { id: string; name: string | null; highway: string; road_group: RoadGroup; impact_score: number; }

interface Report {
  code: string;                     // "IPIMS-2026-000001"
  created_at: string;
  updated_at: string;
  lat: number; lng: number;
  manual_pin: boolean;
  category: Category;
  category_source: "ai" | "user";
  description: string | null;
  photo_url: string;                // absolute path under /media
  ai: AIResult | null;
  segment: SegmentRef | null;
  snap_distance_m: number | null;
  impact_score: number | null;      // 0..100
  priority_score: number | null;    // 0..100
  priority_breakdown: PriorityItem[] | null;
  status: Status;
  assigned_to: string | null;
  needs_review: boolean;            // true when AI failed, not infrastructure, or not snapped
}

interface StatusEvent { from_status: Status | null; to_status: Status; actor: string; note: string | null; created_at: string; }
interface ReportDetail extends Report { timeline: StatusEvent[]; }
```

## Public

`GET /health` → `{"status":"ok","db":true,"models":{"cv":bool,"graph":bool}}`

`POST /analyze` (multipart: `photo`) → `AIResult`. Preview only, nothing stored. 503 if CV is unavailable.

`POST /reports` (multipart) → `201 ReportDetail`
- `photo` (file, required, jpeg/png/webp, ≤ 8 MB)
- `lat`, `lng` (required numbers)
- `manual_pin` (bool, default false), `gps_accuracy_m` (number, optional)
- `category` (optional `Category`; if given, `category_source = "user"`, else the AI category is used)
- `description` (optional, ≤ 1000 chars)

The server stores the photo, runs CV, snaps to the nearest segment, computes scores, writes `reported` then `ai_verified` events (the second only if scoring succeeded).

`GET /reports` → `{"items": Report[], "total": number}`
Query: `status` (repeatable), `category` (repeatable), `q` (text in description/segment name/code), `sort` (`newest` default | `priority`), `bbox` (`minLng,minLat,maxLng,maxLat`), `limit` (default 20, max 100), `offset`.

`GET /reports/{code}` → `ReportDetail`

`GET /region` → the area the deployment covers (env `IPIMS_REGION`, default `surabaya`):
```json
{"name": "Kota Surabaya", "center": [112.7, -7.27], "bbox": [112.6, -7.35, 112.85, -7.18], "kecamatan": ["Asemrowo", "..."]}
```
`center` and `bbox` (`[minLng, minLat, maxLng, maxLat]`) come from the loaded road segments; both are `null` before the graph is seeded.

`GET /stats` →
```json
{
  "total": 0,
  "active": 0,
  "awaiting_approval": 0,            // all reported + ai_verified, independent of queue pagination
  "open_over_7_days": 0,            // active reports aged at least 7 days
  "by_status": {"reported": 0, "...": 0},
  "by_category": {"jalan": 0, "...": 0},
  "by_kecamatan": {"Sukolilo": 0, "...": 0, "lainnya": 0},   // kecamatan of the snapped segment; "lainnya" = not snapped or outside
  "completed_rate": 0.0,             // completed / (completed + rejected)
  "median_hours_to_verify": null,
  "median_hours_to_complete": null,
  "monthly": [{"month": "2026-11", "reported": 0, "completed": 0}]
}
```

Calendar months in `/stats.monthly` use Asia/Jakarta (WIB). Months with no events may
be absent; clients fill the six consecutive calendar months ending in the current
WIB month with zeros. `completed_rate` is the share of closed reports that were
completed; UI percentages of **all** reports instead use `by_status.completed / total`.
The approval and overdue aggregates were added by Concept task R2 (2026-11-04).

`GET /segments` → GeoJSON FeatureCollection, properties = `SegmentRef` + `active_reports`. Max 5000 features.
Query: `bbox` (required unless `active=1`), `active` (`1` = only segments with at least one active report). Without either → 400.

`GET /facilities` → GeoJSON FeatureCollection of facilities in `bbox`, properties `{id, kind, name}`.

## Admin

`POST /auth/login` `{"username","password"}` → `{"token": string, "expires_at": string}`

`GET /admin/queue` → `{"items": Report[], "total": number}`. Active reports (not completed/rejected), sorted by `priority_score` desc. Query: `road_group`, `limit`, `offset`.

`PATCH /admin/reports/{code}` `{"status"?: Status, "note"?: string, "assigned_to"?: string, "category"?: Category}` → `ReportDetail`
- Status change must be an allowed transition (design §5), else 409.
- `assigned` requires `assigned_to`; `rejected` requires `note`.
- Changing `category` recomputes the Priority Score.

`GET /admin/weights` → `{"utama": Weights, "lingkungan": Weights}` where `Weights = Record<criterion, number>`.
`PUT /admin/weights` same shape → saved (renormalised to sum 1); all active reports are rescored.

`GET /admin/graph/summary` → `{"segments": number, "facilities": {"health": n, ...}, "area": string[], "impact_model": {"version": string, "spearman": number|null}}`

`POST /admin/whatif` `{"repair_segment_ids": string[]}` →
```json
{
  "damaged_segments": 0,
  "repaired_segments": ["..."],        // the requested ids that exist, in request order, duplicates removed
  "accessibility_before": 0.0,
  "accessibility_after": 0.0,
  "accessibility_baseline": 0.0,
  "improvement_pct": 0.0,
  "by_facility": {"health": {"before": 0.0, "after": 0.0}},
  "people_weight_regained": 0.0,
  "cost_estimate_idr": 0,
  "duration_days": 0,
  "node_changes": [{"lng": 112.7, "lat": -7.27, "minutes_gained": 0.42, "population": 35}],
  "assumptions": ["..."]
}
```
Accessibility values are population-weighted mean travel time in minutes (lower is better). `baseline` is the network with no damage.
`node_changes`: graph nodes (road intersections) whose facility-weighted travel time differs between before and after, `minutes_gained` > 0 = faster after the repairs; `population` = buildings assigned to the node. Sorted by |minutes_gained| × (population + 1), at most 3000.

`GET /admin/whatif/recommend?budget_idr=` → `{"order": [{"segment_id","name","gain_minutes","cost_idr","cumulative_cost_idr"}], "assumptions": [...]}`
