export interface CityCamera { center: [number, number]; zoom: number; pitch: number; bearing: number }
interface IntroMap {
  once(event: 'moveend' | 'idle', listener: () => void): unknown
  off(event: 'moveend' | 'idle', listener: () => void): unknown
  flyTo(options: CityCamera & { duration: number; essential: boolean; curve: number }): unknown
  jumpTo(options: CityCamera): unknown
}

/** Mount overlays after the entrance, with a bounded settling phase before orbit. */
export function stageHomeIntro(map: IntroMap, city: CityCamera, reducedMotion: boolean, ready: () => void) {
  let cancelled = false
  let finished = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const finish = () => {
    if (cancelled || finished) return
    finished = true
    clearTimeout(timer)
    map.off('idle', finish)
    ready()
  }
  const settled = () => {
    if (cancelled) return
    map.once('idle', finish)
    timer = setTimeout(finish, 750)
  }
  map.once('moveend', settled)
  if (reducedMotion) map.jumpTo(city)
  else map.flyTo({ ...city, duration: 5200, essential: true, curve: 1.6 })
  return () => {
    cancelled = true
    clearTimeout(timer)
    map.off('moveend', settled)
    map.off('idle', finish)
  }
}
