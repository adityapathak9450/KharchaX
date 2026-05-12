import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore.js'
import { RouteSkeleton } from './RouteSkeleton.jsx'

export function AuthBootstrap({ children }) {
  const [ready, setReady] = useState(() => useAuthStore.persist.hasHydrated())

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setReady(true)
      return undefined
    }
    return useAuthStore.persist.onFinishHydration(() => {
      setReady(true)
    })
  }, [])

  useEffect(() => {
    if (!ready) return undefined
    let cancelled = false
    const run = async () => {
      const { accessToken, user, isAuthenticated, refreshToken, logout } = useAuthStore.getState()
      if (user && isAuthenticated && !accessToken) {
        try {
          await refreshToken()
        } catch {
          if (!cancelled) await logout({ skipApi: true })
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [ready])

  if (!ready) {
    return <RouteSkeleton />
  }

  return children
}
