import type { Category, Criterion, Report, Severity, Status } from './api'

export const CATEGORY_LABEL: Record<Category, string> = {
  jalan: 'Road',
  trotoar: 'Sidewalk',
  drainase: 'Drainage',
  lampu_jalan: 'Street light',
  halte: 'Bus stop',
  jembatan: 'Bridge',
  lainnya: 'Other',
}
export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[]

export const STATUS_LABEL: Record<Status, string> = {
  reported: 'Reported',
  ai_verified: 'AI assessed',
  gov_approved: 'Approved',
  assigned: 'Assigned',
  in_repair: 'In repair',
  completed: 'Completed',
  rejected: 'Rejected',
}
export const STATUSES = Object.keys(STATUS_LABEL) as Status[]
export const STATUS_SHORT_LABEL: Record<Status, string> = {
  ...STATUS_LABEL, ai_verified: 'AI', gov_approved: 'Approved', in_repair: 'Repair', completed: 'Done',
}
export const STATUS_ACTION_LABEL: Record<Status, string> = {
  reported: 'Mark reported', ai_verified: 'Record AI assessment', gov_approved: 'Approve',
  assigned: 'Assign', in_repair: 'Start repair', completed: 'Complete repair', rejected: 'Reject',
}
export const METRIC_LABEL = {
  medianApproval: 'Approval median', medianCompletion: 'Completion median',
  roadPriority: 'Priority', roadImpact: 'Access impact',
  modeledImprovement: 'Modeled access gap reduced',
} as const
export const ROAD_ANALYTICS_NOTE = 'Road-context estimates are provisional for non-road reports. Unlinked assets need manual review.'

export const SEVERITY_LABEL: Record<Severity, string> = { low: 'Minor', mid: 'Moderate', high: 'Severe' }

export const CRITERION_LABEL: Record<Criterion, string> = {
  severity: 'Damage severity',
  traffic: 'Road-class traffic proxy',
  population: 'Nearby buildings proxy',
  facility: 'Facility importance',
  impact: 'Road access impact',
  reports: 'Reports near this segment',
}

export const FACILITY_LABEL: Record<string, string> = {
  health: 'Health',
  school: 'School',
  market: 'Market',
  government: 'Government',
}

export const DAMAGE_LABEL: Record<string, string> = {
  pothole: 'Pothole',
  alligator_crack: 'Alligator crack',
  crack: 'Crack',
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) + ' WIB'
}

export function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export function roadName(name: string | null | undefined) {
  return name || 'Unnamed road'
}

export function formatScore(n: number | null | undefined) {
  return n != null && Number.isFinite(n) ? n.toFixed(1) : '—'
}
export function formatHours(n: number | null | undefined) {
  return n != null && Number.isFinite(n) ? `${n.toFixed(1)} h` : '—'
}
export function reportTitle(r: Pick<Report, 'category' | 'code'>) {
  return `${r.code}  ${CATEGORY_LABEL[r.category]}`
}
export function reportLocation(r: Pick<Report, 'lat' | 'lng'>) {
  return `${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`
}
export function nearbyRoad(r: Pick<Report, 'segment'>) {
  return r.segment ? `Nearby road: ${roadName(r.segment.name)}` : null
}
