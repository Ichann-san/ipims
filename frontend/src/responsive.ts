import { useSyncExternalStore } from 'react'

// Short phone landscape needs the same deliberate layout as phone portrait.
// Keep this query in sync with the compact workspace block in index.css.
export const COMPACT_QUERY = '(max-width: 767px), (max-width: 1023px) and (max-height: 500px)'
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(COMPACT_QUERY)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
const getSnapshot = () => window.matchMedia(COMPACT_QUERY).matches

export function useCompactLayout() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
