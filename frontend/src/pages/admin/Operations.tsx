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

type Mode = 'queue' | 'simulate'
type Side = 'before' | 'after'

export default function Operations() {
  const region = useRegion()
  const mapRef = useRef<MapRef>(null)
  const [mode, setMode] = useState<Mode>('queue')
  const [side, setSide] = useState<Side>('after')
  const [view, setView] = useState<{ bbox: string; zoom: number } | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [repairs, setRepairs] = useState<string[]>([])
  const [result, setResult] = useState<WhatIfResult | null>(null)
  const [running, setRunning] = useState(false)
  const [simError, setSimError] = useState<string | null>(null)

  const queue = useAsync(() => api.queue(), [])
  const damaged = useAsync<FeatureCollection<SegmentProps>>(() => api.activeSegments(), [])
  const segments = useSegments(view, mode === 'queue')
  const reports = queue.data?.items ?? []
  const byCode = useMemo(() => new Map(reports.map((r) => [r.code, r])), [reports])
  const damagedIds = useMemo(() => new Set((damaged.data?.features ?? []).map((f) => f.properties.id)), [damaged.data])

  // Live what-if: re-run shortly after the repair set changes.
  useEffect(() => {
    if (mode !== 'simulate' || repairs.length === 0) {
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
    if (mode === 'simulate') {
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
    const ids = rec.order.slice(0, 3).map((o) => o.segment_id)
    setRepairs(ids)
    frame(ids)
  }

  // Bring the chosen repairs into view.
  const frame = (ids: string[]) => {
    const coords = (damaged.data?.features ?? [])
      .filter((f) => ids.includes(f.properties.id))
      .flatMap((f) => (f.geometry as GeoJSON.LineString).coordinates)
    if (!coords.length) return
    const lngs = coords.map((c) => c[0])
    const lats = coords.map((c) => c[1])
    mapRef.current?.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: { top: 120, bottom: 80, left: 420, right: 80 }, maxZoom: 15.5, duration: 1600 })
  }

  const nodeData = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: (result?.node_changes ?? []).map((n) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [n.lng, n.lat] },
      properties: { gain: n.minutes_gained, weight: n.minutes_gained * Math.max(n.population, 1) },
    })),
  }), [result])

  const showAfter = mode === 'simulate' && side === 'after' && result
  const sel = selected ? byCode.get(selected) : undefined
  return (
    <div className="relative h-[100dvh]">
      <MapCanvas mapRef={mapRef} onClick={onClick} onMoveEnd={(bbox, zoom) => setView({ bbox, zoom })}
        interactiveLayerIds={mode === 'simulate' ? ['damaged', 'damaged-glow', 'reports'] : ['reports', ...(segments ? ['segments'] : [])]}
        initialViewState={{ longitude: region.center[0], latitude: region.center[1], zoom: 12.3, pitch: 45, bearing: -10 }}>
        {mode === 'queue' && segments && <SegmentsLayer data={segments} />}
        {damaged.data && (
          <Source id="damaged" type="geojson" data={damaged.data as unknown as GeoJSON.FeatureCollection}>
            <Layer id="damaged-glow" type="line" slot="middle" layout={{ 'line-cap': 'round' }}
              paint={{
                'line-color': ['case', ['in', ['get', 'id'], ['literal', showAfter ? repairs : []]], '#5bb6e6', '#f08a64'] as unknown as string,
                'line-width': ['interpolate', ['linear'], ['zoom'], 11, 16, 16, 28] as unknown as number,
                'line-blur': 8,
                'line-opacity': mode === 'simulate' ? 0.45 : 0.25,
                'line-emissive-strength': 1,
              }} />
            <Layer id="damaged" type="line" slot="middle" layout={{ 'line-cap': 'round' }}
              paint={{
                'line-color': ['case', ['in', ['get', 'id'], ['literal', showAfter ? repairs : []]], '#5bb6e6', '#f08a64'] as unknown as string,
                'line-width': ['interpolate', ['linear'], ['zoom'], 11, 5, 16, 10] as unknown as number,
                'line-opacity': mode === 'simulate' ? 0.95 : 0.7,
                'line-emissive-strength': 1,
              }} />
          </Source>
        )}
        {showAfter && (
          <Source id="gain" type="geojson" data={nodeData}>
            <Layer id="gain" type="heatmap" slot="middle"
              paint={{
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 20, 1] as unknown as number,
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 12, 15, 40] as unknown as number,
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 2] as unknown as number,
                'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
                  0, 'rgba(91,182,230,0)', 0.3, 'rgba(91,182,230,0.35)', 0.7, 'rgba(91,182,230,0.7)', 1, 'rgba(214,240,255,0.9)'] as unknown as string,
                'heatmap-opacity': 0.85,
              }} />
          </Source>
        )}
        <ReportsLayer reports={reports} selected={selected} />
      </MapCanvas>

      <Panel strong className="absolute inset-x-3 bottom-3 flex max-h-[46dvh] flex-col md:inset-x-auto md:bottom-6 md:left-6 md:top-24 md:max-h-none md:w-[22rem]">
        <div className="grid grid-cols-2 gap-1 border-b border-line p-1.5" role="tablist">
          {(['queue', 'simulate'] as Mode[]).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
              className={`h-10 rounded-xl text-[13px] font-semibold ${mode === m ? 'bg-white/[0.09] text-fg' : 'text-muted hover:text-fg'}`}>
              {m === 'queue' ? 'Queue' : 'Simulate'}
            </button>
          ))}
        </div>

        {mode === 'queue' && (
          <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {queue.error && <ErrorNote message={queue.error} onRetry={queue.reload} />}
            {reports.map((r) => (
              <li key={r.code}>
                <button onClick={() => focus(r)}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${selected === r.code ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}`}>
                  <span className="num w-8 text-base font-bold">{r.priority_score?.toFixed(0) ?? '-'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.segment ? roadName(r.segment.name) : 'Not on a road'}</span>
                    <span className="block text-xs text-muted">{CATEGORY_LABEL[r.category]}</span>
                  </span>
                  <StatusBadge status={r.status} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {mode === 'simulate' && (
          <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-3">
            <p className="text-[13px] text-muted">Click an orange road to repair it.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="blue" icon={<Lightning size={16} />} onClick={recommend}>Top 3 repairs</Button>
              <Button size="sm" variant="ghost" icon={<ArrowCounterClockwise size={16} />} onClick={() => setRepairs([])} disabled={!repairs.length}>Reset</Button>
            </div>
            <p className="num text-sm"><b>{repairs.length}</b> of {damagedIds.size} damaged roads repaired</p>
            {simError && <ErrorNote message={simError} />}
            {repairs.length > 0 && (
              <div className={`grid gap-3 transition-opacity ${running ? 'opacity-50' : ''}`}>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink-900 p-1">
                  {(['before', 'after'] as Side[]).map((s) => (
                    <button key={s} onClick={() => setSide(s)} aria-pressed={side === s}
                      className={`h-9 rounded-lg text-[13px] font-semibold ${side === s ? 'bg-white/[0.09] text-fg' : 'text-muted'}`}>
                      {s === 'before' ? 'Before' : 'After'}
                    </button>
                  ))}
                </div>
                {result && (
                  <>
                    <div>
                      <p className="num text-3xl font-extrabold text-cyan">{result.improvement_pct.toFixed(1)}%</p>
                      <p className="text-xs text-muted">access restored</p>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(result.by_facility).map(([k, v]) => (
                        <div key={k} className="rounded-xl border border-line px-3 py-2">
                          <dt className="text-xs text-muted">{FACILITY_LABEL[k] ?? k}</dt>
                          <dd className="num font-semibold">{(side === 'before' ? v.before : v.after).toFixed(2)} min</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="num text-sm text-muted">±{formatIdr(result.cost_estimate_idr)} · {result.duration_days} work days</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Panel>

      {mode === 'queue' && sel && (
        <Panel strong className="absolute right-3 top-24 hidden w-80 overflow-hidden md:block md:right-6">
          <img src={sel.photo_url} alt="" className="h-36 w-full object-cover" />
          <div className="grid gap-2 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-semibold">{sel.segment ? roadName(sel.segment.name) : 'Not on a road'}</p>
              <StatusBadge status={sel.status} />
            </div>
            <p className="num text-sm text-muted">Priority {sel.priority_score?.toFixed(1)} · impact {sel.impact_score?.toFixed(0) ?? '-'}</p>
            <Link to={`/admin/laporan/${sel.code}`}><Button size="sm" className="w-full">Follow up</Button></Link>
          </div>
        </Panel>
      )}
    </div>
  )
}
