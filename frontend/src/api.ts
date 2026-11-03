// Typed client for docs/contracts/v1/api.md
export type Category = 'jalan' | 'trotoar' | 'drainase' | 'lampu_jalan' | 'halte' | 'jembatan' | 'lainnya'
export type Status = 'reported' | 'ai_verified' | 'gov_approved' | 'assigned' | 'in_repair' | 'completed' | 'rejected'
export type Severity = 'low' | 'mid' | 'high'
export type RoadGroup = 'utama' | 'lingkungan'
export type Criterion = 'severity' | 'traffic' | 'population' | 'facility' | 'impact' | 'reports'

export interface AIResult {
  category: Category
  category_confidence: number
  is_infrastructure: boolean
  damage_type: string | null
  severity: Severity
  severity_score: number
  model_version: string
}

export interface PriorityItem { criterion: Criterion; value: number; weight: number; contribution: number }
export interface SegmentRef { id: string; name: string | null; highway: string; road_group: RoadGroup; impact_score: number }

export interface Report {
  code: string
  created_at: string
  updated_at: string
  lat: number
  lng: number
  manual_pin: boolean
  category: Category
  category_source: 'ai' | 'user'
  description: string | null
  photo_url: string
  ai: AIResult | null
  segment: SegmentRef | null
  snap_distance_m: number | null
  impact_score: number | null
  priority_score: number | null
  priority_breakdown: PriorityItem[] | null
  status: Status
  assigned_to: string | null
  needs_review: boolean
}

export interface StatusEvent { from_status: Status | null; to_status: Status; actor: string; note: string | null; created_at: string }
export interface ReportDetail extends Report { timeline: StatusEvent[] }
export interface Page<T> { items: T[]; total: number }

export interface Stats {
  total: number
  active: number
  by_status: Record<Status, number>
  by_category: Record<Category, number>
  completed_rate: number
  median_hours_to_verify: number | null
  median_hours_to_complete: number | null
  monthly: { month: string; reported: number; completed: number }[]
}

export type Weights = Record<Criterion, number>

export interface WhatIfResult {
  damaged_segments: number
  accessibility_before: number
  accessibility_after: number
  accessibility_baseline: number
  improvement_pct: number
  by_facility: Record<string, { before: number; after: number }>
  people_weight_regained: number
  cost_estimate_idr: number
  duration_days: number
  assumptions: string[]
}

export interface Recommendation {
  order: { segment_id: string; name: string | null; gain_minutes: number; cost_idr: number; cumulative_cost_idr: number }[]
  assumptions: string[]
}

export interface GraphSummary {
  segments: number
  facilities: Record<string, number>
  area: string[]
  impact_model: { version: string | null; spearman: number | null }
}

export interface Feature<P> { type: 'Feature'; geometry: GeoJSON.Geometry; properties: P }
export interface FeatureCollection<P> { type: 'FeatureCollection'; features: Feature<P>[] }
export type SegmentProps = SegmentRef & { active_reports: number }
export interface FacilityProps { id: string; kind: string; name: string | null }

const BASE = '/api/v1'
const TOKEN_KEY = 'ipims_admin_token'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable: token lives only for this page */
  }
}

async function request<T>(path: string, init: RequestInit = {}, admin = false): Promise<T> {
  const headers = new Headers(init.headers)
  if (admin) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const res = await fetch(BASE + path, { ...init, headers })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      /* not JSON */
    }
    if (res.status === 401 && admin) setToken(null)
    throw new ApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

function qs(params: Record<string, string | number | string[] | undefined | null>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x))
    else sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const api = {
  analyze(photo: Blob) {
    const fd = new FormData()
    fd.append('photo', photo, 'photo.jpg')
    return request<AIResult>('/analyze', { method: 'POST', body: fd })
  },
  createReport(input: { photo: Blob; lat: number; lng: number; manual_pin: boolean; gps_accuracy_m?: number; category?: Category; description?: string }) {
    const fd = new FormData()
    fd.append('photo', input.photo, 'photo.jpg')
    fd.append('lat', String(input.lat))
    fd.append('lng', String(input.lng))
    fd.append('manual_pin', String(input.manual_pin))
    if (input.gps_accuracy_m !== undefined) fd.append('gps_accuracy_m', String(input.gps_accuracy_m))
    if (input.category) fd.append('category', input.category)
    if (input.description) fd.append('description', input.description)
    return request<ReportDetail>('/reports', { method: 'POST', body: fd })
  },
  listReports(p: { status?: Status[]; category?: Category[]; q?: string; sort?: 'newest' | 'priority'; bbox?: string; limit?: number; offset?: number } = {}) {
    return request<Page<Report>>('/reports' + qs(p))
  },
  getReport: (code: string) => request<ReportDetail>(`/reports/${encodeURIComponent(code)}`),
  stats: () => request<Stats>('/stats'),
  segments: (bbox: string) => request<FeatureCollection<SegmentProps>>('/segments' + qs({ bbox })),
  facilities: (bbox: string) => request<FeatureCollection<FacilityProps>>('/facilities' + qs({ bbox })),

  async login(username: string, password: string) {
    const res = await request<{ token: string; expires_at: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    setToken(res.token)
    return res
  },
  queue: (road_group?: RoadGroup) => request<Page<Report>>('/admin/queue' + qs({ road_group, limit: 200 }), {}, true),
  updateReport: (code: string, body: { status?: Status; note?: string; assigned_to?: string; category?: Category }) =>
    request<ReportDetail>(`/admin/reports/${encodeURIComponent(code)}`, { method: 'PATCH', body: JSON.stringify(body) }, true),
  weights: () => request<Record<RoadGroup, Weights>>('/admin/weights', {}, true),
  saveWeights: (w: Partial<Record<RoadGroup, Weights>>) =>
    request<Record<RoadGroup, Weights>>('/admin/weights', { method: 'PUT', body: JSON.stringify(w) }, true),
  graphSummary: () => request<GraphSummary>('/admin/graph/summary', {}, true),
  whatif: (repair_segment_ids: string[]) =>
    request<WhatIfResult>('/admin/whatif', { method: 'POST', body: JSON.stringify({ repair_segment_ids }) }, true),
  recommend: (budget_idr?: number) => request<Recommendation>('/admin/whatif/recommend' + qs({ budget_idr }), {}, true),
}
