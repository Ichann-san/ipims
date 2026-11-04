import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import Map, { AttributionControl, type MapMouseEvent, type MapRef, type ViewState } from 'react-map-gl/mapbox'
import { useRegion } from '../region'
import { MapDock } from './MapDock'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
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
  attribution?: boolean
  mapRef?: RefObject<MapRef | null>
  constrainToRegion?: boolean
  presentation?: boolean
  overscan?: boolean
}

export function MapCanvas({ initialViewState, children, className = 'h-full w-full', interactive = true, interactiveLayerIds,
  onClick, onMoveEnd, onLoad, controls = true, attribution = true, mapRef, constrainToRegion = false, presentation = false, overscan = false,
}: MapCanvasProps) {
  const region = useRegion()
  const [detailed, setDetailed] = useState(false)
  const [camera, setCamera] = useState({ bearing: initialViewState.bearing ?? 0, zoom: initialViewState.zoom ?? 0 })
  const localRef = useRef<MapRef>(null)
  const root = useRef<HTMLDivElement>(null)
  const lastFeedback = useRef('')
  const ref = mapRef ?? localRef
  const fullScreen = presentation || constrainToRegion
  const bounds = useMemo<[number, number, number, number] | undefined>(() => {
    if (!constrainToRegion || !region.bbox) return undefined
    const [west, south, east, north] = region.bbox
    const pad = Math.max(0.025, (east - west) * 0.15, (north - south) * 0.15)
    return [west - pad, south - pad, east + pad, north + pad]
  }, [constrainToRegion, region.bbox])
  const config = useMemo(() => presentation ? { basemap: BASEMAP_CONFIG } : { basemap: {
    ...BASEMAP_CONFIG, show3dObjects: detailed, show3dTrees: false, show3dLandmarks: false, show3dFacades: false,
  } }, [detailed, presentation])

  const padVisibleArea = useCallback(() => {
    const element = root.current
    const map = ref.current?.getMap()
    if (!element || !map || !fullScreen) return
    const css = getComputedStyle(element)
    const footer = parseFloat(css.getPropertyValue('--footer-height')) || 48
    const header = parseFloat(css.getPropertyValue('--header-space')) || 94
    map.setPadding({ top: header, bottom: footer + 16 + (overscan ? element.clientHeight * 0.1 : 0), left: 16, right: 16 })
  }, [fullScreen, overscan, ref])
  useEffect(() => {
    if (!root.current || !fullScreen) return
    const observer = new ResizeObserver(padVisibleArea)
    observer.observe(root.current)
    const footer = document.querySelector('footer')
    if (footer) observer.observe(footer)
    return () => observer.disconnect()
  }, [fullScreen, padVisibleArea])

  if (!TOKEN) return <div className={`grid place-items-center bg-ink-900 text-sm text-muted ${className}`}>The map needs VITE_MAPBOX_TOKEN in frontend/.env.local</div>

  const report = (target: mapboxgl.Map) => {
    if (controls && interactive) setCamera({ bearing: target.getBearing(), zoom: target.getZoom() })
    const center = target.getCenter()
    const feedback = `https://apps.mapbox.com/feedback/#/${center.lng.toFixed(5)}/${center.lat.toFixed(5)}/${target.getZoom().toFixed(2)}`
    if (fullScreen && feedback !== lastFeedback.current) {
      lastFeedback.current = feedback
      window.dispatchEvent(new CustomEvent('ipims-map-camera', { detail: feedback }))
    }
    const b = target.getBounds()
    if (b && onMoveEnd) onMoveEnd([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((x) => x.toFixed(5)).join(','), target.getZoom())
  }
  const duration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350
  return <div ref={root} data-fullscreen={fullScreen} className={`map-viewport ${overscan ? 'map-overscan' : ''} ${className}`}>
    <div className="map-render-surface">
      <Map ref={ref} mapboxAccessToken={TOKEN} mapStyle="mapbox://styles/mapbox/standard" config={config}
        projection={presentation ? 'globe' : 'mercator'} maxBounds={bounds} minZoom={constrainToRegion ? 10 : 0}
        maxZoom={presentation ? 22 : 19} maxPitch={presentation ? 85 : detailed ? 60 : 35}
        initialViewState={initialViewState} interactive={interactive} interactiveLayerIds={interactiveLayerIds} onClick={onClick}
        onLoad={(e) => { padVisibleArea(); report(e.target); onLoad?.() }} onMoveEnd={(e) => report(e.target)}
        cursor={interactive ? 'grab' : 'default'} attributionControl={false} style={{ width: '100%', height: '100%' }}>
        {!fullScreen && attribution && <AttributionControl compact position="bottom-right" />}
        {children}
      </Map>
    </div>
    {controls && interactive && <div className="map-control-position">
      <MapDock detailed={detailed} bearing={camera.bearing} canZoomIn={camera.zoom < 19} canZoomOut={camera.zoom > (constrainToRegion ? 10 : 0)}
        onToggle={() => {
          const next = !detailed
          setDetailed(next)
          ref.current?.getMap().setMaxPitch(next ? 60 : 35)
          ref.current?.easeTo({ pitch: next ? 50 : 25, duration: duration() })
        }}
        onZoomIn={() => ref.current?.zoomIn({ duration: duration() })} onZoomOut={() => ref.current?.zoomOut({ duration: duration() })}
        onResetNorth={() => ref.current?.resetNorth({ duration: duration() })} />
    </div>}
  </div>
}
