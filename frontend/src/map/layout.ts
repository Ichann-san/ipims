import { useLayoutEffect, type RefObject } from 'react'
import { COMPACT_QUERY } from '../responsive'

/** Measure the one visible panel in workspace coordinates, including responsive changes. */
export function useMapPanel(ref: RefObject<HTMLElement | null>, active: unknown = true) {
  useLayoutEffect(() => {
    const panel = ref.current
    const root = panel?.closest<HTMLElement>('.public-map, .operations-map')
    if (!panel || !root) return
    const measure = () => {
      root.style.setProperty('--map-panel-height', `${Math.ceil(panel.getBoundingClientRect().height)}px`)
      root.dispatchEvent(new Event('ipims-map-panel'))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(panel)
    measure()
    return () => {
      observer.disconnect()
      root.style.removeProperty('--map-panel-height')
      // Let the removed panel leave the DOM before recalculating camera space.
      requestAnimationFrame(() => root.dispatchEvent(new Event('ipims-map-panel')))
    }
  }, [ref, active])
}

export function cameraPadding(container: HTMLElement, panel: HTMLElement | null) {
  const rect = container.getBoundingClientRect()
  const compact = window.matchMedia(COMPACT_QUERY).matches
  const header = compact ? undefined : document.querySelector('.site-frame > nav')?.getBoundingClientRect()
  const footer = compact ? undefined : document.querySelector('.site-footer')?.getBoundingClientRect()
  const padding = { top: Math.max(16, (header?.bottom ?? rect.top) - rect.top + 16),
    bottom: Math.max(16, rect.bottom - (footer?.top ?? rect.bottom) + 16), left: 16, right: 16 }
  if (panel) {
    const bounds = panel.getBoundingClientRect()
    if (bounds.width < rect.width * .55) padding.left = Math.max(16, bounds.right - rect.left + 16)
    else padding.bottom = Math.max(padding.bottom, rect.bottom - bounds.top + 16)
  }
  // Keep a useful center on short or zoomed screens.
  const vertical = Math.min(1, Math.max(.1, (rect.height - 80) / (padding.top + padding.bottom)))
  if (vertical < 1) { padding.top *= vertical; padding.bottom *= vertical }
  const surface = container.querySelector('.map-render-surface')?.getBoundingClientRect()
  padding.bottom += Math.max(0, (surface?.bottom ?? rect.bottom) - rect.bottom)
  return padding
}
