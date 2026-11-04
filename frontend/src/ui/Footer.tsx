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
        <div className="col-span-2 row-start-1 flex flex-wrap items-center gap-2 md:col-span-1 md:row-span-2 md:gap-3">
          <img src="/pemkot-emblem.webp" alt="Pemerintah Kota Surabaya" width={156} height={200} className="h-9 w-auto shrink-0 object-contain md:h-10" />
          {/* The ITS export has empty headroom; frame the artwork without changing the source asset. */}
          <img src="/its.png" alt="Institut Teknologi Sepuluh Nopember" width={2198} height={1356} className="h-9 w-[94px] shrink-0 object-cover object-bottom md:h-12 md:w-[125px]" />
          <img src="/brida-dark.webp" alt="BRIDA Kota Surabaya" width={586} height={160} className="h-7 w-auto shrink-0 object-contain md:h-10" />
          <span className="flex shrink-0 items-center gap-2">
            <img src="/inovboyo.svg" alt="Inovboyo 2.0" width={40} height={40} className="h-8 w-auto object-contain md:h-10" />
            <span aria-hidden="true" className="hidden font-semibold md:inline md:text-sm">Inovboyo 2.0</span>
          </span>
        </div>
        <p className="col-span-2 row-start-2 text-right md:col-span-1 md:col-start-2 md:row-start-1 md:self-end">
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
