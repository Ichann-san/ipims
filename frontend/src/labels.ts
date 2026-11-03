import type { Category, Criterion, Severity, Status } from './api'

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
  ai_verified: 'AI verified',
  gov_approved: 'Approved',
  assigned: 'Assigned',
  in_repair: 'In repair',
  completed: 'Completed',
  rejected: 'Rejected',
}
export const STATUSES = Object.keys(STATUS_LABEL) as Status[]

export const SEVERITY_LABEL: Record<Severity, string> = { low: 'Minor', mid: 'Moderate', high: 'Severe' }

export const CRITERION_LABEL: Record<Criterion, string> = {
  severity: 'Damage severity',
  traffic: 'Traffic',
  population: 'People affected',
  facility: 'Facility importance',
  impact: 'Network impact',
  reports: 'Report count',
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
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatIdr(n: number) {
  return 'Rp' + n.toLocaleString('en-US')
}

export function roadName(name: string | null | undefined) {
  return name || 'Unnamed road'
}
