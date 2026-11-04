import { ArrowCounterClockwise, Lightning } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Source, type MapMouseEvent, type MapRef } from 'react-map-gl/mapbox'
import { api, type FeatureCollection, type Report, type SegmentProps, type WhatIfResult } from '../../api'
import { useAsync } from '../../hooks'
import { FACILITY_LABEL, METRIC_LABEL, ROAD_ANALYTICS_NOTE, formatIdr, formatScore } from '../../labels'
import { MapCanvas } from '../../map/MapCanvas'
import { ReportsLayer, SegmentsLayer, useSegmentData } from '../../map/layers'
import { cameraPadding, useMapPanel } from '../../map/layout'
import { ReportIdentity } from '../../ui/ReportSummary'
import { useRegion } from '../../region'
import { Button, ButtonLink, Empty, ErrorNote, Panel, SegmentedControl, Skeleton, StatusBadge } from '../../ui/core'

type Mode = 'queue' | 'simulate'
type Side = 'before' | 'after'

export default function Operations() {
  const region = useRegion()
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  useMapPanel(panelRef)
  const [mode, setMode] = useState<Mode>('queue')
  const [side, setSide] = useState<Side>('after')
  const [view, setView] = useState<{ bbox: string; zoom: number } | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [repairs, setRepairs] = useState<string[]>([])
  const [result, setResult] = useState<WhatIfResult | null>(null)
  const [running, setRunning] = useState(false)
  const [simError, setSimError] = useState<string | null>(null)
  const [recommendError, setRecommendError] = useState<string | null>(null)
  const [recommending, setRecommending] = useState(false)

  const queue = useAsync(() => api.queue(), [])
  const damaged = useAsync<FeatureCollection<SegmentProps>>(() => api.activeSegments(), [])
  const segments = useSegmentData(view, mode === 'queue')
  const reports = queue.data?.items ?? []
  const byCode = useMemo(() => new Map(reports.map((r) => [r.code, r])), [reports])
  const damagedIds = useMemo(() => new Set((damaged.data?.features ?? []).map((f) => f.properties.id)), [damaged.data])

  // Live what-if: re-run shortly after the repair set changes.
  useEffect(() => {
    if (mode !== 'simulate' || repairs.length === 0) {
      setResult(null)
      setRunning(false)
      setSimError(null)
      return
    }
    let live = true
    setRunning(true)
    setResult(null)
    setSimError(null)
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
    mapRef.current?.flyTo({ center: [r.lng, r.lat], zoom: 16, duration: 700 })
  }

  async function recommend() {
    setRecommending(true)
    setRecommendError(null)
    try {
      const rec = await api.recommend()
      const ids = rec.order.slice(0, 3).map((o) => o.segment_id)
      setRepairs(ids)
      if (!ids.length) setRecommendError('No road repairs are available to recommend.')
      frame(ids)
    } catch (e) {
      setRecommendError(e instanceof Error ? e.message : 'Could not recommend repairs.')
    } finally {
      setRecommending(false)
    }
  }

  // Bring the chosen repairs into view.
  const frame = (ids: string[]) => {
    const coords = (damaged.data?.features ?? [])
      .filter((f) => ids.includes(f.properties.id))
      .flatMap((f) => (f.geometry as GeoJSON.LineString).coordinates)
    if (!coords.length || !containerRef.current) return
    const lngs = coords.map((c) => c[0])
    const lats = coords.map((c) => c[1])
    mapRef.current?.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: cameraPadding(containerRef.current, panelRef.current), maxZoom: 15.5, duration: 1600 })
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
    <div ref={containerRef} className="operations-map relative h-[100dvh] overflow-hidden">
      <MapCanvas constrainToRegion mapRef={mapRef} onClick={onClick} onMoveEnd={(bbox, zoom) => setView({ bbox, zoom })}
        interactiveLayerIds={mode === 'simulate' ? ['damaged', 'damaged-glow', 'reports'] : ['reports', ...(segments.data ? ['segments'] : [])]}
        initialViewState={{ longitude: region.center[0], latitude: region.center[1], zoom: 12.3, pitch: 25, bearing: -10 }}>
        {mode === 'queue' && segments.data && <SegmentsLayer data={segments.data} />}
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

      <div ref={panelRef} className="operations-panel absolute inset-x-3 flex max-h-[46dvh] flex-col md:inset-x-auto md:left-6 md:max-h-none md:w-[22rem]">
      <Panel strong className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-line p-1.5">
          <SegmentedControl<Mode> label="Operations view" value={mode} onChange={setMode}
            options={[{ value: 'queue', label: 'Queue' }, { value: 'simulate', label: 'Simulate' }]} className="flex" />
        </div>
        <div className="grid shrink-0 gap-2 px-3 pt-2">
          {damaged.error && <ErrorNote compact title="Road scenario unavailable." message={damaged.error} onRetry={damaged.reload} />}
          {mode === 'queue' && segments.error && <ErrorNote compact title="Nearby roads unavailable." message={segments.error} onRetry={segments.reload} />}
        </div>

        {mode === 'queue' && (
          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            <p className="px-2.5 py-2 type-meta text-muted">{queue.data ? `Showing ${reports.length} of ${queue.data.total} queued reports (up to 200 loaded).` : queue.loading ? 'Loading report queue...' : 'Queue count unavailable.'} {ROAD_ANALYTICS_NOTE}</p>
            {queue.error && <ErrorNote compact message={queue.error} onRetry={queue.reload} />}
            {queue.loading && !queue.data && <div className="grid gap-2 p-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>}
            {queue.data && reports.length === 0 && <Empty title="No reports in the queue." />}
            {segments.loading && <p role="status" className="px-2.5 type-meta text-muted">Loading nearby roads...</p>}
            <ul>
            {reports.map((r) => (
              <li key={r.code}>
                <button onClick={() => focus(r)} aria-pressed={selected === r.code}
                  className={`grid w-full gap-2 rounded-xl px-2.5 py-2 text-left transition focus-visible:outline-2 focus-visible:outline-cyan ${selected === r.code ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}`}>
                  <ReportIdentity report={r} compact />
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="num type-meta text-muted">{METRIC_LABEL.roadPriority}: {formatScore(r.priority_score)}</span>
                    <StatusBadge status={r.status} />
                  </span>
                </button>
              </li>
            ))}
            </ul>
          </div>
        )}

        {mode === 'simulate' && (
          <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-3">
            <p className="type-label text-muted">Select an orange road segment for this repair scenario.</p>
            <p className="type-meta text-muted">Road-network accessibility pilot only. Active reports of any category currently contribute to road disruption in this model; these results do not validate disruption or repair outcomes for non-road assets.</p>
            {damaged.loading && !damaged.data && <p role="status" className="type-meta text-muted">Loading road scenarios...</p>}
            {damaged.data && damagedIds.size === 0 && <Empty title="No road segments are available for a repair scenario." />}
            <div className="flex gap-2">
              <Button size="sm" variant="blue" icon={<Lightning size={16} />} onClick={recommend} disabled={recommending || damaged.loading || !!damaged.error}>{recommending ? 'Finding repairs...' : 'Top 3 repairs'}</Button>
              <Button size="sm" variant="ghost" icon={<ArrowCounterClockwise size={16} />} onClick={() => setRepairs([])} disabled={!repairs.length}>Reset</Button>
            </div>
            {damaged.data && <p className="num type-body"><b>{repairs.length}</b> of {damagedIds.size} road segments selected</p>}
            {recommendError && <ErrorNote compact title="Recommendation unavailable." message={recommendError} onRetry={recommend} />}
            {simError && <ErrorNote compact title="Could not run scenario." message={simError} />}
            {running && <p role="status" className="type-meta text-muted">Calculating scenario...</p>}
            {repairs.length > 0 && (
              <div className={`grid gap-3 transition-opacity ${running ? 'opacity-50' : ''}`}>
                <SegmentedControl<Side> label="Road scenario comparison" value={side} onChange={setSide}
                  options={[{ value: 'before', label: 'Before' }, { value: 'after', label: 'After' }]} />
                {result && (
                  <>
                    <div>
                      <p className="num text-3xl font-extrabold text-cyan">{formatScore(result.improvement_pct)}%</p>
                      <p className="type-meta text-muted">{METRIC_LABEL.modeledImprovement}</p>
                      <p className="mt-1 type-meta text-muted">Share of modeled excess travel time removed relative to the undamaged road-network baseline.</p>
                    </div>
                    <p className="type-meta text-muted">Modeled average travel time to accessibility destinations ({side})</p>
                    <dl className="grid grid-cols-2 gap-2 type-body">
                      {Object.entries(result.by_facility).map(([k, v]) => (
                        <div key={k} className="rounded-xl border border-line px-3 py-2">
                          <dt className="type-meta text-muted">{FACILITY_LABEL[k] ?? k}</dt>
                          <dd className="num font-semibold">{formatScore(side === 'before' ? v.before : v.after)} min</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="num type-meta text-muted">Approximate road-scenario cost: {formatIdr(result.cost_estimate_idr)}. Estimated duration: {result.duration_days} work days.</p>
                    {result.assumptions.length > 0 && <details className="type-meta text-muted">
                      <summary className="cursor-pointer">Road-scenario assumptions</summary>
                      <ul className="mt-2 list-disc space-y-1 pl-4">{result.assumptions.map((assumption, i) => <li key={i}>{assumption}</li>)}</ul>
                    </details>}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Panel>
      </div>

      {mode === 'queue' && sel && (
        <Panel strong className="operations-detail absolute right-3 hidden w-80 overflow-hidden md:block md:right-6">
          <img src={sel.photo_url} alt="" className="h-36 w-full object-cover" />
          <div className="grid gap-2 p-3">
            <div className="flex items-center justify-between gap-2">
              <ReportIdentity report={sel} compact />
              <StatusBadge status={sel.status} />
            </div>
            <p className="num type-meta text-muted">{METRIC_LABEL.roadPriority}: {formatScore(sel.priority_score)} · {METRIC_LABEL.roadImpact}: {formatScore(sel.impact_score)}</p>
            <ButtonLink to={`/admin/laporan/${sel.code}`} size="sm" className="w-full">Follow up</ButtonLink>
          </div>
        </Panel>
      )}
    </div>
  )
}
