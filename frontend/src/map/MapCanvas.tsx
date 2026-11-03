import type { ReactNode, Ref } from 'react'
import Map, { AttributionControl, NavigationControl, type MapMouseEvent, type MapRef, type ViewState } from 'react-map-gl/mapbox'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

// Mapbox Standard, night preset, muted theme so our data layers carry the colour.
const BASEMAP_CONFIG = { basemap: { lightPreset: 'night', theme: 'faded', showPointOfInterestLabels: false, showTransitLabels: false } }

export interface MapCanvasProps {
  initialViewState: Partial<ViewState>
  children?: ReactNode
  className?: string
  interactive?: boolean
  interactiveLayerIds?: string[]
  onClick?: (e: MapMouseEvent) => void
  onMoveEnd?: (bbox: string, zoom: number) => void
  onLoad?: () => void
  controls?: boolean
  mapRef?: Ref<MapRef>
}

export function MapCanvas({
  initialViewState, children, className = 'h-full w-full', interactive = true, interactiveLayerIds,
  onClick, onMoveEnd, onLoad, controls = true, mapRef,
}: MapCanvasProps) {
  if (!TOKEN) {
    return (
      <div className={`grid place-items-center bg-ink-900 text-sm text-muted ${className}`}>
        Peta butuh VITE_MAPBOX_TOKEN di frontend/.env.local
      </div>
    )
  }
  const report = (target: mapboxgl.Map) => {
    if (!onMoveEnd) return
    const b = target.getBounds()
    if (!b) return
    onMoveEnd([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((x) => x.toFixed(5)).join(','), target.getZoom())
  }
  return (
    <div className={className}>
      <Map
        ref={mapRef}
        mapboxAccessToken={TOKEN}
        mapStyle="mapbox://styles/mapbox/standard"
        config={BASEMAP_CONFIG}
        projection="globe"
        initialViewState={initialViewState}
        interactive={interactive}
        interactiveLayerIds={interactiveLayerIds}
        onClick={onClick}
        onLoad={(e) => {
          report(e.target)
          onLoad?.()
        }}
        onMoveEnd={(e) => report(e.target)}
        cursor={interactiveLayerIds?.length ? undefined : 'grab'}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <AttributionControl compact position="bottom-right" />
        {controls && interactive && <NavigationControl position="bottom-right" visualizePitch />}
        {children}
      </Map>
    </div>
  )
}
