import { ArrowRight, Plus } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'
import type { MapRef } from 'react-map-gl/mapbox'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAsync } from '../hooks'
import { MapCanvas } from '../map/MapCanvas'
import { ReportsLayer } from '../map/layers'
import { formatCoord, useRegion } from '../region'
import { Button, Panel, Stat } from '../ui/core'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Home() {
  const region = useRegion()
  const nav = useNavigate()
  const mapRef = useRef<MapRef>(null)
  const stats = useAsync(() => api.stats(), [])
  const reports = useAsync(() => api.listReports({ limit: 100 }), [])

  // Globe to city: one fly-in after load, then a slow orbit that stops when the tab is hidden.
  const onLoad = () => {
    const map = mapRef.current
    if (!map) return
    const city = { center: region.center, zoom: 12.4, pitch: 58, bearing: -18 }
    if (reduceMotion()) {
      map.jumpTo(city)
      return
    }
    map.flyTo({ ...city, duration: 5200, essential: true, curve: 1.6 })
  }
  useEffect(() => {
    if (reduceMotion()) return
    let frame = 0
    let last = 0
    const spin = (t: number) => {
      const map = mapRef.current?.getMap()
      if (map && !map.isMoving() && map.getZoom() > 11 && last) map.setBearing(map.getBearing() + (t - last) * 0.0016)
      last = t
      frame = requestAnimationFrame(spin)
    }
    frame = requestAnimationFrame(spin)
    return () => cancelAnimationFrame(frame)
  }, [])

  const s = stats.data
  return (
    <div className="relative h-[100dvh] overflow-hidden">
      <MapCanvas mapRef={mapRef} interactive={false} controls={false} onLoad={onLoad}
        initialViewState={{ longitude: 110, latitude: -4, zoom: 2.1, pitch: 0, bearing: 0 }}>
        <ReportsLayer reports={reports.data?.items ?? []} />
      </MapCanvas>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_100%,rgb(8_16_31/0.92),transparent_60%)]" />

      <div className="absolute inset-x-3 bottom-9 grid gap-3 md:inset-x-6 md:bottom-10 md:max-w-xl">
        <p className="num text-[11px] font-semibold uppercase tracking-[0.2em] text-coral-soft">
          Pusat {region.name} · {formatCoord(region.center)}
        </p>
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
          Jalan rusak dilaporkan,<br /><span className="text-coral-soft">diprioritaskan, diperbaiki.</span>
        </h1>
        <p className="max-w-md text-muted">Foto kerusakan, AI menilai, sistem mengurutkan perbaikan menurut dampaknya pada kota.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={<Plus size={18} weight="bold" />} onClick={() => nav('/laporan?buat=1')}>Lapor</Button>
          <Link to="/peta"><Button icon={<ArrowRight size={18} />}>Buka peta</Button></Link>
        </div>
        <Panel className="mt-1 grid grid-cols-3 gap-4 px-4 py-3">
          <Stat label="Laporan aktif" value={s ? s.active : '-'} />
          <Stat label="Selesai" value={s ? s.by_status.completed : '-'} tone="var(--color-st-completed)" />
          <Stat label="Median disetujui" value={s?.median_hours_to_verify != null ? `${s.median_hours_to_verify} j` : '-'} />
        </Panel>
      </div>
    </div>
  )
}
