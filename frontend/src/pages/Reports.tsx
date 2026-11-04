import { Camera, Crosshair, MagnifyingGlass, MapPin } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Marker, type MapRef } from 'react-map-gl/mapbox'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, ApiError, type AIResult, type Category, type Report, type ReportDetail, type Status } from '../api'
import { useAsync } from '../hooks'
import { CATEGORIES, CATEGORY_LABEL, DAMAGE_LABEL, SEVERITY_LABEL, formatDate, roadName } from '../labels'
import { MapCanvas } from '../map/MapCanvas'
import { SegmentsLayer, useSegments } from '../map/layers'
import { useRegion } from '../region'
import { Button, ButtonLink, Chip, Empty, ErrorNote, Field, Panel, Sheet, Skeleton, StatusBadge, inputCls } from '../ui/core'
import { Pagination } from '../ui/Pagination'
import { initialPageSize, PAGE_SIZES, readReportPage } from '../reportPaging'
import { StageTracker, reachedStages } from '../ui/Progress'

const ACTIVE: Status[] = ['reported', 'ai_verified', 'gov_approved', 'assigned', 'in_repair']
type Scope = 'all' | 'active' | 'completed'

export default function Reports() {
  const [params, setParams] = useSearchParams()
  const { code } = useParams()
  const nav = useNavigate()
  const [defaultSize] = useState(() => initialPageSize(window.innerWidth))
  const { page, pageSize } = readReportPage(params, defaultSize)
  const scope: Scope = params.get('scope') === 'active' ? 'active' : params.get('scope') === 'completed' ? 'completed' : 'all'
  const category = CATEGORIES.includes(params.get('category') as Category) ? params.get('category') as Category : ''
  const sort = params.get('sort') === 'priority' ? 'priority' : 'newest'
  const q = params.get('q') ?? ''
  const status = scope === 'active' ? ACTIVE : scope === 'completed' ? (['completed'] as Status[]) : []
  const queryKey = JSON.stringify([scope, category, sort, q, page, pageSize])
  const list = useAsync(
    (signal) => api.listReports({ status, category: category ? [category] : [], q, sort, limit: pageSize, offset: (page - 1) * pageSize }, signal)
      .then((data) => ({ ...data, queryKey })),
    [queryKey],
  )
  const data = list.data?.queryKey === queryKey ? list.data : null
  const creating = params.get('buat') === '1'
  const listParams = new URLSearchParams(params)
  listParams.delete('buat')
  listParams.set('size', String(pageSize))
  listParams.set('page', String(page))
  const search = `?${listParams.toString()}`
  const change = (patch: Record<string, string>, resetPage = true, replace = false) => {
    const next = new URLSearchParams(params)
    next.set('size', String(pageSize))
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (resetPage) next.set('page', '1')
    setParams(next, { preventScrollReset: true, replace })
  }
  useEffect(() => {
    if (!data || list.loading) return
    const last = Math.max(1, Math.ceil(data.total / pageSize))
    if (page > last) {
      const next = new URLSearchParams(params)
      next.set('page', String(last))
      next.set('size', String(pageSize))
      setParams(next, { replace: true, preventScrollReset: true })
    }
  }, [data, list.loading, page, pageSize, params, setParams])
  const closeForm = () => change({ buat: '' }, false, true)

  return (
    <div className="reports-page page-content mx-auto max-w-6xl px-3 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="num text-sm text-muted">{data?.total ?? 0} {data?.total === 1 ? 'report' : 'reports'}</p>
      </div>
      <div className="reports-filters mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 basis-64">
          <span className="sr-only">Search</span>
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input key={q} className={`${inputCls} h-11 pl-10`} placeholder="Search code, road, note"
            defaultValue={q} onKeyDown={(e) => e.key === 'Enter' && change({ q: (e.target as HTMLInputElement).value.trim() })} />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'active', 'completed'] as Scope[]).map((s) => <Chip key={s} active={scope === s} onClick={() => change({ scope: s })}>{s[0].toUpperCase() + s.slice(1)}</Chip>)}
        </div>
        <select aria-label="Category" className={`${inputCls} h-11 w-40`} value={category} onChange={(e) => change({ category: e.target.value })}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
        <select aria-label="Sort" className={`${inputCls} h-11 w-28`} value={sort} onChange={(e) => change({ sort: e.target.value })}>
          <option value="newest">Newest</option><option value="priority">Priority</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-muted">Per page
          <select aria-label="Reports per page" className={`${inputCls} h-11 w-16`} value={pageSize} onChange={(e) => change({ size: e.target.value })}>
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>
      {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
      {list.loading && !data && <div className="report-cards">{Array.from({ length: pageSize }, (_, i) => <Skeleton key={i} className="report-card h-28" />)}</div>}
      {data?.items.length === 0 && <Empty title="No matching reports." action={<Button variant="primary" onClick={() => change({ buat: '1' }, false)}>Report</Button>} />}
      <div className="report-cards">{data?.items.map((r) => <ReportRow key={r.code} report={r} search={search} />)}</div>
      <div className="reports-pagination glass-strong rounded-2xl px-3 py-2">
        <Pagination page={page} pageSize={pageSize} total={data?.total ?? 0} loading={list.loading || (!data && !list.error)} onChange={(p) => change({ page: String(p) }, false)} />
      </div>
      <Sheet open={creating} onClose={closeForm} title="Report damage">
        <ReportForm onDone={(r) => { list.reload(); nav(`/laporan/${r.code}${search}`, { replace: true }) }} />
      </Sheet>
      <Sheet open={!!code} onClose={() => nav(`/laporan${search}`)} title={code ?? ''} wide>
        {code && <ReportDetailView code={code} />}
      </Sheet>
    </div>
  )
}

export function ReportRow({ report: r, search = '' }: { report: Report; search?: string }) {
  return (
    <Link to={`/laporan/${r.code}${search}`}
      className="report-card group flex min-w-0 gap-3 rounded-2xl border border-line bg-ink-900/60 p-3 transition hover:border-line-strong hover:bg-ink-800">
      <img src={r.photo_url} alt="" loading="lazy" className="size-16 flex-none rounded-xl object-cover" />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="grid gap-1.5">
          <p className="truncate font-semibold" title={r.segment ? roadName(r.segment.name) : 'Outside the road network'}>{r.segment ? roadName(r.segment.name) : 'Outside the road network'}</p>
          <span className="w-fit"><StatusBadge status={r.status} /></span>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-muted">
          {CATEGORY_LABEL[r.category]}{r.ai ? `, ${SEVERITY_LABEL[r.ai.severity].toLowerCase()} damage` : ''}
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
      <img src={d.photo_url} alt="Report photo" className="max-h-72 w-full rounded-xl object-cover" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{d.segment ? roadName(d.segment.name) : 'Outside the road network'}</p>
          <p className="text-[13px] text-muted">{CATEGORY_LABEL[d.category]} · {formatDate(d.created_at)}</p>
        </div>
        <StatusBadge status={d.status} />
      </div>
      <Panel className="px-3 py-3"><StageTracker status={d.status} reached={reachedStages(d.timeline)} /></Panel>
      <dl className="grid grid-cols-3 gap-3 text-sm">
        <Fact label="Priority" value={d.priority_score?.toFixed(0) ?? '-'} />
        <Fact label="Road impact" value={d.impact_score?.toFixed(0) ?? '-'} />
        <Fact label="Damage" value={d.ai ? SEVERITY_LABEL[d.ai.severity] : '-'} />
      </dl>
      {d.assigned_to && <p className="text-sm text-muted">Handled by <span className="font-semibold text-fg">{d.assigned_to}</span></p>}
      {d.description && <p className="text-sm">{d.description}</p>}
      <ol className="grid gap-2 border-l border-line pl-4">
        {d.timeline.map((e, i) => (
          <li key={i} className="text-sm">
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={e.to_status} /><span className="num text-xs text-muted">{formatDate(e.created_at)}</span></div>
            {e.note && <p className="mt-1 text-[13px] text-muted">{e.note}</p>}
          </li>
        ))}
      </ol>
      <ButtonLink to={`/peta?r=${d.code}`} className="w-full" icon={<MapPin size={18} />}>View on map</ButtonLink>
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
  const mapRef = useRef<MapRef>(null)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  // Follow GPS fixes; a manual pin keeps the camera where the user put it.
  useEffect(() => {
    if (pos && !manual) mapRef.current?.flyTo({ center: pos, zoom: 16.5, duration: 1200 })
  }, [pos, manual])

  const locate = () => {
    setGpsError(null)
    if (!navigator.geolocation) return setGpsError('GPS unavailable. Tap the map.')
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos([p.coords.longitude, p.coords.latitude]); setAccuracy(Math.round(p.coords.accuracy)); setManual(false) },
      () => setGpsError('GPS unavailable. Tap the map.'),
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
      setError(e instanceof ApiError ? e.message : 'Could not send. Check your connection.')
    } finally {
      setSending(false)
    }
  }

  const center = region.center
  return (
    <div className="grid gap-5">
      <Field label="Photo">
        <span className="relative grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-line-strong bg-ink-900/60">
          {preview ? <img src={preview} alt="Preview" className="absolute inset-0 size-full object-cover" />
            : <span className="flex flex-col items-center gap-2 text-sm text-muted"><Camera size={28} />Take a photo</span>}
          <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0" onChange={(e) => onFile(e.target.files?.[0])} />
        </span>
      </Field>
      {aiState !== 'idle' && (
        <div className="rounded-xl border border-line bg-ink-900/60 px-3 py-2 text-sm" aria-live="polite">
          {aiState === 'running' && <span className="text-muted">AI is checking the photo…</span>}
          {aiState === 'off' && <span className="text-muted">AI unavailable. Pick a category.</span>}
          {aiState === 'done' && ai && (ai.is_infrastructure
            ? <span>AI: <b>{CATEGORY_LABEL[ai.category]}</b>, {SEVERITY_LABEL[ai.severity].toLowerCase()} damage{ai.damage_type ? ` (${DAMAGE_LABEL[ai.damage_type] ?? ai.damage_type})` : ''}</span>
            : <span className="text-st-rejected">AI: this photo may not show infrastructure.</span>)}
        </div>
      )}

      <Field label="Location" hint={pos ? (manual ? 'Picked on the map' : `GPS ±${accuracy ?? '?'} m`) : 'Finding location…'} error={gpsError}>
        <div className="h-56 overflow-hidden rounded-xl">
          <MapCanvas mapRef={mapRef} controls={false}
            initialViewState={{ longitude: center[0], latitude: center[1], zoom: 11.5, pitch: 0 }}
            onMoveEnd={(bbox, zoom) => setView({ bbox, zoom })}
            onClick={(e) => { setPos([e.lngLat.lng, e.lngLat.lat]); setManual(true) }}>
            {segments && <SegmentsLayer data={segments} />}
            {pos && <Marker longitude={pos[0]} latitude={pos[1]}><span className="block size-4 rounded-full border-2 border-white bg-coral shadow" /></Marker>}
          </MapCanvas>
        </div>
        <Button type="button" size="sm" variant="ghost" icon={<Crosshair size={16} />} onClick={locate} className="justify-self-start">Use GPS</Button>
      </Field>

      <Field label="Category">
        <select className={`${inputCls} h-11`} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          <option value="" disabled>Choose a category</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}{ai?.is_infrastructure && ai.category === c ? ' (AI)' : ''}</option>)}
        </select>
      </Field>
      <Field label="Note (optional)">
        <textarea className={`${inputCls} py-2`} rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {error && <ErrorNote message={error} />}
      <Button variant="primary" disabled={!photo || !pos || !category || sending || aiState === 'running'} onClick={submit}>
        {sending ? 'Sending…' : 'Send report'}
      </Button>
    </div>
  )
}
