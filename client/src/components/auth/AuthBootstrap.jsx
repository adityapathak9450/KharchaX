import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { RouteSkeleton } from './RouteSkeleton'

export function AuthBootstrap({ children }) {
  const [ready, setReady] = useState(false)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)

  useEffect(() => {
    let mounted = true
    
    const initialize = async () => {
      console.log('AuthBootstrap: Initializing...')
      console.log('AuthBootstrap: Zustand hydrated?', useAuthStore.persist.hasHydrated())
      
      // Wait for Zustand to hydrate
      if (!useAuthStore.persist.hasHydrated()) {
        console.log('AuthBootstrap: Waiting for hydration...')
        useAuthStore.persist.onFinishHydration(() => {
          console.log('AuthBootstrap: Hydration finished')
          if (mounted) {
            setReady(true)
          }
        })
      } else {
        console.log('AuthBootstrap: Already hydrated')
        setReady(true)
      }
    }

    initialize()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    console.log('AuthBootstrap: State changed', {
      ready,
      user: user ? user.email : null,
      isAuthenticated,
      hasAccessToken: !!accessToken
    })

    if (!ready) return

    let mounted = true
    
    const checkAuth = async () => {
      console.log('AuthBootstrap: Checking auth state...')
      
      // If user exists and is authenticated but no access token, try to refresh
      if (user && isAuthenticated && !accessToken) {
        console.log('AuthBootstrap: User exists but no token, attempting refresh...')
        try {
          const newToken = await useAuthStore.getState().refreshToken()
          console.log('AuthBootstrap: Token refresh successful')
        } catch (error) {
          console.error('AuthBootstrap: Token refresh failed:', error)
          // Don't automatically logout, let the user handle it
        }
      } else if (user && isAuthenticated && accessToken) {
        console.log('AuthBootstrap: User is authenticated with token')
      } else {
        console.log('AuthBootstrap: User not authenticated')
      }
    }

    checkAuth()

    return () => {
      mounted = false
    }
  }, [ready, user, isAuthenticated, accessToken])

  // Show loading only during initial hydration
  if (!ready) {
    console.log('AuthBootstrap: Showing loading skeleton')
    return <RouteSkeleton />
  }

  console.log('AuthBootstrap: Rendering children')
  // Always render children - let ProtectedRoute handle auth checks
  return children
}
