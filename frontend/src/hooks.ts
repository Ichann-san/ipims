import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pending = useRef<AbortController | null>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)
  const reload = useCallback(() => {
    pending.current?.abort()
    const controller = new AbortController()
    pending.current = controller
    setLoading(true)
    setError(null)
    run(controller.signal)
      .then((d) => {
        if (controller.signal.aborted) return
        setData(d)
        setError(null)
      })
      .catch((e: Error) => { if (!controller.signal.aborted) setError(e.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
  }, [run])
  useEffect(() => {
    reload()
    return () => pending.current?.abort()
  }, [reload])
  return { data, error, loading, reload, setData }
}
