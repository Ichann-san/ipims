import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Status } from '../api'
import { useAsync } from '../hooks'
import { CATEGORIES, CATEGORY_LABEL, STATUS_LABEL, roadName } from '../labels'
import { Chip, ErrorNote, Panel, Skeleton, Stat, statusColor } from '../ui/core'
import { Footer } from '../ui/Footer'
import { STAGES, StageTracker } from '../ui/Progress'

// Validated with the dataviz palette script on the #0f1a31 surface (dark band, CVD and contrast pass).
const SERIES = { masuk: '#3f95cc', selesai: '#d96d48' }
const BAR = '#3f95cc'
const DAY = 86_400_000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function HBars({ rows, color }: { rows: { label: string; value: number; color?: string }[]; color?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="grid gap-2">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 text-[13px]" title={`${r.label}: ${r.value}`}>
          <span className="truncate text-muted">{r.label}</span>
          <span className="h-2.5 rounded-r-full" style={{ width: `${Math.max(2, (100 * r.value) / max)}%`, background: r.color ?? color }} />
          <span className="num text-right font-semibold">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

function Trend({ monthly }: { monthly: { month: string; reported: number; completed: number }[] }) {
  const rows = monthly.slice(-6)
  const max = Math.max(1, ...rows.flatMap((m) => [m.reported, m.completed]))
  return (
    <div className="grid gap-3">
      <div className="flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: SERIES.masuk }} />Reported</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: SERIES.selesai }} />Completed</span>
      </div>
      <div className="flex h-40 items-end gap-3 border-b border-line">
        {rows.map((m) => (
          <div key={m.month} className="flex h-full flex-1 items-end justify-center gap-[2px]">
            <span className="w-full max-w-5 rounded-t-[4px]" title={`${m.month} reported: ${m.reported}`} style={{ height: `${(100 * m.reported) / max}%`, background: SERIES.masuk }} />
            <span className="w-full max-w-5 rounded-t-[4px]" title={`${m.month} completed: ${m.completed}`} style={{ height: `${(100 * m.completed) / max}%`, background: SERIES.selesai }} />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {rows.map((m) => <span key={m.month} className="flex-1 text-center text-[11px] text-muted">{MONTHS[Number(m.month.slice(5)) - 1]}</span>)}
      </div>
    </div>
  )
}

type Scope = 'active' | 'completed' | 'all'
const ACTIVE: Status[] = ['reported', 'ai_verified', 'gov_approved', 'assigned', 'in_repair']

export default function Transparency() {
  const stats = useAsync(() => api.stats(), [])
  const [scope, setScope] = useState<Scope>('active')
  const list = useAsync(
    () => api.listReports({ limit: 12, status: scope === 'active' ? ACTIVE : scope === 'completed' ? ['completed'] : [] }),
    [scope],
  )
  const s = stats.data

  return (
    <>
    <div className="mx-auto grid max-w-6xl gap-4 px-3 pb-10 pt-24 md:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Transparency</h1>
      {stats.error && <ErrorNote message={stats.error} onRetry={stats.reload} />}

      <Panel className="grid grid-cols-2 gap-4 p-4 md:grid-cols-5">
        <Stat label="Total reports" value={s?.total ?? '-'} />
        <Stat label="In progress" value={s?.active ?? '-'} />
        <Stat label="Completed" value={s && s.total ? `${Math.round((100 * s.by_status.completed) / s.total)}%` : '-'} tone="var(--color-st-completed)" />
        <Stat label="Median to approval" value={s?.median_hours_to_verify != null ? `${s.median_hours_to_verify} h` : '-'} />
        <Stat label="Median to completion" value={s?.median_hours_to_complete != null ? `${s.median_hours_to_complete} h` : '-'} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="grid content-start gap-4">
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Reports by stage</h2>
          {s ? (
            <HBars rows={[...STAGES, 'rejected' as Status].map((st) => ({ label: STATUS_LABEL[st], value: s.by_status[st], color: statusColor(st) }))} />
          ) : <Skeleton className="h-48" />}
        </Panel>
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold">6-month trend</h2>
          {s ? <Trend monthly={s.monthly} /> : <Skeleton className="h-48" />}
        </Panel>
        </div>

        <Panel className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Report progress</h2>
            <div className="flex gap-1.5">
              {(['active', 'completed', 'all'] as Scope[]).map((k) => <Chip key={k} active={scope === k} onClick={() => setScope(k)}>{k[0].toUpperCase() + k.slice(1)}</Chip>)}
            </div>
          </div>
          {list.loading && !list.data && <Skeleton className="h-48" />}
          <ul className="grid gap-1">
            {list.data?.items.map((r) => (
              <li key={r.code}>
                <Link to={`/laporan/${r.code}`} className="grid gap-2 rounded-xl px-2 py-2 transition hover:bg-white/[0.04] sm:grid-cols-[minmax(0,12rem)_1fr_3.5rem] sm:items-center">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{r.segment ? roadName(r.segment.name) : 'Outside the network'}</span>
                    <span className="block text-xs text-muted">{CATEGORY_LABEL[r.category]}</span>
                  </span>
                  <StageTracker status={r.status} compact />
                  <span className="num text-right text-xs text-muted" title="Report age">
                    {Math.floor((Date.now() - new Date(r.created_at).getTime()) / DAY)} d
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Categories</h2>
          {s ? (
            <HBars color={BAR} rows={CATEGORIES.map((c) => ({ label: CATEGORY_LABEL[c], value: s.by_category[c] })).filter((r) => r.value > 0).sort((a, b) => b.value - a.value)} />
          ) : <Skeleton className="h-48" />}
        </Panel>
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Top districts</h2>
          {s?.by_kecamatan ? (
            <HBars color={BAR} rows={Object.entries(s.by_kecamatan).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8)} />
          ) : s ? <p className="text-sm text-muted">Not available yet.</p> : <Skeleton className="h-48" />}
        </Panel>
      </div>
    </div>
    <Footer />
    </>
  )
}
