import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeClass(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: getSystemTheme(),

      setTheme: (theme) => {
        applyThemeClass(theme)
        set({ theme })
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        applyThemeClass(next)
        set({ theme: next })
      },

      get isDark() {
        return get().theme === 'dark'
      },

      get isLight() {
        return get().theme === 'light'
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        const theme = state?.theme || getSystemTheme()
        if (state) state.theme = theme
        applyThemeClass(theme)
      },
    }
  )
)
