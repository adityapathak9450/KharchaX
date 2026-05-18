import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '../lib/queryClient'

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className:
              '!bg-zinc-900 !text-zinc-100 !border !border-zinc-700 !shadow-xl !rounded-xl !text-sm',
            style: { background: '#18181b', color: '#fafafa' },
            success: { iconTheme: { primary: '#6366f1', secondary: '#fafafa' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#fafafa' } },
          }}
        />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}
