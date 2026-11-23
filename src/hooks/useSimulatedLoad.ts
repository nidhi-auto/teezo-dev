import { useEffect, useState } from 'react'
import { hydrate, isHydrated, subscribeHydrate } from '@/data/store'

/** Returns `{ loading }` until the store has completed its first hydrate. */
export function usePageLoad(): { loading: boolean } {
  const [loading, setLoading] = useState(() => !isHydrated())

  useEffect(() => {
    if (isHydrated()) {
      setLoading(false)
      return
    }
    const unsub = subscribeHydrate(() => setLoading(!isHydrated()))
    void hydrate()
      .catch(() => {
        setLoading(false)
      })
      .finally(() => {
        if (isHydrated()) setLoading(false)
      })
    return unsub
  }, [])

  return { loading }
}

export function useSimulatedLoad(): { loading: boolean } {
  return usePageLoad()
}