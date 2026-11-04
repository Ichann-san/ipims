import { useLayoutEffect, type RefObject } from 'react'

/** Share actual active-panel height with the mobile map dock. */
export function useMapPanel(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const panel = ref.current
    const root = panel?.closest<HTMLElement>('.public-map, .operations-map')
    if (!panel || !root) return
    const measure = () => root.style.setProperty('--map-panel-height', `${Math.ceil(panel.getBoundingClientRect().height)}px`)
    const observer = new ResizeObserver(measure)
    observer.observe(panel)
    measure()
    return () => { observer.disconnect(); root.style.removeProperty('--map-panel-height') }
  }, [ref])
}

export function cameraPadding(container: HTMLElement, panel: HTMLElement | null) {
  const rect = container.getBoundingClientRect()
  const header = document.querySelector('.site-frame > nav')?.getBoundingClientRect()
  const footer = document.querySelector('.site-footer')?.getBoundingClientRect()
  const padding = { top: Math.max(16, (header?.bottom ?? rect.top) - rect.top + 16),
    bottom: Math.max(16, rect.bottom - (footer?.top ?? rect.bottom) + 16), left: 16, right: 16 }
  if (panel) {
    const bounds = panel.getBoundingClientRect()
    if (bounds.width < rect.width * .55) padding.left = Math.max(16, bounds.right - rect.left + 16)
    else padding.bottom = Math.max(padding.bottom, rect.bottom - bounds.top + 16)
  }
  // Keep a usable center even on a very short/zoomed viewport.
  const vertical = Math.min(1, Math.max(.1, (rect.height - 80) / (padding.top + padding.bottom)))
  if (vertical < 1) { padding.top *= vertical; padding.bottom *= vertical }
  return padding
}
