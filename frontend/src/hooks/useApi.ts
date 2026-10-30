/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = []
): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    setError(null)
    fetcherRef
      .current(ac.signal)
      .then((result) => {
        if (!ac.signal.aborted) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Error de carga')
        setLoading(false)
      })
    return () => ac.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  return { data, loading, error, reload }
}
