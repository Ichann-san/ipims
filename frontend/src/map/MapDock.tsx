import { Compass, Cube, Minus, Plus } from '@phosphor-icons/react'

export interface MapDockProps {
  detailed: boolean
  onToggle: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetNorth: () => void
  bearing?: number
  canZoomIn?: boolean
  canZoomOut?: boolean
}

export function MapDock({ detailed, onToggle, onZoomIn, onZoomOut, onResetNorth, bearing = 0, canZoomIn = true, canZoomOut = true }: MapDockProps) {
  const button = 'grid size-11 shrink-0 place-items-center rounded-xl text-fg transition hover:bg-white/[0.08] disabled:opacity-35'
  return <div role="toolbar" aria-label="Map controls" className="map-dock glass-strong flex gap-1 rounded-2xl p-1.5">
    <button type="button" aria-label="Detailed 3D buildings" title="3D buildings" aria-pressed={detailed} onClick={onToggle}
      className={`${button} ${detailed ? 'bg-blue/30 text-cyan' : ''}`}><span className="flex flex-col items-center"><Cube size={18} /><span className="text-[10px] font-semibold">3D</span></span></button>
    <span className="map-dock-divider self-stretch bg-line" />
    <button type="button" className={button} aria-label="Zoom in" title="Zoom in" disabled={!canZoomIn} onClick={onZoomIn}><Plus size={19} /></button>
    <button type="button" className={button} aria-label="Zoom out" title="Zoom out" disabled={!canZoomOut} onClick={onZoomOut}><Minus size={19} /></button>
    <button type="button" className={button} aria-label="Reset north" title="Reset north" onClick={onResetNorth}><Compass size={21} style={{ transform: `rotate(${-bearing}deg)` }} /></button>
  </div>
}
