import { useState, type ReactNode } from 'react'
import { useCompactLayout } from '../responsive'
import { Link } from 'react-router-dom'
import { api, type Status } from '../api'
import { useAsync } from '../hooks'
import { CATEGORIES, CATEGORY_LABEL, STATUS_LABEL, METRIC_LABEL, formatDate, formatHours } from '../labels'
import { Chip, ErrorNote, Panel, Skeleton, Stat, statusColor } from '../ui/core'
import { ReportIdentity } from '../ui/ReportSummary'
import { STAGES, StageTracker } from '../ui/Progress'
import { HorizontalBars, MonthlyTrend, ReportDistribution } from '../ui/Charts'

type Scope = 'active' | 'completed' | 'all'
const ACTIVE: Status[] = ['reported', 'ai_verified', 'gov_approved', 'assigned', 'in_repair']

export default function Transparency() {
  const compact = useCompactLayout()
  const stats = useAsync(() => api.stats(), [])
  const [scope, setScope] = useState<Scope>('active')
  const list = useAsync(
    () => api.listReports({ limit: 9, status: scope === 'active' ? ACTIVE : scope === 'completed' ? ['completed'] : [] }).then((data) => ({ ...data, scope })),
    [scope],
  )
  const data = list.data?.scope === scope ? list.data : null
  const s = stats.data

  return (
    <>
    <div className="mx-auto grid page-content max-w-6xl gap-4 px-3 md:px-6">
      <h1 className="type-page">Transparency</h1>
      {stats.error && <ErrorNote message={stats.error} onRetry={stats.reload} />}

      <Panel className={compact ? "grid grid-cols-3 gap-3 p-3" : "grid grid-cols-2 gap-4 p-4 md:grid-cols-5"}>
        <Stat label="Total reports" value={s?.total ?? '-'} />
        <Stat label="In progress" value={s?.active ?? '-'} />
        <Stat label="Completed" value={s && s.total ? `${Math.round((100 * s.by_status.completed) / s.total)}%` : '—'} tone="var(--color-st-completed)" />
        {compact ? <details className="col-span-3 border-t border-line pt-2">
          <summary className="min-h-11 cursor-pointer content-center type-label text-muted">Response times</summary>
          <div className="grid grid-cols-2 gap-3 py-2">
            <Stat label={METRIC_LABEL.medianApproval} value={formatHours(s?.median_hours_to_verify)} />
            <Stat label={METRIC_LABEL.medianCompletion} value={formatHours(s?.median_hours_to_complete)} />
          </div>
        </details> : <>
        <Stat label={METRIC_LABEL.medianApproval} value={formatHours(s?.median_hours_to_verify)} />
        <Stat label={METRIC_LABEL.medianCompletion} value={formatHours(s?.median_hours_to_complete)} />
        </>}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="grid content-start gap-4">
        <ReadingSection title="Report overview" compact={compact}>

          {s ? <ReportDistribution stats={s} /> : <Skeleton className="h-48" />}
        </ReadingSection>
        <ReadingSection title="Reports by stage" compact={compact}>

          {s ? (
            <HorizontalBars label="Reports by stage" rows={[...STAGES, 'rejected' as Status].map((st) => ({ label: STATUS_LABEL[st], value: s.by_status[st], color: statusColor(st) }))} />
          ) : <Skeleton className="h-48" />}
        </ReadingSection>
        <ReadingSection title="6-month trend" compact={compact}>

          {s ? <MonthlyTrend monthly={s.monthly} /> : <Skeleton className="h-48" />}
        </ReadingSection>
        </div>

        <Panel className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="type-section">{compact ? 'Report progress' : 'Latest reports'}</h2>
            <div className={compact ? "flex flex-wrap gap-1.5 [&_button]:min-h-11" : "flex gap-1.5"}>
              {(['active', 'completed', 'all'] as Scope[]).map((k) => <Chip key={k} active={scope === k} onClick={() => setScope(k)}>{k[0].toUpperCase() + k.slice(1)}</Chip>)}
            </div>
          </div>
          <p className="mb-3 type-meta text-muted">{data ? `Showing ${compact ? Math.min(3, data.items.length) : data.items.length} of ${data.total} reports in this view.` : 'Latest reports across all categories.'} <Link to={`/laporan?scope=${scope}`} className="text-coral hover:underline">View all reports</Link></p>
          {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
          {data?.items.length === 0 && <p className="py-8 text-center type-body text-muted">No reports in this view.</p>}
          {list.loading && !data && <Skeleton className="h-48" />}
          <ul className="grid gap-1">
            {(compact ? data?.items.slice(0, 3) : data?.items)?.map((r) => (
              <li key={r.code}>
                <Link to={`/laporan/${r.code}`} className="grid gap-2 rounded-xl px-2 py-2 transition hover:bg-white/[0.04] lg:grid-cols-[minmax(0,12rem)_1fr] sm:items-center">
                  <ReportIdentity report={r} compact />
                  <StageTracker status={r.status} compact />
                  <span className="num type-meta text-muted lg:col-span-2" title="Last updated (WIB)">
                    Updated {formatDate(r.updated_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReadingSection title="Reports by category" compact={compact}>

          {s ? (
            <HorizontalBars label="Reports by category" rows={CATEGORIES.map((c) => ({ label: CATEGORY_LABEL[c], value: s.by_category[c] })).sort((a, b) => b.value - a.value)} />
          ) : <Skeleton className="h-48" />}
        </ReadingSection>
        <ReadingSection title="Top districts" compact={compact}>

          {s?.by_kecamatan ? (
            <HorizontalBars label="Reports by district" rows={Object.entries(s.by_kecamatan).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8)} />
          ) : s ? <p className="type-body text-muted">Not available yet.</p> : <Skeleton className="h-48" />}
        </ReadingSection>
      </div>
    </div>
    </>
  )
}

function ReadingSection({ title, compact, children }: { title: string; compact: boolean; children: ReactNode }) {
  if (compact) return <Panel className="px-4 py-1"><details>
    <summary className="min-h-11 cursor-pointer content-center type-section">{title}</summary>
    <div className="pb-3 pt-2">{children}</div>
  </details></Panel>
  return <Panel className="p-4"><h2 className="mb-3 type-section">{title}</h2>{children}</Panel>
}
