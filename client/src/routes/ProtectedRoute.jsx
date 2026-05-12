import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import { RouteSkeleton } from '../components/auth/RouteSkeleton.jsx'

export function ProtectedRoute() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (user && isAuthenticated && !accessToken) {
        try {
          await useAuthStore.getState().refreshToken()
        } catch {
          await useAuthStore.getState().logout({ skipApi: true })
        }
      }
      if (alive) setChecking(false)
    })()
    return () => {
      alive = false
    }
  }, [user, accessToken, isAuthenticated])

  if (checking) {
    return <RouteSkeleton />
  }

  const token = useAuthStore.getState().accessToken
  const u = useAuthStore.getState().user
  if (!token || !u) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
