import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Footer } from './Footer'
import { useCompactLayout } from '../responsive'

/** One owner for persistent chrome and the space it occupies on every route. */
export function SiteFrame({ header, children }: { header: ReactNode; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const compact = useCompactLayout()
  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const header = element.querySelector<HTMLElement>('.site-navbar')
    const footer = element.querySelector<HTMLElement>('.site-footer')
    const measure = () => {
      element.style.setProperty('--header-space', `${Math.ceil(header?.getBoundingClientRect().bottom ?? 0) + (compact ? 0 : 16)}px`)
      element.style.setProperty('--footer-height', `${Math.ceil(footer?.getBoundingClientRect().height ?? 0)}px`)
    }
    const observer = new ResizeObserver(measure)
    if (header) observer.observe(header)
    if (footer) observer.observe(footer)
    measure()
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [compact])
  return <div ref={root} className="site-frame">{header}<main className="site-workspace">{children}</main><Footer /></div>
}
