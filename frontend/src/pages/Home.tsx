import { ArrowRight, Plus } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/mapbox'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { BRAND } from '../brand'
import { METRIC_LABEL, formatHours } from '../labels'
import { useAsync } from '../hooks'
import { MapCanvas } from '../map/MapCanvas'
import { ReportsLayer } from '../map/layers'
import { stageHomeIntro } from '../map/homeIntro'
import { formatCoord, useRegion } from '../region'
import { useCompactLayout } from '../responsive'
import { Button, ButtonLink, ErrorNote, Panel, Stat } from '../ui/core'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Home() {
  const compact = useCompactLayout()
  const region = useRegion()
  const nav = useNavigate()
  const mapRef = useRef<MapRef>(null)
  const [layersReady, setLayersReady] = useState(false)
  const introCleanup = useRef<(() => void) | null>(null)
  const stats = useAsync(() => api.stats(), [])
  const reports = useAsync((signal) => api.listReports({ limit: 100 }, signal), [])

  // Prefetch during the entrance; attach map data only once the city camera settles.
  const onLoad = () => {
    const map = mapRef.current?.getMap()
    if (!map) return
    introCleanup.current?.()
    introCleanup.current = stageHomeIntro(map, { center: region.center, zoom: 12.4, pitch: 58, bearing: -18 }, reduceMotion(), () => setLayersReady(true))
  }
  useEffect(() => () => introCleanup.current?.(), [])
  useEffect(() => {
    if (!layersReady || compact || reduceMotion()) return
    let frame = 0
    let last = 0
    const spin = (t: number) => {
      const map = mapRef.current?.getMap()
      if (document.hidden) return
      if (map && !map.isMoving() && map.getZoom() > 11 && last) map.setBearing(map.getBearing() + (t - last) * 0.0016)
      last = t
      frame = requestAnimationFrame(spin)
    }
    const visibility = () => {
      cancelAnimationFrame(frame)
      last = 0
      if (!document.hidden) frame = requestAnimationFrame(spin)
    }
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility) }
  }, [layersReady, compact])

  const s = stats.data
  return (
    <div className="home-map relative h-[100dvh] overflow-hidden" data-map-phase={layersReady ? 'ready' : 'intro'}>
      <MapCanvas presentation overscan mapRef={mapRef} interactive={false} controls={false} attribution={false} onLoad={onLoad}
        initialViewState={{ longitude: 110, latitude: -4, zoom: 2.1, pitch: 0, bearing: 0 }}>
        {layersReady && <ReportsLayer reports={reports.data?.items ?? []} />}
      </MapCanvas>
      {/* Dim the map evenly, a little more behind the headline, so the text leads. */}
      <div className="home-scrim pointer-events-none absolute inset-0 bg-ink-950/45" />
      <div className="home-content-scrim pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_85%,rgb(8_16_31/0.85),transparent_55%)]" />

      <div className="home-content absolute inset-x-3 z-20 grid gap-3 md:inset-x-6 md:max-w-xl">
        <p className="num text-[11px] font-semibold uppercase tracking-[0.2em] text-coral-soft">
          Surabaya{!compact && `: ${formatCoord(region.center)}`}
        </p>
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
          Broken Infrastructure,<br /><span className="text-coral-soft">Fixed.</span>
        </h1>
        <p className="home-description type-meta max-w-md text-muted">{BRAND.name}</p>
        <div className="home-actions flex flex-wrap gap-2">
          <Button variant="primary" icon={<Plus size={18} weight="bold" />} onClick={() => nav('/laporan?buat=1')}>Report</Button>
          <ButtonLink to="/peta" icon={<ArrowRight size={18} />}>Open map</ButtonLink>
        </div>
        <Panel className="home-stats mt-1 grid grid-cols-3 gap-4 px-5 py-3">
          <Stat label="Active reports" value={s ? s.active : '—'} />
          <Stat label="Completed" value={s ? s.by_status.completed : '—'} tone="var(--color-st-completed)" />
          <Stat label={METRIC_LABEL.medianApproval} value={formatHours(s?.median_hours_to_verify)} />
        </Panel>
        {stats.error && <ErrorNote compact title="Statistics unavailable." message="Try again." onRetry={stats.reload} />}
        {/* {reports.error ? <ErrorNote compact title="Report locations unavailable." message="Try again." onRetry={reports.reload} />
          : <p className="type-caption text-muted" role="status">{reports.data ? `Map shows the latest ${reports.data.items.length} of ${reports.data.total} reports.` : 'Loading report locations…'}</p>} */}
      </div>

    </div>
  )
}
