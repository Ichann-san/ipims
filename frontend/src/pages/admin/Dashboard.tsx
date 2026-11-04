import { Sliders } from '@phosphor-icons/react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, type Category, type Criterion, type Report, type RoadGroup, type Status, type Weights } from '../../api'
import { useAsync } from '../../hooks'
import { useCompactLayout } from '../../responsive'
import { CATEGORIES, CATEGORY_LABEL, CRITERION_LABEL, SEVERITY_LABEL, STATUS_ACTION_LABEL, METRIC_LABEL, formatHours, formatScore } from '../../labels'
import { Button, Chip, Empty, ErrorNote, Field, Modal, Panel, Sheet, Skeleton, Stat, StatusBadge, controlCls, inputCls } from '../../ui/core'
import { StageTracker, reachedStages } from '../../ui/Progress'
import { ReportIdentity, ReportTimeline } from '../../ui/ReportSummary'
import { reportingMonth } from '../../statistics'

const DAY = 86_400_000
const age = (r: Report) => Math.floor((Date.now() - new Date(r.created_at).getTime()) / DAY)
type Filter = 'all' | RoadGroup | 'check' | 'unknown'

export function Login() {
  const nav = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await api.login(username, password)
      nav('/admin')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign-in failed')
    }
  }
  return (
    <div className="login-page page-content grid place-items-center px-4">
      <Panel strong className="w-full max-w-sm p-6">
        <form onSubmit={submit} className="grid gap-4">
          <h1 className="type-page">Officer sign in</h1>
          <Field label="Username"><input className={`${controlCls()}`} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></Field>
          <Field label="Password" error={error}>
            <input className={`${controlCls()}`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <Button variant="primary" type="submit">Sign in</Button>
        </form>
      </Panel>
    </div>
  )
}

export default function Dashboard() {
  const compact = useCompactLayout()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { code } = useParams()
  const nav = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [weightsOpen, setWeightsOpen] = useState(false)
  const queue = useAsync(() => api.queue(), [])
  const stats = useAsync(() => api.stats(), [])

  const items = useMemo(() => {
    const all = queue.data?.items ?? []
    if (filter === 'check') return all.filter((r) => r.needs_review || r.status === 'reported' || r.status === 'ai_verified')
    if (filter === 'all') return all
    if (filter === 'unknown') return all.filter((r) => !r.segment?.road_group)
    return all.filter((r) => r.segment?.road_group === filter)
  }, [queue.data, filter])
  const toCheck = stats.data?.awaiting_approval ?? 0
  const overdue = stats.data?.open_over_7_days ?? 0
  const doneThisMonth = stats.data?.monthly.find((row) => row.month === reportingMonth())?.completed ?? 0
  const refresh = () => { queue.reload(); stats.reload() }

  return (
    <div className="dashboard-page mx-auto page-content max-w-7xl px-3 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="type-page">Dashboard</h1>
        {!compact && <Button size="sm" icon={<Sliders size={16} />} onClick={() => setWeightsOpen(true)}>Road-context weights</Button>}
      </div>

      <Panel className={compact ? "dashboard-summary mb-3 grid grid-cols-3 gap-2 p-3" : "mb-4 grid grid-cols-2 gap-4 p-4 md:grid-cols-5"}>
        <Stat label="Active reports" value={stats.data?.active ?? '-'} />
        <Stat label="Awaiting approval" value={stats.data ? toCheck : '-'} tone="var(--color-st-verified)" />
        <Stat label="Open over 7 days" value={stats.data ? overdue : '-'} tone={overdue ? 'var(--color-coral-soft)' : undefined} />
        {!compact && <>
        <Stat label={METRIC_LABEL.medianApproval} value={formatHours(stats.data?.median_hours_to_verify)} />
        <Stat label="Completed this month" value={stats.data ? doneThisMonth : '-'} tone="var(--color-st-completed)" />
        </>}
      </Panel>

      {compact ? <>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="type-section">Report queue</h2>
          <Button onClick={() => setFiltersOpen(true)} icon={<Sliders size={16} />}>Filters</Button>
        </div>
        <p className="mb-3 type-meta text-muted">{queue.data ? `${items.length} of ${queue.data.total} queued reports` : 'Loading queue...'}{filter !== 'all' ? ' / Filtered' : ''}</p>
        <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Queue filters and context">
          <div className="grid gap-4">
            <Field label="Queue"><select className={controlCls()} value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
              {([['all', 'All'], ['check', 'Awaiting approval'], ['utama', 'Nearby main roads'], ['lingkungan', 'Nearby local roads'], ['unknown', 'Unlinked / unknown']] as [Filter, string][]).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select></Field>
            <p className="type-body text-muted">Up to 200 queued reports are loaded. Road groups describe nearby-road context, not the reported asset. Priority and impact use the road-context pilot model and are provisional across infrastructure categories.</p>
            <p className="type-meta text-muted">{METRIC_LABEL.medianApproval}: {formatHours(stats.data?.median_hours_to_verify)} / Completed this month: {stats.data ? doneThisMonth : '-'}</p>
            <Button onClick={() => { setFiltersOpen(false); setWeightsOpen(true) }}>Road-context weights</Button>
            <Button variant="primary" onClick={() => setFiltersOpen(false)}>Show queue</Button>
          </div>
        </Sheet>
      </> : <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {([['all', 'All'], ['check', 'Awaiting approval'], ['utama', 'Nearby main roads'], ['lingkungan', 'Nearby local roads'], ['unknown', 'Unlinked / unknown']] as [Filter, string][]).map(([k, l]) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{l}</Chip>
        ))}
      </div>

      <p className="mb-3 type-meta text-muted">{queue.data ? `Showing ${items.length} of ${queue.data.total} queued reports (up to 200 loaded).` : 'Queue count unavailable.'} Road groups describe nearby-road context, not the reported asset. Priority and impact use the road-context pilot model and are provisional across infrastructure categories.</p>
      </>}
      {queue.error && <ErrorNote message={queue.error} onRetry={queue.reload} />}
      {stats.error && <ErrorNote message={stats.error} onRetry={stats.reload} />}
      {queue.loading && !queue.data && <div className="grid gap-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>}
      {queue.data && items.length === 0 && <Empty title="No reports in this queue." />}

      {compact && items.length > 0 && <ul aria-label="Officer report queue" className="grid gap-3">
        {items.map((r) => <li key={r.code}>
          <Link to={`/admin/laporan/${r.code}`} className="flex min-w-0 gap-3 rounded-2xl border border-line bg-ink-950/40 p-3 hover:bg-ink-800">
            <img src={r.photo_url} alt="" loading="lazy" className="size-14 flex-none rounded-lg object-cover" />
            <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
              <p className="type-label font-semibold">{CATEGORY_LABEL[r.category]}</p>
              <p className="num type-meta text-muted">{r.code}</p>
              <div className="my-2 flex flex-wrap items-center gap-2"><StatusBadge status={r.status} />{r.needs_review && <span className="type-meta text-st-assigned">Needs review</span>}</div>
              <p className="num type-meta text-muted">{METRIC_LABEL.roadPriority}: <b className="text-fg">{formatScore(r.priority_score)}</b> / {age(r)} d old</p>
              <p className="mt-1 type-meta text-muted">AI damage suggestion: {r.ai ? SEVERITY_LABEL[r.ai.severity] : '-'} / {METRIC_LABEL.roadImpact}: {formatScore(r.impact_score)}</p>
            </div>
          </Link>
        </li>)}
      </ul>}
      {!compact && items.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full type-body">
            <caption className="sr-only">Officer report queue ordered by road-context priority. Scores are provisional outside the road pilot.</caption>
            <thead className="bg-ink-900 text-left type-meta text-muted">
              <tr>
                <th scope="col" className="w-24 px-3 py-2.5 font-medium">{METRIC_LABEL.roadPriority}</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Report</th>
                <th scope="col" className="hidden px-3 py-2.5 font-medium md:table-cell">AI damage suggestion</th>
                <th scope="col" className="hidden px-3 py-2.5 font-medium md:table-cell">{METRIC_LABEL.roadImpact}</th>
                <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">Stage</th>
                <th scope="col" className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Age</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.code} onClick={() => nav(`/admin/laporan/${r.code}`)}
                  className="cursor-pointer border-t border-line bg-ink-950/40 transition hover:bg-ink-800">
                  <td className="num px-3 py-2 text-base font-bold">{formatScore(r.priority_score)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <img src={r.photo_url} alt="" loading="lazy" className="size-10 flex-none rounded-lg object-cover" />
                      <div className="min-w-0">
                        <Link to={`/admin/laporan/${r.code}`} className="block rounded focus-visible:outline-2 focus-visible:outline-coral" onClick={(e) => e.stopPropagation()}>
                          <ReportIdentity report={r} compact />
                        </Link>
                        <span className="mt-1 inline-block sm:hidden"><StatusBadge status={r.status} /></span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2 md:table-cell">{r.ai ? SEVERITY_LABEL[r.ai.severity] : '-'}{r.needs_review && <span className="ml-2 type-meta text-st-assigned">check</span>}</td>
                  <td className="num hidden px-3 py-2 md:table-cell">{formatScore(r.impact_score)}</td>
                  <td className="hidden px-3 py-2 sm:table-cell"><StatusBadge status={r.status} /></td>
                  <td className="num hidden px-3 py-2 text-right text-muted sm:table-cell">{age(r)} d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!code} onClose={() => nav('/admin')} title={code ?? ''} wide>
        {code && <AdminReport code={code} onChange={refresh} />}
      </Sheet>
      <Modal open={weightsOpen} onClose={() => setWeightsOpen(false)} title="Road-context priority weights">
        <WeightsEditor onSaved={() => { setWeightsOpen(false); refresh() }} />
      </Modal>
    </div>
  )
}

const NEXT: Partial<Record<Status, Status[]>> = {
  reported: ['gov_approved', 'rejected'],
  ai_verified: ['gov_approved', 'rejected'],
  gov_approved: ['assigned', 'rejected'],
  assigned: ['in_repair'],
  in_repair: ['completed'],
}
const OPD = ['Dinas Sumber Daya Air dan Bina Marga', 'Dinas Perhubungan', 'Dinas Lingkungan Hidup', 'BPBD']
const CRIT_HEX: Record<Criterion, string> = {
  severity: '#f08a64', traffic: '#7c9bf0', population: '#5bb6e6', facility: '#e8b04a', impact: '#e0743a', reports: '#94a3b8',
}

export function AdminReport({ code, onChange }: { code: string; onChange?: () => void }) {
  const r = useAsync(() => api.getReport(code), [code])
  const [note, setNote] = useState('')
  const [opd, setOpd] = useState(OPD[0])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function apply(body: Parameters<typeof api.updateReport>[1]) {
    setBusy(true)
    setError(null)
    try {
      r.setData(await api.updateReport(code, body))
      setNote('')
      onChange?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  if (r.error) return <ErrorNote message={r.error} onRetry={r.reload} />
  if (!r.data) return <div className="grid gap-3"><Skeleton className="h-48" /><Skeleton className="h-24" /></div>
  const d = r.data
  const next = NEXT[d.status] ?? []
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-[7rem_1fr] gap-3">
        <img src={d.photo_url} alt="" className="aspect-square w-full rounded-xl object-cover" />
        <div className="min-w-0">
          <ReportIdentity report={d} />
          {d.description && <p className="mt-2 line-clamp-3 type-body">{d.description}</p>}
        </div>
      </div>
      <Panel className="px-3 py-3"><StageTracker status={d.status} reached={reachedStages(d.timeline)} /></Panel>

      {next.length > 0 && (
        <div className="grid gap-2 rounded-xl border border-line p-3">
          {next.includes('assigned') && (
            <select aria-label="Department" className={`${controlCls()}`} value={opd} onChange={(e) => setOpd(e.target.value)}>
              {OPD.map((o) => <option key={o}>{o}</option>)}
            </select>
          )}
          <textarea aria-label="Note" className={`${inputCls} py-2`} rows={2} placeholder="Note (required to reject)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {next.map((s) => (
              <Button key={s} disabled={busy} variant={s === 'rejected' ? 'ghost' : 'primary'}
                onClick={() => apply({ status: s, note: note || undefined, assigned_to: s === 'assigned' ? opd : undefined })}>
                {STATUS_ACTION_LABEL[s]}
              </Button>
            ))}
          </div>
          {error && <p className="type-body text-st-rejected">{error}</p>}
        </div>
      )}

      <p className="type-meta text-muted">Road-context pilot scores are provisional across infrastructure categories. Missing road context is unavailable analytics, not evidence of low urgency.</p>
      {d.priority_breakdown && (
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <p className="type-section">{METRIC_LABEL.roadPriority}</p>
            <p className="num text-2xl font-bold">{formatScore(d.priority_score)}</p>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full">
            {d.priority_breakdown.map((c) => (
              <span key={c.criterion} style={{ width: `${c.contribution}%`, background: CRIT_HEX[c.criterion] }} title={CRITERION_LABEL[c.criterion]} />
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 type-label">
            {d.priority_breakdown.map((c) => (
              <div key={c.criterion} className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-muted"><span className="size-2 rounded-sm" style={{ background: CRIT_HEX[c.criterion] }} />{CRITERION_LABEL[c.criterion]}</dt>
                <dd className="num">{c.contribution.toFixed(1)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="grid gap-2 type-body">
        <p className="type-section">AI suggestions</p>
        {d.ai ? (
          <p className="text-muted">{CATEGORY_LABEL[d.ai.category]} {Math.round(d.ai.category_confidence * 100)}%, {SEVERITY_LABEL[d.ai.severity].toLowerCase()} damage ({d.ai.severity_score.toFixed(2)}){!d.ai.is_infrastructure && ', may not be infrastructure'}</p>
        ) : <p className="text-muted">No AI result.</p>}
        <p className="type-meta text-muted">Recognition and damage suggestions are advisory. Correcting the category retains the existing AI severity result.</p>
        <select aria-label="Correct category" className={`${controlCls('sm')}`} value={d.category} onChange={(e) => apply({ category: e.target.value as Category })}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
      </div>

      <ReportTimeline timeline={d.timeline} showActor />
    </div>
  )
}

const CRITERIA: Criterion[] = ['severity', 'traffic', 'population', 'facility', 'impact', 'reports']

function WeightsEditor({ onSaved }: { onSaved: () => void }) {
  const w = useAsync(() => api.weights(), [])
  const [saving, setSaving] = useState(false)
  if (!w.data) return w.error ? <ErrorNote message={w.error} /> : <Skeleton className="h-64" />
  const data = w.data
  const set = (g: RoadGroup, c: Criterion, v: number) => w.setData({ ...data, [g]: { ...data[g], [c]: v } as Weights })
  return (
    <div className="grid gap-4">
      <p className="type-meta text-muted">These weights belong to the road-context pilot model. They do not validate priority across infrastructure categories.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {(['utama', 'lingkungan'] as RoadGroup[]).map((g) => {
          const total = CRITERIA.reduce((s, c) => s + data[g][c], 0) || 1
          return (
            <div key={g} className="grid gap-3 rounded-xl border border-line p-3">
              <p className="font-semibold">{g === 'utama' ? 'Main roads' : 'Local roads'}</p>
              {CRITERIA.map((c) => (
                <label key={c} className="grid gap-1">
                  <span className="flex justify-between type-label"><span className="text-muted">{CRITERION_LABEL[c]}</span><span className="num">{Math.round((100 * data[g][c]) / total)}%</span></span>
                  <input type="range" min={0} max={1} step={0.01} value={data[g][c]} onChange={(e) => set(g, c, Number(e.target.value))} className="accent-[var(--color-coral)]" />
                </label>
              ))}
            </div>
          )
        })}
      </div>
      <Button variant="primary" disabled={saving} onClick={async () => { setSaving(true); await api.saveWeights(data).finally(() => setSaving(false)); onSaved() }}>
        Save and re-rank
      </Button>
    </div>
  )
}
