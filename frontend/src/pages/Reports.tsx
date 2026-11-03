import { Camera, Crosshair, MagnifyingGlass, MapPin } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Marker } from 'react-map-gl/mapbox'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, ApiError, type AIResult, type Category, type Report, type ReportDetail, type Status } from '../api'
import { useAsync } from '../hooks'
import { CATEGORIES, CATEGORY_LABEL, DAMAGE_LABEL, SEVERITY_LABEL, formatDate, roadName } from '../labels'
import { MapCanvas } from '../map/MapCanvas'
import { SegmentsLayer, useSegments } from '../map/layers'
import { useRegion } from '../region'
import { Button, Chip, Empty, ErrorNote, Field, Panel, Sheet, Skeleton, StatusBadge, inputCls } from '../ui/core'
import { StageTracker, reachedStages } from '../ui/Progress'

const ACTIVE: Status[] = ['reported', 'ai_verified', 'gov_approved', 'assigned', 'in_repair']
type Scope = 'semua' | 'aktif' | 'selesai'

export default function Reports() {
  const [params, setParams] = useSearchParams()
  const { code } = useParams()
  const nav = useNavigate()
  const [scope, setScope] = useState<Scope>('semua')
  const [category, setCategory] = useState<Category | ''>('')
  const [sort, setSort] = useState<'newest' | 'priority'>('newest')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(24)
  const status = scope === 'aktif' ? ACTIVE : scope === 'selesai' ? (['completed'] as Status[]) : []
  const list = useAsync(
    () => api.listReports({ status, category: category ? [category] : [], q, sort, limit }),
    [scope, category, q, sort, limit],
  )
  const creating = params.get('buat') === '1'
  const closeForm = () => {
    params.delete('buat')
    setParams(params, { replace: true })
  }

  return (
    <div className="mx-auto max-w-6xl px-3 pb-10 pt-20 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
        <p className="num text-sm text-muted">{list.data?.total ?? 0} laporan</p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative">
          <span className="sr-only">Cari</span>
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className={`${inputCls} h-11 pl-10`} placeholder="Cari kode, jalan, keterangan"
            defaultValue={q} onKeyDown={(e) => e.key === 'Enter' && setQ((e.target as HTMLInputElement).value.trim())} />
        </label>
        <div className="flex gap-1.5">
          {(['semua', 'aktif', 'selesai'] as Scope[]).map((s) => (
            <Chip key={s} active={scope === s} onClick={() => setScope(s)}>{s[0].toUpperCase() + s.slice(1)}</Chip>
          ))}
        </div>
        <select aria-label="Kategori" className={`${inputCls} h-11 md:w-44`} value={category} onChange={(e) => setCategory(e.target.value as Category | '')}>
          <option value="">Semua kategori</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
        <select aria-label="Urutan" className={`${inputCls} h-11 md:w-36`} value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'priority')}>
          <option value="newest">Terbaru</option>
          <option value="priority">Prioritas</option>
        </select>
      </div>

      {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
      {list.loading && !list.data && (
        <div className="grid gap-2 md:grid-cols-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
      )}
      {list.data?.items.length === 0 && (
        <Empty title="Belum ada laporan yang cocok." action={<Button variant="primary" onClick={() => setParams({ buat: '1' })}>Lapor</Button>} />
      )}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {list.data?.items.map((r) => <ReportRow key={r.code} report={r} />)}
      </div>
      {list.data && list.data.total > list.data.items.length && (
        <div className="mt-4 flex justify-center"><Button onClick={() => setLimit((l) => l + 24)}>Muat lagi</Button></div>
      )}

      <Sheet open={creating} onClose={closeForm} title="Lapor kerusakan">
        <ReportForm onDone={(r) => { list.reload(); nav(`/laporan/${r.code}`, { replace: true }) }} />
      </Sheet>
      <Sheet open={!!code} onClose={() => nav('/laporan')} title={code ?? ''} wide>
        {code && <ReportDetailView code={code} />}
      </Sheet>
    </div>
  )
}

function ReportRow({ report: r }: { report: Report }) {
  return (
    <Link to={`/laporan/${r.code}`}
      className="group flex min-w-0 gap-3 rounded-2xl border border-line bg-ink-900/60 p-2.5 transition hover:border-line-strong hover:bg-ink-800">
      <img src={r.photo_url} alt="" loading="lazy" className="size-20 flex-none rounded-xl object-cover" />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold">{r.segment ? roadName(r.segment.name) : 'Di luar jaringan jalan'}</p>
          <StatusBadge status={r.status} />
        </div>
        <p className="mt-0.5 truncate text-[13px] text-muted">
          {CATEGORY_LABEL[r.category]}{r.ai ? `, kerusakan ${SEVERITY_LABEL[r.ai.severity].toLowerCase()}` : ''}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span className="num">{formatDate(r.created_at)}</span>
          {r.priority_score !== null && <span className="num font-semibold text-fg">P {r.priority_score.toFixed(0)}</span>}
        </div>
      </div>
    </Link>
  )
}

export function ReportDetailView({ code }: { code: string }) {
  const r = useAsync(() => api.getReport(code), [code])
  if (r.error) return <ErrorNote message={r.error} onRetry={r.reload} />
  if (!r.data) return <div className="grid gap-3"><Skeleton className="h-56" /><Skeleton className="h-16" /><Skeleton className="h-40" /></div>
  const d = r.data
  return (
    <div className="grid gap-4">
      <img src={d.photo_url} alt="Foto laporan" className="max-h-72 w-full rounded-xl object-cover" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{d.segment ? roadName(d.segment.name) : 'Di luar jaringan jalan'}</p>
          <p className="text-[13px] text-muted">{CATEGORY_LABEL[d.category]} · {formatDate(d.created_at)}</p>
        </div>
        <StatusBadge status={d.status} />
      </div>
      <Panel className="px-3 py-3"><StageTracker status={d.status} reached={reachedStages(d.timeline)} /></Panel>
      <dl className="grid grid-cols-3 gap-3 text-sm">
        <Fact label="Prioritas" value={d.priority_score?.toFixed(0) ?? '-'} />
        <Fact label="Dampak ruas" value={d.impact_score?.toFixed(0) ?? '-'} />
        <Fact label="Kerusakan" value={d.ai ? SEVERITY_LABEL[d.ai.severity] : '-'} />
      </dl>
      {d.assigned_to && <p className="text-sm text-muted">Ditangani <span className="font-semibold text-fg">{d.assigned_to}</span></p>}
      {d.description && <p className="text-sm">{d.description}</p>}
      <ol className="grid gap-2 border-l border-line pl-4">
        {d.timeline.map((e, i) => (
          <li key={i} className="text-sm">
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={e.to_status} /><span className="num text-xs text-muted">{formatDate(e.created_at)}</span></div>
            {e.note && <p className="mt-1 text-[13px] text-muted">{e.note}</p>}
          </li>
        ))}
      </ol>
      <Link to={`/peta?r=${d.code}`}><Button className="w-full" icon={<MapPin size={18} />}>Lihat di peta</Button></Link>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="num text-lg font-bold">{value}</dd>
    </div>
  )
}

const MAX_SIDE = 1600
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('foto'))), 'image/jpeg', 0.85))
}

/** One scrolling form: photo, AI result, location, category, note. */
function ReportForm({ onDone }: { onDone: (r: ReportDetail) => void }) {
  const region = useRegion()
  const [photo, setPhoto] = useState<Blob | null>(null)
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo])
  const [ai, setAi] = useState<AIResult | null>(null)
  const [aiState, setAiState] = useState<'idle' | 'running' | 'done' | 'off'>('idle')
  const [pos, setPos] = useState<[number, number] | null>(null) // lng, lat
  const [accuracy, setAccuracy] = useState<number>()
  const [manual, setManual] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [category, setCategory] = useState<Category | ''>('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<{ bbox: string; zoom: number } | null>(null)
  const segments = useSegments(view)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const locate = () => {
    setGpsError(null)
    if (!navigator.geolocation) return setGpsError('GPS tidak tersedia. Ketuk peta.')
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos([p.coords.longitude, p.coords.latitude]); setAccuracy(Math.round(p.coords.accuracy)); setManual(false) },
      () => setGpsError('GPS tidak tersedia. Ketuk peta.'),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }
  useEffect(locate, [])

  async function onFile(file?: File) {
    if (!file) return
    const blob = await shrink(file).catch(() => file)
    setPhoto(blob)
    setAiState('running')
    try {
      const res = await api.analyze(blob)
      setAi(res)
      setAiState('done')
      if (res.is_infrastructure) setCategory((c) => c || res.category)
    } catch {
      setAi(null)
      setAiState('off')
    }
  }

  async function submit() {
    if (!photo || !pos || !category) return
    setSending(true)
    setError(null)
    try {
      onDone(await api.createReport({
        photo, lat: pos[1], lng: pos[0], manual_pin: manual, gps_accuracy_m: manual ? undefined : accuracy,
        category: ai && ai.category === category ? undefined : category, description: note.trim() || undefined,
      }))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengirim. Periksa koneksi.')
    } finally {
      setSending(false)
    }
  }

  const center = pos ?? region.center
  return (
    <div className="grid gap-5">
      <Field label="Foto">
        <span className="relative grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-line-strong bg-ink-900/60">
          {preview ? <img src={preview} alt="Pratinjau" className="absolute inset-0 size-full object-cover" />
            : <span className="flex flex-col items-center gap-2 text-sm text-muted"><Camera size={28} />Ambil foto</span>}
          <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0" onChange={(e) => onFile(e.target.files?.[0])} />
        </span>
      </Field>
      {aiState !== 'idle' && (
        <div className="rounded-xl border border-line bg-ink-900/60 px-3 py-2 text-sm" aria-live="polite">
          {aiState === 'running' && <span className="text-muted">AI menilai foto…</span>}
          {aiState === 'off' && <span className="text-muted">AI tidak tersedia. Pilih kategori.</span>}
          {aiState === 'done' && ai && (ai.is_infrastructure
            ? <span>AI: <b>{CATEGORY_LABEL[ai.category]}</b>, kerusakan {SEVERITY_LABEL[ai.severity].toLowerCase()}{ai.damage_type ? ` (${DAMAGE_LABEL[ai.damage_type] ?? ai.damage_type})` : ''}</span>
            : <span className="text-st-rejected">AI: foto ini mungkin bukan infrastruktur.</span>)}
        </div>
      )}

      <Field label="Lokasi" hint={pos ? (manual ? 'Dipilih di peta' : `GPS ±${accuracy ?? '?'} m`) : 'Mencari lokasi…'} error={gpsError}>
        <div className="h-56 overflow-hidden rounded-xl">
          <MapCanvas key={pos ? 'located' : 'default'} controls={false}
            initialViewState={{ longitude: center[0], latitude: center[1], zoom: pos ? 16.5 : 11.5, pitch: 0 }}
            onMoveEnd={(bbox, zoom) => setView({ bbox, zoom })}
            onClick={(e) => { setPos([e.lngLat.lng, e.lngLat.lat]); setManual(true) }}>
            {segments && <SegmentsLayer data={segments} />}
            {pos && <Marker longitude={pos[0]} latitude={pos[1]}><span className="block size-4 rounded-full border-2 border-white bg-coral shadow" /></Marker>}
          </MapCanvas>
        </div>
        <Button type="button" size="sm" variant="ghost" icon={<Crosshair size={16} />} onClick={locate} className="justify-self-start">Pakai GPS</Button>
      </Field>

      <Field label="Kategori">
        <select className={`${inputCls} h-11`} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          <option value="" disabled>Pilih kategori</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}{ai?.is_infrastructure && ai.category === c ? ' (AI)' : ''}</option>)}
        </select>
      </Field>
      <Field label="Keterangan (opsional)">
        <textarea className={`${inputCls} py-2`} rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {error && <ErrorNote message={error} />}
      <Button variant="primary" disabled={!photo || !pos || !category || sending || aiState === 'running'} onClick={submit}>
        {sending ? 'Mengirim…' : 'Kirim laporan'}
      </Button>
    </div>
  )
}
