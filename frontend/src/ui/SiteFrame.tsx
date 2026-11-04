import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Footer } from './Footer'

/** One owner for persistent chrome and the space it occupies on every route. */
export function SiteFrame({ header, children }: { header: ReactNode; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const header = element.querySelector<HTMLElement>('nav')
    const footer = element.querySelector<HTMLElement>('footer')
    const measure = () => {
      element.style.setProperty('--header-space', `${Math.ceil(header?.getBoundingClientRect().bottom ?? 0) + 16}px`)
      element.style.setProperty('--footer-height', `${Math.ceil(footer?.getBoundingClientRect().height ?? 0)}px`)
    }
    const observer = new ResizeObserver(measure)
    if (header) observer.observe(header)
    if (footer) observer.observe(footer)
    measure()
    return () => observer.disconnect()
  }, [])
  return <div ref={root} className="site-frame">{header}<main>{children}</main><Footer /></div>
}
