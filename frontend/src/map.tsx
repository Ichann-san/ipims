import type { LatLngBounds, LeafletMouseEvent } from 'leaflet'
import { useEffect, useState } from 'react'
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { api, type FacilityProps, type FeatureCollection, type Report, type SegmentProps } from './api'
import { CATEGORY_LABEL, FACILITY_LABEL, STATUS_LABEL, roadName } from './labels'

export const PARE_CENTER: [number, number] = [-7.765, 112.195]

const STATUS_COLOR: Record<string, string> = {
  reported: '#64748b', ai_verified: '#0284c7', gov_approved: '#4f46e5', assigned: '#d97706',
  in_repair: '#ea580c', completed: '#059669', rejected: '#e11d48',
}
const FACILITY_COLOR: Record<string, string> = { health: '#dc2626', school: '#2563eb', market: '#ca8a04', government: '#7c3aed' }

export function impactColor(score: number) {
  if (score >= 90) return '#b91c1c'
  if (score >= 70) return '#ea580c'
  if (score >= 40) return '#eab308'
  if (score > 0) return '#84cc16'
  return '#cbd5e1'
}

function bboxOf(b: LatLngBounds) {
  return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((x) => x.toFixed(5)).join(',')
}

function BoundsWatcher({ onChange }: { onChange: (bbox: string, zoom: number) => void }) {
  const map = useMapEvents({ moveend: () => onChange(bboxOf(map.getBounds()), map.getZoom()) })
  useEffect(() => onChange(bboxOf(map.getBounds()), map.getZoom()), [map, onChange])
  return null
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e: LeafletMouseEvent) => onClick(e.latlng.lat, e.latlng.lng) })
  return null
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center)
  }, [map, center])
  return null
}

interface Props {
  className?: string
  center?: [number, number]
  zoom?: number
  reports?: Report[]
  reportLink?: (r: Report) => string
  showSegments?: boolean
  showFacilities?: boolean
  highlight?: Set<string>
  onSegmentClick?: (s: SegmentProps) => void
  onMapClick?: (lat: number, lng: number) => void
  pin?: [number, number] | null
}

export function InfraMap({
  className = 'h-96', center = PARE_CENTER, zoom = 14, reports = [], reportLink, showSegments = false,
  showFacilities = false, highlight, onSegmentClick, onMapClick, pin,
}: Props) {
  const [segments, setSegments] = useState<FeatureCollection<SegmentProps> | null>(null)
  const [facilities, setFacilities] = useState<FeatureCollection<FacilityProps> | null>(null)
  const [view, setView] = useState<{ bbox: string; zoom: number } | null>(null)

  useEffect(() => {
    if (!view) return
    if (showSegments && view.zoom >= 13) api.segments(view.bbox).then(setSegments).catch(() => setSegments(null))
    if (showFacilities && view.zoom >= 13) api.facilities(view.bbox).then(setFacilities).catch(() => setFacilities(null))
  }, [view, showSegments, showFacilities])

  return (
    <MapContainer center={center} zoom={zoom} className={`${className} w-full rounded-lg`} scrollWheelZoom>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <BoundsWatcher onChange={(bbox, z) => setView((v) => (v?.bbox === bbox ? v : { bbox, zoom: z }))} />
      {onMapClick && <ClickHandler onClick={onMapClick} />}
      {pin && <Recenter center={pin} />}
      {showSegments && segments && (
        <GeoJSON
          key={`${view?.bbox}-${highlight ? [...highlight].join() : ''}`}
          data={segments as unknown as GeoJSON.FeatureCollection}
          style={(f) => {
            const p = f?.properties as SegmentProps
            const hl = highlight?.has(p.id)
            return { color: hl ? '#0ea5e9' : impactColor(p.impact_score), weight: hl ? 7 : p.active_reports ? 5 : 3, opacity: 0.9 }
          }}
          onEachFeature={(f, layer) => {
            const p = f.properties as SegmentProps
            layer.bindTooltip(`${roadName(p.name)} · ${p.highway} · Impact ${p.impact_score.toFixed(0)}${p.active_reports ? ` · ${p.active_reports} laporan` : ''}`)
            if (onSegmentClick) layer.on('click', () => onSegmentClick(p))
          }}
        />
      )}
      {showFacilities && facilities?.features.map((f) => {
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates
        return (
          <CircleMarker key={f.properties.id} center={[lat, lng]} radius={5}
            pathOptions={{ color: FACILITY_COLOR[f.properties.kind], fillOpacity: 0.9 }}>
            <Popup>{FACILITY_LABEL[f.properties.kind]}: {f.properties.name ?? 'tanpa nama'}</Popup>
          </CircleMarker>
        )
      })}
      {reports.map((r) => (
        <CircleMarker key={r.code} center={[r.lat, r.lng]} radius={8}
          pathOptions={{ color: '#fff', weight: 2, fillColor: STATUS_COLOR[r.status], fillOpacity: 1 }}>
          <Popup>
            <strong>{CATEGORY_LABEL[r.category]}</strong> · {STATUS_LABEL[r.status]}<br />
            {r.segment ? roadName(r.segment.name) : ''}<br />
            {reportLink && <Link to={reportLink(r)}>Lihat {r.code}</Link>}
          </Popup>
        </CircleMarker>
      ))}
      {pin && <CircleMarker center={pin} radius={10} pathOptions={{ color: '#fff', weight: 3, fillColor: '#e11d48', fillOpacity: 1 }} />}
    </MapContainer>
  )
}

export function ImpactLegend() {
  const rows: [string, string][] = [['#b91c1c', '≥ 90'], ['#ea580c', '70–89'], ['#eab308', '40–69'], ['#84cc16', '1–39'], ['#cbd5e1', '0 (ada jalur alternatif)']]
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
      <span className="font-medium">Impact Score:</span>
      {rows.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1"><span className="inline-block h-1.5 w-5 rounded" style={{ background: c }} />{l}</span>
      ))}
    </div>
  )
}
