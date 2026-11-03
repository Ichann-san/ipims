import { useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { api, type FacilityProps, type FeatureCollection, type Report, type SegmentProps } from '../api'

// Impact Score ramp: dim navy-orange for low, bright orange for critical. Simulation change: cyan better, coral worse.
export const IMPACT_RAMP: [number, string][] = [[0, '#33405e'], [1, '#6b4a3a'], [40, '#a3582f'], [70, '#e0743a'], [90, '#ffb36b']]
export const STATUS_HEX: Record<string, string> = {
  reported: '#94a3b8', ai_verified: '#5bb6e6', gov_approved: '#7c9bf0', assigned: '#e8b04a',
  in_repair: '#f08a64', completed: '#4cc38a', rejected: '#e36a7a',
}
export const FACILITY_HEX: Record<string, string> = { health: '#e36a7a', school: '#7c9bf0', market: '#e8b04a', government: '#b9a3f0' }

const impactColor = ['interpolate', ['linear'], ['get', 'impact_score'], ...IMPACT_RAMP.flat()] as unknown as string

/** Road segments with Impact Score colouring. Loaded for the visible area from zoom 13. */
export function useSegments(view: { bbox: string; zoom: number } | null, enabled = true) {
  const [data, setData] = useState<FeatureCollection<SegmentProps> | null>(null)
  useEffect(() => {
    if (!enabled || !view || view.zoom < 13) return
    let live = true
    api.segments(view.bbox).then((d) => live && setData(d)).catch(() => undefined)
    return () => {
      live = false
    }
  }, [view, enabled])
  return enabled && view && view.zoom >= 13 ? data : null
}

export function useFacilities(view: { bbox: string; zoom: number } | null, enabled = true) {
  const [data, setData] = useState<FeatureCollection<FacilityProps> | null>(null)
  useEffect(() => {
    if (!enabled || !view || view.zoom < 12) return
    let live = true
    api.facilities(view.bbox).then((d) => live && setData(d)).catch(() => undefined)
    return () => {
      live = false
    }
  }, [view, enabled])
  return enabled && view && view.zoom >= 12 ? data : null
}

export function SegmentsLayer({ data, highlight = [], id = 'segments' }: { data: FeatureCollection<SegmentProps>; highlight?: string[]; id?: string }) {
  return (
    <Source id={id} type="geojson" data={data as unknown as GeoJSON.FeatureCollection}>
      <Layer
        id={id}
        type="line"
        slot="middle"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{
          'line-color': ['case', ['in', ['get', 'id'], ['literal', highlight]], '#5bb6e6', impactColor] as unknown as string,
          'line-width': ['interpolate', ['linear'], ['zoom'], 13, ['case', ['>', ['get', 'active_reports'], 0], 3, 1.2], 17,
            ['case', ['>', ['get', 'active_reports'], 0], 8, 3.5]] as unknown as number,
          'line-opacity': 0.9,
          'line-emissive-strength': 1,
        }}
      />
    </Source>
  )
}

export function FacilitiesLayer({ data }: { data: FeatureCollection<FacilityProps> }) {
  return (
    <Source id="facilities" type="geojson" data={data as unknown as GeoJSON.FeatureCollection}>
      <Layer
        id="facilities"
        type="circle"
        slot="top"
        paint={{
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 3, 16, 6] as unknown as number,
          'circle-color': ['match', ['get', 'kind'], ...Object.entries(FACILITY_HEX).flat(), '#93a1bc'] as unknown as string,
          'circle-stroke-color': '#08101f',
          'circle-stroke-width': 1.5,
          'circle-emissive-strength': 1,
        }}
      />
    </Source>
  )
}

export function reportsGeoJSON(reports: Report[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: reports.map((r) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
      properties: { code: r.code, status: r.status, category: r.category, priority: r.priority_score ?? 0 },
    })),
  }
}

/** Report pins: soft halo plus a solid core coloured by status. */
export function ReportsLayer({ reports, selected }: { reports: Report[]; selected?: string | null }) {
  const color = ['match', ['get', 'status'], ...Object.entries(STATUS_HEX).flat(), '#94a3b8'] as unknown as string
  return (
    <Source id="reports" type="geojson" data={reportsGeoJSON(reports)}>
      <Layer id="reports-halo" type="circle" slot="top"
        paint={{ 'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 8, 16, 22] as unknown as number, 'circle-color': color, 'circle-opacity': 0.18, 'circle-blur': 0.6, 'circle-emissive-strength': 1 }} />
      <Layer id="reports" type="circle" slot="top"
        paint={{
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 3.5, 16, 8] as unknown as number,
          'circle-color': color,
          'circle-stroke-color': ['case', ['==', ['get', 'code'], selected ?? ''], '#ffffff', '#08101f'] as unknown as string,
          'circle-stroke-width': ['case', ['==', ['get', 'code'], selected ?? ''], 3, 1.5] as unknown as number,
          'circle-emissive-strength': 1,
        }} />
    </Source>
  )
}
