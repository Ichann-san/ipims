import { ArrowCounterClockwise, Lightning } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Source, type MapMouseEvent, type MapRef } from 'react-map-gl/mapbox'
import { Link } from 'react-router-dom'
import { api, type FeatureCollection, type Report, type SegmentProps, type WhatIfResult } from '../../api'
import { useAsync } from '../../hooks'
import { CATEGORY_LABEL, FACILITY_LABEL, formatIdr, roadName } from '../../labels'
import { MapCanvas } from '../../map/MapCanvas'
import { ReportsLayer, SegmentsLayer, useSegments } from '../../map/layers'
import { useRegion } from '../../region'
import { Button, ErrorNote, Panel, StatusBadge } from '../../ui/core'

type Mode = 'antrian' | 'simulasi'
type Side = 'sebelum' | 'sesudah'

export default function Operations() {
  const region = useRegion()
  const mapRef = useRef<MapRef>(null)
  const [mode, setMode] = useState<Mode>('antrian')
  const [side, setSide] = useState<Side>('sesudah')
  const [view, setView] = useState<{ bbox: string; zoom: number } | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [repairs, setRepairs] = useState<string[]>([])
  const [result, setResult] = useState<WhatIfResult | null>(null)
  const [running, setRunning] = useState(false)
  const [simError, setSimError] = useState<string | null>(null)

  const queue = useAsync(() => api.queue(), [])
  const damaged = useAsync<FeatureCollection<SegmentProps>>(() => api.activeSegments(), [])
  const segments = useSegments(view, mode === 'antrian')
  const reports = queue.data?.items ?? []
  const byCode = useMemo(() => new Map(reports.map((r) => [r.code, r])), [reports])
  const damagedIds = useMemo(() => new Set((damaged.data?.features ?? []).map((f) => f.properties.id)), [damaged.data])

  // Live what-if: re-run shortly after the repair set changes.
  useEffect(() => {
    if (mode !== 'simulasi' || repairs.length === 0) {
      setResult(null)
      return
    }
    let live = true
    setRunning(true)
    const t = setTimeout(() => {
      api.whatif(repairs)
        .then((r) => live && (setResult(r), setSimError(null)))
        .catch((e: Error) => live && setSimError(e.message))
        .finally(() => live && setRunning(false))
    }, 250)
    return () => { live = false; clearTimeout(t) }
  }, [repairs, mode])

  const toggleRepair = (id: string) => {
    if (!damagedIds.has(id)) return
    setRepairs((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]))
  }

  const onClick = (e: MapMouseEvent) => {
    const f = e.features?.[0]
    if (!f) return
    if (mode === 'simulasi') {
      const id = f.layer?.id === 'reports' ? byCode.get(f.properties?.code)?.segment?.id : f.properties?.id
      if (id) toggleRepair(id)
      return
    }
    if (f.layer?.id === 'reports') focus(byCode.get(f.properties?.code))
  }

  const focus = (r?: Report) => {
    if (!r) return
    setSelected(r.code)
    mapRef.current?.flyTo({ center: [r.lng, r.lat], zoom: 16, pitch: 55, duration: 1600 })
  }

  async function recommend() {
    const rec = await api.recommend()
    setRepairs(rec.order.slice(0, 3).map((o) => o.segment_id))
  }

  const nodeData = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: (result?.node_changes ?? []).map((n) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [n.lng, n.lat] },
      properties: { gain: n.minutes_gained, weight: n.minutes_gained * Math.max(n.population, 1) },
    })),
  }), [result])

  const showAfter = mode === 'simulasi' && side === 'sesudah' && result
  const sel = selected ? byCode.get(selected) : undefined
  return (
    <div className="relative h-[100dvh]">
      <MapCanvas mapRef={mapRef} onClick={onClick} onMoveEnd={(bbox, zoom) => setView({ bbox, zoom })}
        interactiveLayerIds={mode === 'simulasi' ? ['damaged', 'reports'] : ['reports', ...(segments ? ['segments'] : [])]}
        initialViewState={{ longitude: region.center[0], latitude: region.center[1], zoom: 12.3, pitch: 45, bearing: -10 }}>
        {mode === 'antrian' && segments && <SegmentsLayer data={segments} />}
        {damaged.data && (
          <Source id="damaged" type="geojson" data={damaged.data as unknown as GeoJSON.FeatureCollection}>
            <Layer id="damaged" type="line" slot="middle" layout={{ 'line-cap': 'round' }}
              paint={{
                'line-color': ['case', ['in', ['get', 'id'], ['literal', showAfter ? repairs : []]], '#5bb6e6', '#f08a64'] as unknown as string,
                'line-width': ['interpolate', ['linear'], ['zoom'], 11, 4, 16, 10] as unknown as number,
                'line-opacity': mode === 'simulasi' ? 0.95 : 0.7,
              }} />
          </Source>
        )}
        {showAfter && (
          <Source id="gain" type="geojson" data={nodeData}>
            <Layer id="gain" type="circle" slot="top"
              paint={{
                'circle-radius': ['interpolate', ['linear'], ['get', 'gain'], 0, 2, 2, 6, 8, 12] as unknown as number,
                'circle-color': '#5bb6e6',
                'circle-opacity': ['interpolate', ['linear'], ['get', 'gain'], 0, 0.25, 3, 0.75] as unknown as number,
                'circle-blur': 0.4,
              }} />
          </Source>
        )}
        <ReportsLayer reports={reports} selected={selected} />
      </MapCanvas>

      <Panel strong className="absolute inset-x-3 bottom-3 flex max-h-[46dvh] flex-col md:inset-x-auto md:bottom-6 md:left-6 md:top-20 md:max-h-none md:w-[22rem]">
        <div className="grid grid-cols-2 gap-1 border-b border-line p-1.5" role="tablist">
          {(['antrian', 'simulasi'] as Mode[]).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
              className={`h-10 rounded-xl text-[13px] font-semibold ${mode === m ? 'bg-white/[0.09] text-fg' : 'text-muted hover:text-fg'}`}>
              {m === 'antrian' ? 'Antrian' : 'Simulasi'}
            </button>
          ))}
        </div>

        {mode === 'antrian' && (
          <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {queue.error && <ErrorNote message={queue.error} onRetry={queue.reload} />}
            {reports.map((r) => (
              <li key={r.code}>
                <button onClick={() => focus(r)}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${selected === r.code ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}`}>
                  <span className="num w-8 text-base font-bold">{r.priority_score?.toFixed(0) ?? '-'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.segment ? roadName(r.segment.name) : 'Tidak terhubung'}</span>
                    <span className="block text-xs text-muted">{CATEGORY_LABEL[r.category]}</span>
                  </span>
                  <StatusBadge status={r.status} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {mode === 'simulasi' && (
          <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-3">
            <p className="text-[13px] text-muted">Klik ruas oranye untuk memperbaikinya.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="blue" icon={<Lightning size={16} />} onClick={recommend}>3 rekomendasi</Button>
              <Button size="sm" variant="ghost" icon={<ArrowCounterClockwise size={16} />} onClick={() => setRepairs([])} disabled={!repairs.length}>Reset</Button>
            </div>
            <p className="num text-sm"><b>{repairs.length}</b> dari {damagedIds.size} ruas rusak diperbaiki</p>
            {simError && <ErrorNote message={simError} />}
            {repairs.length > 0 && (
              <div className={`grid gap-3 transition-opacity ${running ? 'opacity-50' : ''}`}>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink-900 p-1">
                  {(['sebelum', 'sesudah'] as Side[]).map((s) => (
                    <button key={s} onClick={() => setSide(s)} aria-pressed={side === s}
                      className={`h-9 rounded-lg text-[13px] font-semibold ${side === s ? 'bg-white/[0.09] text-fg' : 'text-muted'}`}>
                      {s === 'sebelum' ? 'Sebelum' : 'Sesudah'}
                    </button>
                  ))}
                </div>
                {result && (
                  <>
                    <div>
                      <p className="num text-3xl font-extrabold text-cyan">{result.improvement_pct.toFixed(1)}%</p>
                      <p className="text-xs text-muted">akses yang pulih</p>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(result.by_facility).map(([k, v]) => (
                        <div key={k} className="rounded-xl border border-line px-3 py-2">
                          <dt className="text-xs text-muted">{FACILITY_LABEL[k] ?? k}</dt>
                          <dd className="num font-semibold">{(side === 'sebelum' ? v.before : v.after).toFixed(2)} mnt</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="num text-sm text-muted">±{formatIdr(result.cost_estimate_idr)} · {result.duration_days} hari kerja</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Panel>

      {mode === 'antrian' && sel && (
        <Panel strong className="absolute right-3 top-20 hidden w-80 overflow-hidden md:block md:right-6">
          <img src={sel.photo_url} alt="" className="h-36 w-full object-cover" />
          <div className="grid gap-2 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-semibold">{sel.segment ? roadName(sel.segment.name) : 'Tidak terhubung'}</p>
              <StatusBadge status={sel.status} />
            </div>
            <p className="num text-sm text-muted">Prioritas {sel.priority_score?.toFixed(1)} · dampak {sel.impact_score?.toFixed(0) ?? '-'}</p>
            <Link to={`/admin/laporan/${sel.code}`}><Button size="sm" className="w-full">Tindak lanjut</Button></Link>
          </div>
        </Panel>
      )}
    </div>
  )
}
