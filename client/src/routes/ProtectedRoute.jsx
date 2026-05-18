import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { RouteSkeleton } from '../components/auth/RouteSkeleton'

export function ProtectedRoute() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  console.log('ProtectedRoute: Checking auth state', {
    user: user ? user.email : null,
    isAuthenticated,
    hasAccessToken: !!accessToken,
    hydrated: useAuthStore.persist.hasHydrated(),
    isLoading
  })

  // Check if Zustand has hydrated yet
  if (!useAuthStore.persist.hasHydrated()) {
    console.log('ProtectedRoute: Not hydrated yet, showing skeleton')
    return <RouteSkeleton />
  }

  // Show loading if auth operations are in progress
  if (isLoading) {
    console.log('ProtectedRoute: Auth in progress, showing skeleton')
    return <RouteSkeleton />
  }

  // If user exists and is authenticated but no access token, wait for refresh
  if (user && isAuthenticated && !accessToken) {
    console.log('ProtectedRoute: User exists but no token, waiting for refresh...')
    return <RouteSkeleton />
  }

  // Check if user is authenticated and has valid token
  if (!isAuthenticated || !user || !accessToken) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login', {
      isAuthenticated,
      hasUser: !!user,
      hasAccessToken: !!accessToken
    })
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  console.log('ProtectedRoute: User authenticated, rendering protected content')
  return <Outlet />
}
