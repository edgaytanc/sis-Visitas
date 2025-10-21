import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from '../api/axios'

const USE_DUMMY = (import.meta.env.VITE_USE_DUMMY_AUTH || 'false').toLowerCase() === 'true'
const LOGIN_PATH = import.meta.env.VITE_AUTH_LOGIN_PATH || '/api/auth/jwt/create/'
const REFRESH_PATH = import.meta.env.VITE_AUTH_REFRESH_PATH || '/api/auth/jwt/refresh/'
const ME_PATH = import.meta.env.VITE_AUTH_ME_PATH || '/api/auth/users/me/'

// Roles dummy por username
const dummyRoleMap = {
  recepcion: ['recepcion'],
  supervisor: ['supervisor'],
  admin: ['admin'],
  multi: ['recepcion', 'supervisor', 'admin'],
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,            // { access, refresh }
      user: null,             // { id, username, email?, nombre?, roles: [] }
      isAuthenticated: false,

      login: async ({ username, password }) => {
        if (USE_DUMMY) {
          const uname = String(username || '').toLowerCase()
          const roles = dummyRoleMap[uname] || ['recepcion']
          set({
            token: { access: 'dummy-access', refresh: 'dummy-refresh' },
            user: { id: 1, username: uname, nombre: 'Usuario Demo', roles },
            isAuthenticated: true,
          })
          return
        }

        // Djoser SimpleJWT: { username, password } → { access, refresh }
        const { data } = await api.post(LOGIN_PATH, { username, password })
        if (!data?.access || !data?.refresh) {
          throw new Error('No se recibieron tokens válidos')
        }
        set({ token: { access: data.access, refresh: data.refresh } })

        // Perfil
        const me = await api.get(ME_PATH)
        const user = me?.data || {}
        // Garantiza roles para guards si tu backend aún no los expone:
        user.roles = Array.isArray(user.roles) && user.roles.length ? user.roles : ['recepcion']

        set({ user, isAuthenticated: true })
      },

      logout: () => set({ token: null, user: null, isAuthenticated: false }),

      refreshToken: async () => {
        const current = get().token
        if (!current?.refresh) throw new Error('No refresh token')
        const { data } = await api.post(REFRESH_PATH, { refresh: current.refresh })
        if (!data?.access) throw new Error('No se recibió nuevo access token')
        set({ token: { ...current, access: data.access } })
        return data.access
      },

      hasAnyRole: (roles = []) => {
        const u = get().user
        if (!u?.roles?.length) return false
        if (!roles.length) return true
        return roles.some((r) => u.roles.includes(r))
      },
    }),
    {
      name: 'sisvisitas-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
)
