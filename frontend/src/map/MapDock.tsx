import { Compass, Cube, Minus, Plus } from '@phosphor-icons/react'
import { IconButton } from '../ui/core'

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
  return <div role="toolbar" aria-label="Map controls" className="map-dock glass-strong flex gap-1 rounded-2xl p-1.5">
    <IconButton variant="dock" label="Detailed 3D buildings" aria-pressed={detailed} onClick={onToggle}
      className={detailed ? 'bg-blue/30 text-cyan' : ''}><span className="flex flex-col items-center"><Cube size={18} /><span className="type-caption font-semibold">3D</span></span></IconButton>
    <span className="map-dock-divider self-stretch bg-line" />
    <IconButton variant="dock" label="Zoom in" disabled={!canZoomIn} onClick={onZoomIn}><Plus size={19} /></IconButton>
    <IconButton variant="dock" label="Zoom out" disabled={!canZoomOut} onClick={onZoomOut}><Minus size={19} /></IconButton>
    <IconButton variant="dock" label="Reset north" onClick={onResetNorth}><Compass size={21} style={{ transform: `rotate(${-bearing}deg)` }} /></IconButton>
  </div>
}
