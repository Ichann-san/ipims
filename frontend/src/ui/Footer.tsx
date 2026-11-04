import { useEffect, useState } from 'react'

export function Footer() {
  const [feedback, setFeedback] = useState('https://apps.mapbox.com/feedback/')
  useEffect(() => {
    const update = (event: Event) => setFeedback((event as CustomEvent<string>).detail)
    window.addEventListener('ipims-map-camera', update)
    return () => window.removeEventListener('ipims-map-camera', update)
  }, [])
  return (
    <footer className="site-footer border-t border-line bg-ink-950/95 backdrop-blur-md">
      <div className="mx-auto grid min-h-24 max-w-6xl grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-4 py-3 text-xs text-muted md:min-h-[72px] md:gap-x-6 md:gap-y-1 md:px-6">
        <div className="row-start-1 flex items-center gap-2 md:row-span-2">
          <img src="/inovboyo.svg" alt="" width={40} height={40} className="size-8 shrink-0 object-contain md:size-10" />
          <span className="font-semibold md:text-sm">Inovboyo 2.0</span>
        </div>
        <p className="col-start-2 row-start-1 text-right md:self-end">
          <b className="font-semibold text-fg">IPIMS</b> · © {new Date().getFullYear()} IPIMS
        </p>
        <div className="col-span-2 flex flex-wrap justify-end gap-x-2 gap-y-1 text-right text-[11px] md:col-span-1 md:col-start-2 md:self-start">
          <a className="whitespace-nowrap hover:text-fg" href="https://www.mapbox.com/about/maps/" target="_blank" rel="noreferrer">© Mapbox</a>
          <a className="whitespace-nowrap hover:text-fg" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
          <a className="whitespace-nowrap underline underline-offset-2 hover:text-fg" href={feedback} target="_blank" rel="noreferrer">Improve this map</a>
        </div>
      </div>
    </footer>
  )
}
