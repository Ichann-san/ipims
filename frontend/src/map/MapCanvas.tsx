import { useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import Map, { AttributionControl, NavigationControl, type MapMouseEvent, type MapRef, type ViewState } from 'react-map-gl/mapbox'
import { useRegion } from '../region'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

// Mapbox Standard, night preset, muted theme so our data layers carry the colour.
const BASEMAP_CONFIG = { lightPreset: 'night', theme: 'faded', showPointOfInterestLabels: false, showTransitLabels: false }

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
  /** false when the page shows the attribution text next to the map (e.g. in a footer). */
  attribution?: boolean
  mapRef?: RefObject<MapRef | null>
  /** Report location pickers stay unrestricted so GPS outside the network still works. */
  constrainToRegion?: boolean
  /** Preserve the homepage globe entrance, lighting and full 3D scene. */
  presentation?: boolean
}

export function MapCanvas({
  initialViewState, children, className = 'h-full w-full', interactive = true, interactiveLayerIds,
  onClick, onMoveEnd, onLoad, controls = true, attribution = true, mapRef, constrainToRegion = false, presentation = false,
}: MapCanvasProps) {
  const region = useRegion()
  const [detailed, setDetailed] = useState(false)
  const localRef = useRef<MapRef>(null)
  const ref = mapRef ?? localRef
  const bounds = useMemo<[number, number, number, number] | undefined>(() => {
    if (!constrainToRegion || !region.bbox) return undefined
    const [west, south, east, north] = region.bbox
    const pad = Math.max(0.025, (east - west) * 0.15, (north - south) * 0.15)
    return [west - pad, south - pad, east + pad, north + pad]
  }, [constrainToRegion, region.bbox])
  const config = useMemo(() => presentation ? { basemap: BASEMAP_CONFIG } : ({ basemap: {
    ...BASEMAP_CONFIG, show3dObjects: detailed, show3dTrees: false,
    show3dLandmarks: false, show3dFacades: false,
  } }), [detailed, presentation])
  if (!TOKEN) {
    return (
      <div className={`grid place-items-center bg-ink-900 text-sm text-muted ${className}`}>
        The map needs VITE_MAPBOX_TOKEN in frontend/.env.local
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
    <div className={`relative ${className}`}>
      <Map
        ref={ref}
        mapboxAccessToken={TOKEN}
        mapStyle="mapbox://styles/mapbox/standard"
        config={config}
        projection={presentation ? 'globe' : 'mercator'}
        maxBounds={bounds}
        minZoom={constrainToRegion ? 10 : 0}
        maxZoom={presentation ? 22 : 19}
        maxPitch={presentation ? 85 : detailed ? 60 : 35}
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
        {attribution && <AttributionControl compact position="bottom-right" />}
        {controls && interactive && <NavigationControl position="bottom-right" visualizePitch />}
        {children}
      </Map>
      {controls && interactive && (
        <button type="button" aria-pressed={detailed} aria-label="Detailed 3D buildings"
          className="absolute bottom-36 right-3 z-10 min-h-11 rounded-xl border border-line-strong bg-ink-900 px-3 text-sm font-semibold text-fg hover:bg-ink-700"
          onClick={() => {
            const next = !detailed
            setDetailed(next)
            ref.current?.easeTo({ pitch: next ? 50 : 25, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400 })
          }}>3D {detailed ? 'on' : 'off'}</button>
      )}
    </div>
  )
}
