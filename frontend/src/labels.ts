import type { Category, Criterion, Severity, Status } from './api'

export const CATEGORY_LABEL: Record<Category, string> = {
  jalan: 'Jalan',
  trotoar: 'Trotoar',
  drainase: 'Drainase',
  lampu_jalan: 'Lampu Jalan',
  halte: 'Halte',
  jembatan: 'Jembatan',
  lainnya: 'Lainnya',
}
export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[]

export const STATUS_LABEL: Record<Status, string> = {
  reported: 'Dilaporkan',
  ai_verified: 'Terverifikasi AI',
  gov_approved: 'Disetujui Pemerintah',
  assigned: 'Ditugaskan',
  in_repair: 'Dalam Perbaikan',
  completed: 'Selesai',
  rejected: 'Ditolak',
}
export const STATUSES = Object.keys(STATUS_LABEL) as Status[]

export const STATUS_CLASS: Record<Status, string> = {
  reported: 'bg-slate-100 text-slate-700',
  ai_verified: 'bg-sky-100 text-sky-800',
  gov_approved: 'bg-indigo-100 text-indigo-800',
  assigned: 'bg-amber-100 text-amber-800',
  in_repair: 'bg-orange-100 text-orange-800',
  completed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
}

export const SEVERITY_LABEL: Record<Severity, string> = { low: 'Ringan', mid: 'Sedang', high: 'Berat' }

export const CRITERION_LABEL: Record<Criterion, string> = {
  severity: 'Tingkat kerusakan',
  traffic: 'Kepadatan lalu lintas',
  population: 'Penduduk terdampak',
  facility: 'Kepentingan fasilitas',
  impact: 'Impact Score (jaringan)',
  reports: 'Jumlah laporan',
}

export const FACILITY_LABEL: Record<string, string> = {
  health: 'Kesehatan',
  school: 'Sekolah',
  market: 'Pasar',
  government: 'Pemerintahan',
}

export const DAMAGE_LABEL: Record<string, string> = {
  pothole: 'Lubang',
  alligator_crack: 'Retak buaya',
  crack: 'Retak',
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatIdr(n: number) {
  return 'Rp' + n.toLocaleString('id-ID')
}

export function roadName(name: string | null | undefined) {
  return name || 'Jalan tanpa nama'
}
