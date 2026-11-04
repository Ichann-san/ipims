import { useEffect, useMemo, useRef, useState } from 'react'
import { Popup, type MapMouseEvent, type MapRef } from 'react-map-gl/mapbox'
import { Link, useSearchParams } from 'react-router-dom'
import { api, type Report, type SegmentProps } from '../api'
import { useAsync } from '../hooks'
import { formatScore, roadName } from '../labels'
import { MapCanvas } from '../map/MapCanvas'
import { FacilitiesLayer, IMPACT_RAMP, ReportsLayer, SegmentsLayer, useFacilityData, useSegmentData } from '../map/layers'
import { useMapPanel } from '../map/layout'
import { useRegion } from '../region'
import { Chip, ErrorNote, Panel, StatusBadge } from '../ui/core'
import { ReportIdentity } from '../ui/ReportSummary'

type Pick = { kind: 'report'; report: Report } | { kind: 'segment'; seg: SegmentProps; lng: number; lat: number } | null

export default function MapPage() {
  const region = useRegion()
  const [params] = useSearchParams()
  const focus = params.get('r')
  const mapRef = useRef<MapRef>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  useMapPanel(panelRef)
  const [layers, setLayers] = useState({ reports: true, impact: true, facilities: false })
  const [view, setView] = useState<{ bbox: string; zoom: number } | null>(null)
  const [pick, setPick] = useState<Pick>(null)
  const reports = useAsync(() => api.listReports({ limit: 100 }), [])
  const segments = useSegmentData(view, layers.impact)
  const facilities = useFacilityData(view, layers.facilities)
  const focusedReport = useAsync(() => focus ? api.getReport(focus) : Promise.resolve(null), [focus])
  const byCode = useMemo(() => new Map((reports.data?.items ?? []).map((r) => [r.code, r])), [reports.data])

  useEffect(() => {
    const r = focus ? byCode.get(focus) ?? (focusedReport.data?.code === focus ? focusedReport.data : undefined) : undefined
    if (!r) return
    mapRef.current?.flyTo({ center: [r.lng, r.lat], zoom: 16.5, duration: 700 })
    setPick({ kind: 'report', report: r })
  }, [focus, byCode, focusedReport.data])

  const onClick = (e: MapMouseEvent) => {
    const f = e.features?.[0]
    if (!f) return setPick(null)
    if (f.layer?.id === 'reports') {
      const r = byCode.get(f.properties?.code)
      if (r) setPick({ kind: 'report', report: r })
    } else if (f.layer?.id === 'segments') {
      setPick({ kind: 'segment', seg: f.properties as SegmentProps, lng: e.lngLat.lng, lat: e.lngLat.lat })
    }
  }

  const toggle = (k: keyof typeof layers) => setLayers((l) => ({ ...l, [k]: !l[k] }))
  return (
    <div className="public-map relative h-[100dvh] overflow-hidden">
      <MapCanvas constrainToRegion overscan mapRef={mapRef} onClick={onClick} onMoveEnd={(bbox, zoom) => setView({ bbox, zoom })}
        interactiveLayerIds={[layers.reports ? 'reports' : '', layers.impact && segments.data ? 'segments' : ''].filter(Boolean)}
        initialViewState={{ longitude: region.center[0], latitude: region.center[1], zoom: 12.6, pitch: 25, bearing: -12 }}>
        {segments.data && <SegmentsLayer data={segments.data} />}
        {facilities.data && <FacilitiesLayer data={facilities.data} />}
        {layers.reports && <ReportsLayer reports={reports.data?.items ?? []} selected={pick?.kind === 'report' ? pick.report.code : null} />}
        {pick?.kind === 'report' && (
          <Popup longitude={pick.report.lng} latitude={pick.report.lat} offset={14} closeButton={false} onClose={() => setPick(null)} maxWidth="300px">
            <Panel strong className="w-72 overflow-hidden text-fg">
              <img src={pick.report.photo_url} alt="" className="h-32 w-full object-cover" />
              <div className="grid gap-1 p-3">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={pick.report.status} />
                </div>
                <ReportIdentity report={pick.report} compact />
                <Link to={`/laporan/${pick.report.code}`} className="mt-1 text-[13px] font-semibold text-cyan">View details</Link>
              </div>
            </Panel>
          </Popup>
        )}
        {pick?.kind === 'segment' && (
          <Popup longitude={pick.lng} latitude={pick.lat} offset={10} closeButton={false} onClose={() => setPick(null)}>
            <Panel strong className="grid w-60 gap-1 p-3 text-fg">
              <p className="truncate font-semibold">{roadName(pick.seg.name)}</p>
              <p className="text-[13px] text-muted">{pick.seg.highway}</p>
              <p className="num type-body">Road access impact <b>{formatScore(Number(pick.seg.impact_score))}</b> · {pick.seg.active_reports} nearby active reports</p>
            </Panel>
          </Popup>
        )}
      </MapCanvas>

      <div ref={panelRef} className="map-layer-panel absolute left-3 md:left-6">
      <Panel className="grid gap-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={layers.reports} onClick={() => toggle('reports')}>Reports</Chip>
          <Chip active={layers.impact} onClick={() => toggle('impact')}>Road impact</Chip>
          <Chip active={layers.facilities} onClick={() => toggle('facilities')}>Destinations</Chip>
        </div>
        {layers.impact && (
          <div className="grid gap-1">
            <div className="h-1.5 w-52 rounded-full" style={{ background: `linear-gradient(90deg, ${IMPACT_RAMP.map(([, c]) => c).join(',')})` }} />
            <div className="type-caption flex w-52 justify-between text-muted"><span>Low</span><span>High road impact</span></div>
            {view && view.zoom < 13 && <p className="text-[11px] text-muted">Zoom in to see road segments</p>}
          </div>
        )}
        <p className="type-caption text-muted" role="status">{reports.data ? `Latest ${reports.data.items.length} of ${reports.data.total} reports` : reports.error ? 'Report count unavailable' : 'Loading reports…'}</p>
        {reports.error && <ErrorNote compact message={reports.error} onRetry={reports.reload} />}
        {focusedReport.error && <ErrorNote compact title="Report unavailable." message={focusedReport.error} onRetry={focusedReport.reload} />}
        {segments.error && <ErrorNote compact title="Road layer unavailable." message="Try again." onRetry={segments.reload} />}
        {facilities.error && <ErrorNote compact title="Destinations unavailable." message="Try again." onRetry={facilities.reload} />}
        {(segments.loading || facilities.loading) && <p className="type-caption text-muted" role="status">Loading map layers…</p>}
      </Panel>
      </div>
    </div>
  )
}
