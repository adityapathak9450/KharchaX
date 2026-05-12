import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status !== 401) {
      return Promise.reject(error)
    }

    if (originalRequest.url?.includes('/auth/refresh-token')) {
      await useAuthStore.getState().logout({ skipApi: true })
      return Promise.reject(error)
    }

    if (originalRequest._authRetry) {
      await useAuthStore.getState().logout({ skipApi: true })
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          originalRequest._authRetry = true
          return api(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    isRefreshing = true
    try {
      const { data } = await axios.post(
        `${baseURL}/auth/refresh-token`,
        {},
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } },
      )
      const newAccess =
        data?.data?.accessToken ?? data?.accessToken ?? data?.access_token
      if (!newAccess) {
        throw new Error('Invalid refresh response')
      }
      useAuthStore.getState().setAccessToken(newAccess)
      processQueue(null, newAccess)
      originalRequest.headers.Authorization = `Bearer ${newAccess}`
      originalRequest._authRetry = true
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      await useAuthStore.getState().logout({ skipApi: true })
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
export { baseURL }
