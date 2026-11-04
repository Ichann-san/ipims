import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Status } from '../api'
import { useAsync } from '../hooks'
import { CATEGORIES, CATEGORY_LABEL, STATUS_LABEL, roadName } from '../labels'
import { Chip, ErrorNote, Panel, Skeleton, Stat, statusColor } from '../ui/core'
import { STAGES, StageTracker } from '../ui/Progress'
import { HorizontalBars, MonthlyTrend, ReportDistribution } from '../ui/Charts'

const DAY = 86_400_000

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
    <div className="mx-auto grid page-content max-w-6xl gap-4 px-3 md:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Transparency</h1>
      {stats.error && <ErrorNote message={stats.error} onRetry={stats.reload} />}

      <Panel className="grid grid-cols-2 gap-4 p-4 md:grid-cols-5">
        <Stat label="Total reports" value={s?.total ?? '-'} />
        <Stat label="In progress" value={s?.active ?? '-'} />
        <Stat label="Completed / all reports" value={s && s.total ? `${Math.round((100 * s.by_status.completed) / s.total)}%` : '-'} tone="var(--color-st-completed)" />
        <Stat label="Median to approval" value={s?.median_hours_to_verify != null ? `${s.median_hours_to_verify} h` : '-'} />
        <Stat label="Median to completion" value={s?.median_hours_to_complete != null ? `${s.median_hours_to_complete} h` : '-'} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="grid content-start gap-4">
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Report overview</h2>
          {s ? <ReportDistribution stats={s} /> : <Skeleton className="h-48" />}
        </Panel>
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Reports by stage</h2>
          {s ? (
            <HorizontalBars label="Reports by stage" rows={[...STAGES, 'rejected' as Status].map((st) => ({ label: STATUS_LABEL[st], value: s.by_status[st], color: statusColor(st) }))} />
          ) : <Skeleton className="h-48" />}
        </Panel>
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold">6-month trend</h2>
          {s ? <MonthlyTrend monthly={s.monthly} /> : <Skeleton className="h-48" />}
        </Panel>
        </div>

        <Panel className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Report progress</h2>
            <div className="flex gap-1.5">
              {(['active', 'completed', 'all'] as Scope[]).map((k) => <Chip key={k} active={scope === k} onClick={() => setScope(k)}>{k[0].toUpperCase() + k.slice(1)}</Chip>)}
            </div>
          </div>
          {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
          {list.data?.items.length === 0 && <p className="py-8 text-center text-sm text-muted">No reports in this view.</p>}
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
            <HorizontalBars label="Reports by category" rows={CATEGORIES.map((c) => ({ label: CATEGORY_LABEL[c], value: s.by_category[c] })).filter((r) => r.value > 0).sort((a, b) => b.value - a.value)} />
          ) : <Skeleton className="h-48" />}
        </Panel>
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Top districts</h2>
          {s?.by_kecamatan ? (
            <HorizontalBars label="Reports by district" rows={Object.entries(s.by_kecamatan).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8)} />
          ) : s ? <p className="text-sm text-muted">Not available yet.</p> : <Skeleton className="h-48" />}
        </Panel>
      </div>
    </div>
    </>
  )
}
