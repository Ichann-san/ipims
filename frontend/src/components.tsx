import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { PriorityItem, Report, Status, StatusEvent } from './api'
import { CATEGORY_LABEL, CRITERION_LABEL, DAMAGE_LABEL, SEVERITY_LABEL, STATUS_CLASS, STATUS_LABEL, formatDate, roadName } from './labels'

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)
  const reload = useCallback(() => {
    setLoading(true)
    run()
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [run])
  useEffect(reload, [reload])
  return { data, error, loading, reload, setData }
}

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
}

export function Loading({ error, loading }: { error: string | null; loading: boolean }) {
  if (error) return <p className="rounded bg-rose-50 p-3 text-sm text-rose-700">Gagal memuat: {error}</p>
  if (loading) return <p className="p-3 text-sm text-slate-500">Memuat…</p>
  return null
}

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
      {title && <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>}
      {children}
    </section>
  )
}

export function Timeline({ events }: { events: StatusEvent[] }) {
  return (
    <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
      {events.map((e, i) => (
        <li key={i}>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={e.to_status} />
            <span className="text-xs text-slate-500">{formatDate(e.created_at)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">oleh {e.actor === 'citizen' ? 'warga' : e.actor}</p>
          {e.note && <p className="mt-1 text-sm text-slate-700">{e.note}</p>}
        </li>
      ))}
    </ol>
  )
}

export function PriorityBreakdown({ items, total }: { items: PriorityItem[]; total: number | null }) {
  return (
    <div>
      <p className="mb-2 text-2xl font-semibold">{total?.toFixed(1) ?? '–'}<span className="text-sm text-slate-500"> / 100</span></p>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-slate-500">
          <tr><th className="py-1">Kriteria</th><th>Nilai</th><th>Bobot</th><th className="text-right">Kontribusi</th></tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.criterion} className="border-t border-slate-100">
              <td className="py-1">{CRITERION_LABEL[c.criterion]}</td>
              <td>{c.value.toFixed(2)}</td>
              <td>{(c.weight * 100).toFixed(0)}%</td>
              <td className="text-right">{c.contribution.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AIBox({ report }: { report: Report }) {
  const ai = report.ai
  if (!ai) return <p className="text-sm text-slate-500">Analisis AI tidak tersedia — menunggu verifikasi petugas.</p>
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      <dt className="text-slate-500">Kategori AI</dt><dd>{CATEGORY_LABEL[ai.category]} ({Math.round(ai.category_confidence * 100)}%)</dd>
      <dt className="text-slate-500">Kerusakan</dt><dd>{SEVERITY_LABEL[ai.severity]} ({ai.severity_score.toFixed(2)})</dd>
      {ai.damage_type && (<><dt className="text-slate-500">Jenis</dt><dd>{DAMAGE_LABEL[ai.damage_type] ?? ai.damage_type}</dd></>)}
      {!ai.is_infrastructure && (<><dt className="text-slate-500">Catatan</dt><dd className="text-rose-700">Foto mungkin bukan infrastruktur</dd></>)}
      <dt className="text-slate-500">Model</dt><dd className="text-xs">{ai.model_version}</dd>
    </dl>
  )
}

export function ReportCard({ report, to }: { report: Report; to: string }) {
  return (
    <Link to={to} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-400">
      <img src={report.photo_url} alt="" className="h-20 w-20 flex-none rounded object-cover" loading="lazy" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{CATEGORY_LABEL[report.category]}</span>
          <StatusBadge status={report.status} />
          {report.ai && <span className="text-xs text-slate-500">kerusakan {SEVERITY_LABEL[report.ai.severity].toLowerCase()}</span>}
        </div>
        <p className="truncate text-sm text-slate-700">{report.segment ? roadName(report.segment.name) : 'Di luar jaringan jalan'}</p>
        <p className="truncate text-xs text-slate-500">{report.description ?? ''}</p>
        <p className="text-xs text-slate-400">{report.code} · {formatDate(report.created_at)}</p>
      </div>
      {report.priority_score !== null && (
        <div className="text-right">
          <p className="text-lg font-semibold">{report.priority_score.toFixed(0)}</p>
          <p className="text-[10px] text-slate-500">prioritas</p>
        </div>
      )}
    </Link>
  )
}
