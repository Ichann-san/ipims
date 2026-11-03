import { Sliders } from '@phosphor-icons/react'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, type Category, type Criterion, type Report, type RoadGroup, type Status, type Weights } from '../../api'
import { useAsync } from '../../hooks'
import { CATEGORIES, CATEGORY_LABEL, CRITERION_LABEL, SEVERITY_LABEL, STATUS_LABEL, formatDate, roadName } from '../../labels'
import { Button, Chip, Empty, ErrorNote, Field, Modal, Panel, Sheet, Skeleton, Stat, StatusBadge, inputCls } from '../../ui/core'
import { StageTracker, reachedStages } from '../../ui/Progress'

const DAY = 86_400_000
const age = (r: Report) => Math.floor((Date.now() - new Date(r.created_at).getTime()) / DAY)
type Filter = 'semua' | RoadGroup | 'cek'

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
      setError(err instanceof ApiError ? err.message : 'Gagal masuk')
    }
  }
  return (
    <div className="grid min-h-[100dvh] place-items-center px-4">
      <Panel strong className="w-full max-w-sm p-6">
        <form onSubmit={submit} className="grid gap-4">
          <h1 className="text-xl font-bold">Masuk petugas</h1>
          <Field label="Username"><input className={`${inputCls} h-11`} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></Field>
          <Field label="Password" error={error}>
            <input className={`${inputCls} h-11`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <Button variant="primary" type="submit">Masuk</Button>
        </form>
      </Panel>
    </div>
  )
}

export default function Dashboard() {
  const { code } = useParams()
  const nav = useNavigate()
  const [filter, setFilter] = useState<Filter>('semua')
  const [weightsOpen, setWeightsOpen] = useState(false)
  const queue = useAsync(() => api.queue(), [])
  const stats = useAsync(() => api.stats(), [])

  const items = useMemo(() => {
    const all = queue.data?.items ?? []
    if (filter === 'cek') return all.filter((r) => r.needs_review || r.status === 'reported' || r.status === 'ai_verified')
    if (filter === 'semua') return all
    return all.filter((r) => (r.segment?.road_group ?? 'lingkungan') === filter)
  }, [queue.data, filter])
  const all = queue.data?.items ?? []
  const toCheck = all.filter((r) => r.status === 'reported' || r.status === 'ai_verified').length
  const overdue = all.filter((r) => age(r) >= 7).length
  const doneThisMonth = stats.data?.monthly.at(-1)?.completed ?? 0
  const refresh = () => { queue.reload(); stats.reload() }

  return (
    <div className="mx-auto max-w-7xl px-3 pb-10 pt-20 md:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Dasbor</h1>
        <Button size="sm" icon={<Sliders size={16} />} onClick={() => setWeightsOpen(true)}>Bobot prioritas</Button>
      </div>

      <Panel className="mb-4 grid grid-cols-2 gap-4 p-4 md:grid-cols-5">
        <Stat label="Laporan aktif" value={queue.data ? all.length : '-'} />
        <Stat label="Perlu persetujuan" value={queue.data ? toCheck : '-'} tone="var(--color-st-verified)" />
        <Stat label="Aktif lebih dari 7 hari" value={queue.data ? overdue : '-'} tone={overdue ? 'var(--color-coral-soft)' : undefined} />
        <Stat label="Median hingga disetujui" value={stats.data?.median_hours_to_verify != null ? `${stats.data.median_hours_to_verify} j` : '-'} />
        <Stat label="Selesai bulan ini" value={stats.data ? doneThisMonth : '-'} tone="var(--color-st-completed)" />
      </Panel>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {([['semua', 'Semua'], ['cek', 'Perlu persetujuan'], ['utama', 'Jalan utama'], ['lingkungan', 'Jalan lingkungan']] as [Filter, string][]).map(([k, l]) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{l}</Chip>
        ))}
      </div>

      {queue.error && <ErrorNote message={queue.error} onRetry={queue.reload} />}
      {queue.loading && !queue.data && <div className="grid gap-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>}
      {queue.data && items.length === 0 && <Empty title="Tidak ada laporan di antrian ini." />}

      {items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-ink-900 text-left text-xs text-muted">
              <tr>
                <th className="w-14 px-3 py-2.5 font-medium">P</th>
                <th className="px-3 py-2.5 font-medium">Laporan</th>
                <th className="hidden px-3 py-2.5 font-medium md:table-cell">Kerusakan</th>
                <th className="hidden px-3 py-2.5 font-medium md:table-cell">Dampak</th>
                <th className="px-3 py-2.5 font-medium">Tahap</th>
                <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Umur</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.code} onClick={() => nav(`/admin/laporan/${r.code}`)}
                  className="cursor-pointer border-t border-line bg-ink-950/40 transition hover:bg-ink-800">
                  <td className="num px-3 py-2 text-base font-bold">{r.priority_score?.toFixed(0) ?? '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <img src={r.photo_url} alt="" loading="lazy" className="size-10 flex-none rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="max-w-[16rem] truncate font-semibold">{r.segment ? roadName(r.segment.name) : 'Tidak terhubung'}</p>
                        <p className="text-xs text-muted">{CATEGORY_LABEL[r.category]} · {r.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2 md:table-cell">{r.ai ? SEVERITY_LABEL[r.ai.severity] : '-'}{r.needs_review && <span className="ml-2 text-xs text-st-assigned">cek</span>}</td>
                  <td className="num hidden px-3 py-2 md:table-cell">{r.impact_score?.toFixed(0) ?? '-'}</td>
                  <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                  <td className="num hidden px-3 py-2 text-right text-muted sm:table-cell">{age(r)} hari</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!code} onClose={() => nav('/admin')} title={code ?? ''} wide>
        {code && <AdminReport code={code} onChange={refresh} />}
      </Sheet>
      <Modal open={weightsOpen} onClose={() => setWeightsOpen(false)} title="Bobot prioritas">
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
      setError(e instanceof Error ? e.message : 'Gagal menyimpan')
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
          <p className="truncate text-lg font-bold">{d.segment ? roadName(d.segment.name) : 'Tidak terhubung ke ruas'}</p>
          <p className="text-[13px] text-muted">{CATEGORY_LABEL[d.category]} · {formatDate(d.created_at)}</p>
          <p className="mt-1 text-[13px] text-muted">{d.segment ? `${d.segment.highway}, ${d.snap_distance_m} m dari ruas` : `${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}`}</p>
          {d.description && <p className="mt-2 line-clamp-3 text-sm">{d.description}</p>}
        </div>
      </div>
      <Panel className="px-3 py-3"><StageTracker status={d.status} reached={reachedStages(d.timeline)} /></Panel>

      {next.length > 0 && (
        <div className="grid gap-2 rounded-xl border border-line p-3">
          {next.includes('assigned') && (
            <select aria-label="Dinas" className={`${inputCls} h-11`} value={opd} onChange={(e) => setOpd(e.target.value)}>
              {OPD.map((o) => <option key={o}>{o}</option>)}
            </select>
          )}
          <textarea aria-label="Catatan" className={`${inputCls} py-2`} rows={2} placeholder="Catatan (wajib saat menolak)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {next.map((s) => (
              <Button key={s} disabled={busy} variant={s === 'rejected' ? 'ghost' : 'primary'}
                onClick={() => apply({ status: s, note: note || undefined, assigned_to: s === 'assigned' ? opd : undefined })}>
                {STATUS_LABEL[s]}
              </Button>
            ))}
          </div>
          {error && <p className="text-sm text-st-rejected">{error}</p>}
        </div>
      )}

      {d.priority_breakdown && (
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">Prioritas</p>
            <p className="num text-2xl font-bold">{d.priority_score?.toFixed(1)}</p>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full">
            {d.priority_breakdown.map((c) => (
              <span key={c.criterion} style={{ width: `${c.contribution}%`, background: CRIT_HEX[c.criterion] }} title={CRITERION_LABEL[c.criterion]} />
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
            {d.priority_breakdown.map((c) => (
              <div key={c.criterion} className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-muted"><span className="size-2 rounded-sm" style={{ background: CRIT_HEX[c.criterion] }} />{CRITERION_LABEL[c.criterion]}</dt>
                <dd className="num">{c.contribution.toFixed(1)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="grid gap-2 text-sm">
        <p className="font-semibold">AI</p>
        {d.ai ? (
          <p className="text-muted">{CATEGORY_LABEL[d.ai.category]} {Math.round(d.ai.category_confidence * 100)}%, kerusakan {SEVERITY_LABEL[d.ai.severity].toLowerCase()} ({d.ai.severity_score.toFixed(2)}){!d.ai.is_infrastructure && ', mungkin bukan infrastruktur'}</p>
        ) : <p className="text-muted">Tidak ada hasil AI.</p>}
        <select aria-label="Koreksi kategori" className={`${inputCls} h-10`} value={d.category} onChange={(e) => apply({ category: e.target.value as Category })}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
      </div>

      <ol className="grid gap-2 border-l border-line pl-4">
        {d.timeline.map((e, i) => (
          <li key={i} className="text-sm">
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={e.to_status} /><span className="num text-xs text-muted">{formatDate(e.created_at)} · {e.actor}</span></div>
            {e.note && <p className="mt-1 text-[13px] text-muted">{e.note}</p>}
          </li>
        ))}
      </ol>
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
      <div className="grid gap-4 md:grid-cols-2">
        {(['utama', 'lingkungan'] as RoadGroup[]).map((g) => {
          const total = CRITERIA.reduce((s, c) => s + data[g][c], 0) || 1
          return (
            <div key={g} className="grid gap-3 rounded-xl border border-line p-3">
              <p className="font-semibold">{g === 'utama' ? 'Jalan utama' : 'Jalan lingkungan'}</p>
              {CRITERIA.map((c) => (
                <label key={c} className="grid gap-1">
                  <span className="flex justify-between text-[13px]"><span className="text-muted">{CRITERION_LABEL[c]}</span><span className="num">{Math.round((100 * data[g][c]) / total)}%</span></span>
                  <input type="range" min={0} max={1} step={0.01} value={data[g][c]} onChange={(e) => set(g, c, Number(e.target.value))} className="accent-[var(--color-coral)]" />
                </label>
              ))}
            </div>
          )
        })}
      </div>
      <Button variant="primary" disabled={saving} onClick={async () => { setSaving(true); await api.saveWeights(data).finally(() => setSaving(false)); onSaved() }}>
        Simpan dan hitung ulang
      </Button>
    </div>
  )
}
