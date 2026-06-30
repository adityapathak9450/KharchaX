import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '../lib/queryClient'
import { useThemeStore } from '../store/themeStore'
import { STATUS } from '../lib/designTokens'
import { useEffect, useLayoutEffect } from 'react'

function applyThemeClass(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function ThemeSync() {
  const theme = useThemeStore((state) => state.theme)

  useLayoutEffect(() => {
    applyThemeClass(theme)
  }, [theme])

  useEffect(() => {
    const unsub = useThemeStore.persist.onFinishHydration((state) => {
      if (state?.theme) applyThemeClass(state.theme)
    })
    return unsub
  }, [])

  return null
}

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeSync />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className:
              '!bg-surface !text-foreground !border !border-border !shadow-dropdown !rounded-xl !text-sm',
            success: {
              iconTheme: {
                primary: 'rgb(var(--color-primary))',
                secondary: 'rgb(var(--color-surface))',
              },
            },
            error: {
              iconTheme: {
                primary: STATUS.error,
                secondary: 'rgb(var(--color-surface))',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}