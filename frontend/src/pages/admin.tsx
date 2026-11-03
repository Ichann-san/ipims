import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, type Category, type Criterion, type RoadGroup, type Status, type WhatIfResult } from '../api'
import { AIBox, Card, Loading, PriorityBreakdown, StatusBadge, Timeline, useAsync } from '../components'
import { CATEGORIES, CATEGORY_LABEL, CRITERION_LABEL, FACILITY_LABEL, SEVERITY_LABEL, STATUS_LABEL, formatDate, formatIdr, roadName } from '../labels'
import { ImpactLegend, InfraMap } from '../map'

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
    <form onSubmit={submit} className="mx-auto mt-16 max-w-sm space-y-3 rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-lg font-semibold">Masuk petugas</h1>
      <input className="w-full rounded border border-slate-300 px-2 py-1.5" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
      <input className="w-full rounded border border-slate-300 px-2 py-1.5" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <button className="w-full rounded-md bg-slate-900 py-2 text-sm text-white">Masuk</button>
    </form>
  )
}

export function Queue() {
  const [group, setGroup] = useState<RoadGroup | ''>('')
  const q = useAsync(() => api.queue(group || undefined), [group])
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Antrian prioritas</h1>
        <div className="flex gap-1 text-sm">
          {(['', 'utama', 'lingkungan'] as const).map((g) => (
            <button key={g} onClick={() => setGroup(g)} className={`rounded px-3 py-1 ${group === g ? 'bg-slate-900 text-white' : 'border border-slate-300'}`}>
              {g === '' ? 'Semua' : g === 'utama' ? 'Jalan utama' : 'Jalan lingkungan'}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-slate-600">Laporan aktif diurutkan berdasarkan Priority Score (MCDM). Klik baris untuk melihat rincian dan menindaklanjuti.</p>
      <Loading {...q} />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr><th className="p-2">#</th><th>Laporan</th><th>Ruas</th><th>Kerusakan</th><th>Impact</th><th>Prioritas</th><th>Status</th><th>Masuk</th></tr>
          </thead>
          <tbody>
            {q.data?.items.map((r, i) => (
              <tr key={r.code} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-2 text-slate-400">{i + 1}</td>
                <td><Link className="text-sky-700" to={`/admin/laporan/${r.code}`}>{r.code}</Link><br /><span className="text-xs">{CATEGORY_LABEL[r.category]}</span></td>
                <td className="max-w-48 truncate">{r.segment ? roadName(r.segment.name) : <span className="text-amber-700">tidak terhubung</span>}<br /><span className="text-xs text-slate-500">{r.segment?.highway}</span></td>
                <td>{r.ai ? SEVERITY_LABEL[r.ai.severity] : '–'}{r.needs_review && <span className="ml-1 text-xs text-amber-700">perlu cek</span>}</td>
                <td>{r.impact_score?.toFixed(0) ?? '–'}</td>
                <td className="font-semibold">{r.priority_score?.toFixed(1) ?? '–'}</td>
                <td><StatusBadge status={r.status} /></td>
                <td className="text-xs text-slate-500">{formatDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {q.data?.items.length === 0 && <p className="p-3 text-sm text-slate-500">Tidak ada laporan aktif.</p>}
      </div>
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
const OPD = ['Dinas PUPR', 'Dinas Perhubungan', 'Dinas Perkim (PJU)', 'BPBD']

export function ManageReport() {
  const { code = '' } = useParams()
  const r = useAsync(() => api.getReport(code), [code])
  const [note, setNote] = useState('')
  const [assignee, setAssignee] = useState(OPD[0])
  const [error, setError] = useState<string | null>(null)

  async function apply(body: Parameters<typeof api.updateReport>[1]) {
    setError(null)
    try {
      r.setData(await api.updateReport(code, body))
      setNote('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan')
    }
  }

  if (!r.data) return <Loading {...r} />
  const d = r.data
  return (
    <div className="space-y-3">
      <Link to="/admin" className="text-sm text-sky-700">← Antrian</Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">{d.code}</h1>
        <StatusBadge status={d.status} />
        {d.needs_review && <span className="rounded bg-amber-100 px-2 text-xs text-amber-800">perlu verifikasi manual</span>}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="grid gap-3 md:grid-cols-2">
            <img src={d.photo_url} alt="" className="w-full rounded-lg object-cover" />
            <InfraMap className="h-64" center={[d.lat, d.lng]} zoom={16} reports={[d]} showSegments showFacilities />
          </div>
          <Card title="Lokasi">
            <p className="text-sm">{d.segment ? `${roadName(d.segment.name)} (${d.segment.highway}, ${d.segment.road_group})` : 'Tidak terhubung ke ruas jalan'}</p>
            <p className="text-xs text-slate-500">
              {d.lat.toFixed(5)}, {d.lng.toFixed(5)} · {d.manual_pin ? 'pin manual' : 'GPS'}{d.snap_distance_m !== null ? ` · ${d.snap_distance_m} m dari ruas` : ''}
            </p>
            {d.description && <p className="mt-2 text-sm">{d.description}</p>}
          </Card>
          <Card title="Riwayat"><Timeline events={d.timeline} /></Card>
        </div>
        <div className="space-y-3">
          <Card title="Tindak lanjut">
            {(NEXT[d.status] ?? []).length === 0 && <p className="text-sm text-slate-500">Laporan sudah ditutup.</p>}
            {(NEXT[d.status] ?? []).includes('assigned') && (
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="mb-2 w-full rounded border border-slate-300 px-2 py-1.5 text-sm">
                {OPD.map((o) => <option key={o}>{o}</option>)}
              </select>
            )}
            {(NEXT[d.status] ?? []).length > 0 && (
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Catatan (wajib jika menolak)"
                className="mb-2 w-full rounded border border-slate-300 p-2 text-sm" />
            )}
            <div className="flex flex-wrap gap-2">
              {(NEXT[d.status] ?? []).map((s) => (
                <button key={s} onClick={() => apply({ status: s, note: note || undefined, assigned_to: s === 'assigned' ? assignee : undefined })}
                  className={`rounded-md px-3 py-1.5 text-sm ${s === 'rejected' ? 'border border-rose-300 text-rose-700' : 'bg-slate-900 text-white'}`}>
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
          </Card>
          <Card title="Priority Score">{d.priority_breakdown && <PriorityBreakdown items={d.priority_breakdown} total={d.priority_score} />}</Card>
          <Card title="Analisis AI">
            <AIBox report={d} />
            <label className="mt-3 block text-xs text-slate-500">Koreksi kategori</label>
            <select value={d.category} onChange={(e) => apply({ category: e.target.value as Category })} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </Card>
        </div>
      </div>
    </div>
  )
}

const CRITERIA: Criterion[] = ['severity', 'traffic', 'population', 'facility', 'impact', 'reports']

export function WeightsPage() {
  const w = useAsync(() => api.weights(), [])
  const [saved, setSaved] = useState(false)
  if (!w.data) return <Loading {...w} />
  const data = w.data
  const setValue = (g: RoadGroup, c: Criterion, v: number) => {
    setSaved(false)
    w.setData({ ...data, [g]: { ...data[g], [c]: v } })
  }
  async function save() {
    w.setData(await api.saveWeights(data))
    setSaved(true)
  }
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Bobot MCDM</h1>
      <p className="text-sm text-slate-600">Bobot dinormalisasi agar berjumlah 100%. Menyimpan akan menghitung ulang prioritas semua laporan aktif.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {(['utama', 'lingkungan'] as RoadGroup[]).map((g) => {
          const total = CRITERIA.reduce((s, c) => s + data[g][c], 0) || 1
          return (
            <Card key={g} title={g === 'utama' ? 'Jalan utama (trunk, primary, secondary)' : 'Jalan lingkungan'}>
              {CRITERIA.map((c) => (
                <div key={c} className="mb-2">
                  <div className="flex justify-between text-sm"><span>{CRITERION_LABEL[c]}</span><span>{Math.round((100 * data[g][c]) / total)}%</span></div>
                  <input type="range" min={0} max={1} step={0.01} value={data[g][c]} onChange={(e) => setValue(g, c, Number(e.target.value))} className="w-full" />
                </div>
              ))}
            </Card>
          )
        })}
      </div>
      <button onClick={save} className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">Simpan dan hitung ulang</button>
      {saved && <span className="ml-3 text-sm text-emerald-700">Tersimpan.</span>}
    </div>
  )
}

export function NetworkPage() {
  const summary = useAsync(() => api.graphSummary(), [])
  const queue = useAsync(() => api.queue(), [])
  const rec = useAsync(() => api.recommend(), [])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<WhatIfResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const damaged = new Map<string, string>()
  queue.data?.items.forEach((r) => r.segment && damaged.set(r.segment.id, roadName(r.segment.name)))

  function toggle(id: string) {
    if (!damaged.has(id)) return
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
    setResult(null)
  }

  async function run(ids: string[]) {
    setRunning(true)
    setError(null)
    try {
      setResult(await api.whatif(ids))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulasi gagal')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Jaringan & simulasi what-if</h1>
      {summary.data && (
        <p className="text-sm text-slate-600">
          Graf {summary.data.segments.toLocaleString('id-ID')} ruas jalan di {summary.data.area.join(', ')} ·{' '}
          {Object.entries(summary.data.facilities).map(([k, v]) => `${v} ${FACILITY_LABEL[k] ?? k}`).join(', ')}
          {summary.data.impact_model.version && ` · model ${summary.data.impact_model.version} (Spearman ${summary.data.impact_model.spearman?.toFixed(2)})`}
        </p>
      )}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <InfraMap className="h-[60vh]" reports={queue.data?.items ?? []} reportLink={(r) => `/admin/laporan/${r.code}`}
            showSegments showFacilities highlight={selected} onSegmentClick={(s) => toggle(s.id)} />
          <ImpactLegend />
          <p className="text-xs text-slate-500">Klik ruas yang memiliki laporan aktif untuk memasukkannya ke skenario perbaikan.</p>
        </div>
        <div className="space-y-3">
          <Card title={`Skenario perbaikan (${selected.size} ruas)`}>
            <ul className="mb-2 space-y-1 text-sm">
              {[...selected].map((id) => (
                <li key={id} className="flex justify-between"><span className="truncate">{damaged.get(id)}</span>
                  <button onClick={() => toggle(id)} className="text-xs text-rose-700">hapus</button></li>
              ))}
            </ul>
            <button disabled={running || selected.size === 0} onClick={() => run([...selected])}
              className="w-full rounded-md bg-slate-900 py-2 text-sm text-white disabled:opacity-40">{running ? 'Menghitung…' : 'Jalankan simulasi'}</button>
            {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
          </Card>
          {result && (
            <Card title="Hasil simulasi">
              <p className="text-2xl font-semibold">{result.improvement_pct.toFixed(1)}%<span className="text-sm font-normal text-slate-500"> pemulihan akses</span></p>
              <p className="text-sm text-slate-600">
                Rata-rata waktu tempuh ke fasilitas: {result.accessibility_before.toFixed(3)} → {result.accessibility_after.toFixed(3)} menit
                (tanpa kerusakan {result.accessibility_baseline.toFixed(3)})
              </p>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {Object.entries(result.by_facility).map(([k, v]) => (
                    <tr key={k} className="border-t border-slate-100"><td className="py-1">{FACILITY_LABEL[k] ?? k}</td>
                      <td className="text-right">{v.before.toFixed(2)} → {v.after.toFixed(2)} mnt</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-sm">Biaya ±{formatIdr(result.cost_estimate_idr)} · {result.duration_days} hari kerja</p>
              <details className="mt-2 text-xs text-slate-500"><summary>Asumsi</summary><ul className="list-disc pl-4">{result.assumptions.map((a) => <li key={a}>{a}</li>)}</ul></details>
            </Card>
          )}
          <Card title="Rekomendasi urutan perbaikan">
            <Loading {...rec} />
            <ol className="space-y-1 text-sm">
              {rec.data?.order.slice(0, 10).map((o, i) => (
                <li key={o.segment_id} className="flex justify-between gap-2">
                  <span className="truncate">{i + 1}. {roadName(o.name)}</span>
                  <span className="whitespace-nowrap text-xs text-slate-500">−{o.gain_minutes.toFixed(3)} mnt · {formatIdr(o.cost_idr)}</span>
                </li>
              ))}
            </ol>
            {rec.data && rec.data.order.length > 0 && (
              <button onClick={() => { const ids = rec.data!.order.slice(0, 3).map((o) => o.segment_id); setSelected(new Set(ids)); run(ids) }}
                className="mt-2 w-full rounded-md border border-slate-300 py-1.5 text-sm">Simulasikan 3 teratas</button>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

