import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import Map, { AttributionControl, type MapMouseEvent, type MapRef, type ViewState } from 'react-map-gl/mapbox'
import { useRegion } from '../region'
import { MapDock } from './MapDock'
import { cameraPadding } from './layout'
import { useCompactLayout } from '../responsive'

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
  const compact = useCompactLayout()
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
    const workspace = element.closest<HTMLElement>('.public-map, .operations-map') ?? element
    const panel = workspace.querySelector<HTMLElement>('[data-map-panel-active]')
    if (compact) map.setPadding(cameraPadding(element, panel))
    else {
      const css = getComputedStyle(element)
      map.setPadding({ top: parseFloat(css.getPropertyValue('--header-space')) || 94,
        bottom: (parseFloat(css.getPropertyValue('--footer-height')) || 48) + 16 + (overscan ? element.clientHeight * .1 : 0), left: 16, right: 16 })
    }
    const extra = Math.max(0, map.getContainer().getBoundingClientRect().bottom - element.getBoundingClientRect().bottom)
    const footer = compact ? 0 : Math.max(0, element.getBoundingClientRect().bottom - (document.querySelector('.site-footer')?.getBoundingClientRect().top ?? element.getBoundingClientRect().bottom))
    // The native Mapbox wordmark belongs above the actual clipped canvas bottom.
    const panelBounds = compact ? panel?.getBoundingClientRect() : undefined
    const bounds = element.getBoundingClientRect()
    const panelBottom = panelBounds && panelBounds.width >= bounds.width * .55 ? bounds.bottom - panelBounds.top + 8 : 0
    const nativeBottom = extra + footer + Math.max(8, panelBottom)
    element.style.setProperty('--map-native-bottom', `${nativeBottom}px`)
    // const nativeControls = element.querySelector<HTMLElement>('.mapboxgl-ctrl-bottom-left')
    // if (nativeControls) {
    //   nativeControls.style.bottom = `${nativeBottom}px`
    //   nativeControls.style.left = panelBounds && panelBounds.width < bounds.width * .55 ? `${panelBounds.right - bounds.left + 8}px` : '0px'
    // }
  }, [fullScreen, compact, overscan, ref])
  useEffect(() => {
    if (!root.current || !fullScreen) return
    const observer = new ResizeObserver(padVisibleArea)
    observer.observe(root.current)
    const footer = document.querySelector('footer')
    if (footer) observer.observe(footer)
    const workspace = root.current.closest<HTMLElement>('.public-map, .operations-map')
    workspace?.addEventListener('ipims-map-panel', padVisibleArea)
    padVisibleArea()
    return () => { observer.disconnect(); workspace?.removeEventListener('ipims-map-panel', padVisibleArea) }
  }, [fullScreen, padVisibleArea])

  if (!TOKEN) return <div role="status" className={`grid place-items-center bg-ink-900 text-sm text-muted ${className}`}>Map unavailable. Please try again later.</div>

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
