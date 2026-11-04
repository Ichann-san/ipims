import { Compass, Cube, DotsThree, Minus, Plus } from '@phosphor-icons/react'
import { useState } from 'react'
import { useCompactLayout } from '../responsive'
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
  const compact = useCompactLayout()
  const [optionsOpen, setOptionsOpen] = useState(false)
  const secondary = <>
    <IconButton variant="dock" label="Detailed 3D buildings" aria-pressed={detailed} onClick={onToggle}
      className={detailed ? 'bg-blue/30 text-cyan' : ''}><span className="flex flex-col items-center"><Cube size={18} /><span className="type-caption font-semibold">3D</span></span></IconButton>
    <IconButton variant="dock" label="Reset north" onClick={onResetNorth}><Compass size={21} style={{ transform: `rotate(${-bearing}deg)` }} /></IconButton>
  </>
  if (compact) return <div className="relative">
    <div role="toolbar" aria-label="Map controls" className="map-dock glass-strong flex gap-1 rounded-2xl p-1.5">
      <IconButton variant="dock" label="Zoom in" disabled={!canZoomIn} onClick={onZoomIn}><Plus size={19} /></IconButton>
      <IconButton variant="dock" label="Zoom out" disabled={!canZoomOut} onClick={onZoomOut}><Minus size={19} /></IconButton>
      <IconButton variant="dock" label="Map options" aria-expanded={optionsOpen} onClick={() => setOptionsOpen(!optionsOpen)}><DotsThree size={21} /></IconButton>
    </div>
    {optionsOpen && <div role="toolbar" aria-label="Map options" className="glass-strong absolute right-full top-0 mr-2 flex flex-col gap-1 rounded-2xl p-1.5" onKeyDown={(event) => { if (event.key === 'Escape') setOptionsOpen(false) }}>{secondary}</div>}
  </div>
  return <div role="toolbar" aria-label="Map controls" className="map-dock glass-strong flex gap-1 rounded-2xl p-1.5">
    <IconButton variant="dock" label="Detailed 3D buildings" aria-pressed={detailed} onClick={onToggle}
      className={detailed ? 'bg-blue/30 text-cyan' : ''}><span className="flex flex-col items-center"><Cube size={18} /><span className="type-caption font-semibold">3D</span></span></IconButton>
    <span className="map-dock-divider self-stretch bg-line" />
    <IconButton variant="dock" label="Zoom in" disabled={!canZoomIn} onClick={onZoomIn}><Plus size={19} /></IconButton>
    <IconButton variant="dock" label="Zoom out" disabled={!canZoomOut} onClick={onZoomOut}><Minus size={19} /></IconButton>
    <IconButton variant="dock" label="Reset north" onClick={onResetNorth}><Compass size={21} style={{ transform: `rotate(${-bearing}deg)` }} /></IconButton>
  </div>
}
