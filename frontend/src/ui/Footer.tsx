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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 text-xs text-muted md:px-6">
        <span><b className="font-semibold text-fg">IPIMS Surabaya</b> · Inovboyo 2.0</span>
        <span>
          Map data © <a className="hover:text-fg" href="https://www.mapbox.com/about/maps/" target="_blank" rel="noreferrer">Mapbox</a>{' '}
          © <a className="hover:text-fg" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>{' '}
          <a className="underline hover:text-fg" href={feedback} target="_blank" rel="noreferrer">Improve this map</a>
        </span>
      </div>
    </footer>
  )
}
