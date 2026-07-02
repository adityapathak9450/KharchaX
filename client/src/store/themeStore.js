import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function getDefaultTheme() {
  return 'dark'
}

function applyThemeClass(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: getDefaultTheme(),

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
        const theme = state?.theme || getDefaultTheme()

        if (state) {
          state.theme = theme
        }

        applyThemeClass(theme)
      },
    }
  )
)