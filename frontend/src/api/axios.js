import axios from 'axios'
import { useAuthStore } from '../store/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
})

// Adjunta Authorization si hay access token
api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  if (token?.access) {
    config.headers.Authorization = `Bearer ${token.access}`
  }
  return config
})

// Intento de refresh 1 sola vez si 401
let isRefreshing = false
let pendingQueue = []

const processQueue = (error, newToken = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(newToken)
  })
  pendingQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error?.response?.status

    if (status === 401 && !original._retry) {
      original._retry = true
      const store = useAuthStore.getState()

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (newAccess) => {
              original.headers.Authorization = `Bearer ${newAccess}`
              resolve(api(original))
            },
            reject,
          })
        })
      }

      try {
        isRefreshing = true
        const newAccess = await store.refreshToken()
        processQueue(null, newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch (e) {
        processQueue(e, null)
        useAuthStore.getState().logout()
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
