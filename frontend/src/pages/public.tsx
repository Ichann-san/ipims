import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api, type Category, type Status } from '../api'
import { AIBox, Card, Loading, ReportCard, StatusBadge, Timeline, useAsync } from '../components'
import { CATEGORIES, CATEGORY_LABEL, STATUSES, STATUS_LABEL, formatDate, roadName } from '../labels'
import { InfraMap } from '../map'

export function Home() {
  const stats = useAsync(() => api.stats(), [])
  const recent = useAsync(() => api.listReports({ limit: 5 }), [])
  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-semibold">Laporkan kerusakan infrastruktur di Kabupaten Kediri</h1>
        <p className="mt-1 text-sm text-slate-600">
          Foto kerusakan, kirim lokasi, dan pantau penanganannya. AI mengenali jenis kerusakan, lalu sistem menghitung prioritas
          berdasarkan dampaknya pada jaringan jalan.
        </p>
        <Link to="/lapor" className="mt-3 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">Buat laporan</Link>
      </Card>
      <Loading {...stats} />
      {stats.data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total laporan" value={stats.data.total} />
          <Stat label="Sedang ditangani" value={stats.data.active} />
          <Stat label="Selesai" value={stats.data.by_status.completed} />
          <Stat label="Median hingga disetujui" value={stats.data.median_hours_to_verify === null ? '–' : `${stats.data.median_hours_to_verify} jam`} />
        </div>
      )}
      <Card title="Laporan terbaru">
        <Loading {...recent} />
        <div className="space-y-2">
          {recent.data?.items.map((r) => <ReportCard key={r.code} report={r} to={`/laporan/${r.code}`} />)}
          {recent.data?.items.length === 0 && <p className="text-sm text-slate-500">Belum ada laporan.</p>}
        </div>
        <Link to="/laporan" className="mt-3 inline-block text-sm text-sky-700">Lihat semua laporan →</Link>
      </Card>
    </div>
  )
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  )
}

export function ReportList() {
  const [params, setParams] = useSearchParams()
  const status = params.getAll('status') as Status[]
  const category = params.getAll('category') as Category[]
  const q = params.get('q') ?? ''
  const sort = (params.get('sort') as 'newest' | 'priority') ?? 'newest'
  const [limit, setLimit] = useState(20)
  const list = useAsync(() => api.listReports({ status, category, q, sort, limit }), [params.toString(), limit])

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Daftar laporan</h1>
      <div className="grid gap-2 sm:grid-cols-4">
        <input className="rounded border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2" placeholder="Cari kode, jalan, deskripsi…"
          defaultValue={q} onKeyDown={(e) => e.key === 'Enter' && set('q', (e.target as HTMLInputElement).value)} />
        <select className="rounded border border-slate-300 px-2 py-1.5 text-sm" value={category[0] ?? ''} onChange={(e) => set('category', e.target.value)}>
          <option value="">Semua kategori</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
        <select className="rounded border border-slate-300 px-2 py-1.5 text-sm" value={status[0] ?? ''} onChange={(e) => set('status', e.target.value)}>
          <option value="">Semua status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>
      <div className="flex gap-2 text-sm">
        <span className="text-slate-500">Urutkan:</span>
        {(['newest', 'priority'] as const).map((s) => (
          <button key={s} onClick={() => set('sort', s)} className={sort === s ? 'font-semibold underline' : 'text-sky-700'}>
            {s === 'newest' ? 'Terbaru' : 'Prioritas'}
          </button>
        ))}
      </div>
      <Loading {...list} />
      <p className="text-xs text-slate-500">{list.data?.total ?? 0} laporan</p>
      <div className="space-y-2">{list.data?.items.map((r) => <ReportCard key={r.code} report={r} to={`/laporan/${r.code}`} />)}</div>
      {list.data && list.data.total > list.data.items.length && (
        <button onClick={() => setLimit((l) => l + 20)} className="w-full rounded border border-slate-300 py-2 text-sm">Muat lebih banyak</button>
      )}
    </div>
  )
}

export function ReportDetailPage() {
  const { code = '' } = useParams()
  const r = useAsync(() => api.getReport(code), [code])
  if (!r.data) return <Loading {...r} />
  const d = r.data
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">{CATEGORY_LABEL[d.category]} · {d.code}</h1>
        <StatusBadge status={d.status} />
      </div>
      <p className="text-sm text-slate-600">{d.segment ? roadName(d.segment.name) : 'Lokasi di luar jaringan jalan pilot'} · {formatDate(d.created_at)}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <img src={d.photo_url} alt="Foto laporan" className="w-full rounded-lg object-cover" />
        <InfraMap className="h-72" center={[d.lat, d.lng]} zoom={16} reports={[d]} showSegments />
      </div>
      {d.description && <Card title="Deskripsi"><p className="text-sm">{d.description}</p></Card>}
      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Analisis AI"><AIBox report={d} /></Card>
        <Card title="Prioritas">
          <p className="text-2xl font-semibold">{d.priority_score?.toFixed(1) ?? '–'}<span className="text-sm text-slate-500"> / 100</span></p>
          <p className="text-sm text-slate-600">Impact Score ruas jalan: {d.impact_score?.toFixed(0) ?? '–'} / 100</p>
          {d.assigned_to && <p className="mt-1 text-sm">Ditangani oleh: <strong>{d.assigned_to}</strong></p>}
        </Card>
      </div>
      <Card title="Riwayat penanganan"><Timeline events={d.timeline} /></Card>
    </div>
  )
}

export function MapPage() {
  const reports = useAsync(() => api.listReports({ limit: 100, status: ['reported', 'ai_verified', 'gov_approved', 'assigned', 'in_repair', 'completed'] }), [])
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Peta laporan</h1>
      <p className="text-sm text-slate-600">Titik berwarna menunjukkan status laporan. Ruas jalan berwarna menunjukkan dampaknya terhadap akses warga ke fasilitas.</p>
      <Loading {...reports} />
      <InfraMap className="h-[70vh]" reports={reports.data?.items ?? []} reportLink={(r) => `/laporan/${r.code}`} showSegments showFacilities />
    </div>
  )
}

export function Transparency() {
  const s = useAsync(() => api.stats(), [])
  if (!s.data) return <Loading {...s} />
  const d = s.data
  const maxMonth = Math.max(1, ...d.monthly.map((m) => Math.max(m.reported, m.completed)))
  const maxCat = Math.max(1, ...Object.values(d.by_category))
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Transparansi penanganan</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total laporan" value={d.total} />
        <Stat label="Tingkat penyelesaian" value={`${Math.round(d.completed_rate * 100)}%`} />
        <Stat label="Median hingga disetujui" value={d.median_hours_to_verify === null ? '–' : `${d.median_hours_to_verify} jam`} />
        <Stat label="Median hingga selesai" value={d.median_hours_to_complete === null ? '–' : `${d.median_hours_to_complete} jam`} />
      </div>
      <Card title="Status laporan">
        <div className="space-y-1">
          {STATUSES.map((st) => (
            <div key={st} className="flex items-center gap-2 text-sm">
              <span className="w-44"><StatusBadge status={st} /></span>
              <span className="font-medium">{d.by_status[st]}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Laporan per kategori">
        {CATEGORIES.map((c) => (
          <div key={c} className="mb-1 flex items-center gap-2 text-sm">
            <span className="w-28">{CATEGORY_LABEL[c]}</span>
            <div className="h-3 flex-1 rounded bg-slate-100"><div className="h-3 rounded bg-slate-700" style={{ width: `${(100 * d.by_category[c]) / maxCat}%` }} /></div>
            <span className="w-8 text-right">{d.by_category[c]}</span>
          </div>
        ))}
      </Card>
      <Card title="Tren bulanan (masuk / selesai)">
        {d.monthly.map((m) => (
          <div key={m.month} className="mb-2 text-sm">
            <p className="text-xs text-slate-500">{m.month}</p>
            <div className="h-2 rounded bg-sky-600" style={{ width: `${(100 * m.reported) / maxMonth}%` }} title={`${m.reported} masuk`} />
            <div className="mt-0.5 h-2 rounded bg-emerald-600" style={{ width: `${(100 * m.completed) / maxMonth}%` }} title={`${m.completed} selesai`} />
          </div>
        ))}
        {d.monthly.length === 0 && <p className="text-sm text-slate-500">Belum ada data.</p>}
      </Card>
    </div>
  )
}
