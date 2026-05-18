import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const authClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await authClient.post('/auth/login', { email, password })
          if (!data.success) {
            throw new Error(data.message || 'Login failed')
          }
          const { accessToken, user } = data.data
          set({
            accessToken,
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (e) {
          set({ isLoading: false })
          throw e
        }
      },

      register: async (payload) => {
        set({ isLoading: true })
        try {
          const { data } = await authClient.post('/auth/register', payload)
          if (!data.success) {
            throw new Error(data.message || 'Registration failed')
          }
          set({ isLoading: false })
          return data
        } catch (e) {
          set({ isLoading: false })
          throw e
        }
      },

      logout: async (opts = {}) => {
        const { skipApi = false } = opts
        if (!skipApi) {
          const token = get().accessToken
          try {
            await authClient.post(
              '/auth/logout',
              {},
              {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              },
            )
          } catch {
            /* ignore */
          }
        }
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      refreshToken: async () => {
        console.log('AuthStore: Attempting token refresh...')
        try {
          const { data } = await axios.post(
            `${baseURL}/auth/refresh-token`,
            {},
            { withCredentials: true, headers: { 'Content-Type': 'application/json' } },
          )
          console.log('AuthStore: Refresh response:', data)
          if (!data.success) {
            console.log('AuthStore: Refresh failed:', data.message)
            throw new Error(data.message || 'Refresh failed')
          }
          const accessToken = data?.data?.accessToken
          if (!accessToken) {
            console.log('AuthStore: No access token in response')
            throw new Error('No access token returned')
          }
          console.log('AuthStore: Token refresh successful')
          set({ accessToken, isAuthenticated: true })
          return accessToken
        } catch (error) {
          console.log('AuthStore: Token refresh error:', error)
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          })
          throw error
        }
      },
    }),
    {
      name: 'vaultx-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
