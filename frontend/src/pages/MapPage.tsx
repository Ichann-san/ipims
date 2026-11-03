import { useEffect, useMemo, useRef, useState } from 'react'
import { Popup, type MapMouseEvent, type MapRef } from 'react-map-gl/mapbox'
import { Link, useSearchParams } from 'react-router-dom'
import { api, type Report, type SegmentProps } from '../api'
import { useAsync } from '../hooks'
import { CATEGORY_LABEL, roadName } from '../labels'
import { MapCanvas } from '../map/MapCanvas'
import { FacilitiesLayer, IMPACT_RAMP, ReportsLayer, SegmentsLayer, useFacilities, useSegments } from '../map/layers'
import { useRegion } from '../region'
import { Chip, Panel, StatusBadge } from '../ui/core'

type Pick = { kind: 'report'; report: Report } | { kind: 'segment'; seg: SegmentProps; lng: number; lat: number } | null

export default function MapPage() {
  const region = useRegion()
  const [params] = useSearchParams()
  const focus = params.get('r')
  const mapRef = useRef<MapRef>(null)
  const [layers, setLayers] = useState({ reports: true, impact: true, facilities: false })
  const [view, setView] = useState<{ bbox: string; zoom: number } | null>(null)
  const [pick, setPick] = useState<Pick>(null)
  const reports = useAsync(() => api.listReports({ limit: 100 }), [])
  const segments = useSegments(view, layers.impact)
  const facilities = useFacilities(view, layers.facilities)
  const byCode = useMemo(() => new Map((reports.data?.items ?? []).map((r) => [r.code, r])), [reports.data])

  useEffect(() => {
    const r = focus ? byCode.get(focus) : undefined
    if (!r) return
    mapRef.current?.flyTo({ center: [r.lng, r.lat], zoom: 16.5, pitch: 55, duration: 2200 })
    setPick({ kind: 'report', report: r })
  }, [focus, byCode])

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
    <div className="relative h-[100dvh]">
      <MapCanvas mapRef={mapRef} onClick={onClick} onMoveEnd={(bbox, zoom) => setView({ bbox, zoom })}
        interactiveLayerIds={[layers.reports ? 'reports' : '', layers.impact && segments ? 'segments' : ''].filter(Boolean)}
        initialViewState={{ longitude: region.center[0], latitude: region.center[1], zoom: 12.6, pitch: 50, bearing: -12 }}>
        {segments && <SegmentsLayer data={segments} />}
        {facilities && <FacilitiesLayer data={facilities} />}
        {layers.reports && <ReportsLayer reports={reports.data?.items ?? []} selected={pick?.kind === 'report' ? pick.report.code : null} />}
        {pick?.kind === 'report' && (
          <Popup longitude={pick.report.lng} latitude={pick.report.lat} offset={14} closeButton={false} onClose={() => setPick(null)} maxWidth="300px">
            <Panel strong className="w-72 overflow-hidden text-fg">
              <img src={pick.report.photo_url} alt="" className="h-32 w-full object-cover" />
              <div className="grid gap-1 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{CATEGORY_LABEL[pick.report.category]}</p>
                  <StatusBadge status={pick.report.status} />
                </div>
                <p className="truncate text-[13px] text-muted">{pick.report.segment ? roadName(pick.report.segment.name) : 'Di luar jaringan jalan'}</p>
                <Link to={`/laporan/${pick.report.code}`} className="mt-1 text-[13px] font-semibold text-cyan">Lihat detail</Link>
              </div>
            </Panel>
          </Popup>
        )}
        {pick?.kind === 'segment' && (
          <Popup longitude={pick.lng} latitude={pick.lat} offset={10} closeButton={false} onClose={() => setPick(null)}>
            <Panel strong className="grid w-60 gap-1 p-3 text-fg">
              <p className="truncate font-semibold">{roadName(pick.seg.name)}</p>
              <p className="text-[13px] text-muted">{pick.seg.highway}</p>
              <p className="num text-sm">Dampak <b>{Number(pick.seg.impact_score).toFixed(0)}</b> · {pick.seg.active_reports} laporan aktif</p>
            </Panel>
          </Popup>
        )}
      </MapCanvas>

      <Panel className="absolute bottom-3 left-3 grid gap-3 p-3 md:bottom-6 md:left-6">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={layers.reports} onClick={() => toggle('reports')}>Laporan</Chip>
          <Chip active={layers.impact} onClick={() => toggle('impact')}>Dampak jalan</Chip>
          <Chip active={layers.facilities} onClick={() => toggle('facilities')}>Fasilitas</Chip>
        </div>
        {layers.impact && (
          <div className="grid gap-1">
            <div className="h-1.5 w-52 rounded-full" style={{ background: `linear-gradient(90deg, ${IMPACT_RAMP.map(([, c]) => c).join(',')})` }} />
            <div className="flex w-52 justify-between text-[11px] text-muted"><span>Dampak rendah</span><span>Kritis</span></div>
            {view && view.zoom < 13 && <p className="text-[11px] text-muted">Perbesar untuk melihat ruas jalan</p>}
          </div>
        )}
      </Panel>
    </div>
  )
}
