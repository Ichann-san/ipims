/** Site footer. Map pages keep the Mapbox wordmark visible just above it (required by Mapbox terms). */
export function Footer({ overlay = false }: { overlay?: boolean }) {
  return (
    <footer
      className={`${overlay ? 'absolute inset-x-0 bottom-0 z-20 bg-ink-950/90 backdrop-blur-md' : 'mt-10 bg-ink-950'} border-t border-line`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 text-xs text-muted md:px-6">
        <span><b className="font-semibold text-fg">IPIMS Surabaya</b> · Inovboyo 2.0</span>
        <span>
          Map data © <a className="hover:text-fg" href="https://www.mapbox.com/about/maps/" target="_blank" rel="noreferrer">Mapbox</a>{' '}
          © <a className="hover:text-fg" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>{' '}
          <a className="underline hover:text-fg" href="https://apps.mapbox.com/feedback/" target="_blank" rel="noreferrer">Improve this map</a>
        </span>
      </div>
    </footer>
  )
}
