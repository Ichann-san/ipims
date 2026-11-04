import { X } from '@phosphor-icons/react'
import type { ReactNode, RefObject } from 'react'
import { IconButton, Panel } from '../ui/core'

/** Non-modal: map gestures remain available outside the single active panel. */
export function MobileMapPanel({ title, onClose, children, panelRef, peek = false }: {
  title: string; onClose: () => void; children: ReactNode; panelRef: RefObject<HTMLDivElement | null>; peek?: boolean
}) {
  return <div ref={panelRef} data-map-panel-active className={`map-mobile-panel ${peek ? 'map-mobile-peek' : ''}`}
    role="region" aria-label={title} onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); onClose() } }}>
    <Panel strong className="flex min-h-0 max-h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line pl-3 pr-1">
        <h2 className="type-section">{title}</h2>
        <IconButton label={`Close ${title.toLowerCase()}`} onClick={onClose}><X size={18} /></IconButton>
      </div>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-3">{children}</div>
    </Panel>
  </div>
}
