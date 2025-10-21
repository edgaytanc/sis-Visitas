import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from '../api/axios'

const USE_DUMMY = (import.meta.env.VITE_USE_DUMMY_AUTH || 'false').toLowerCase() === 'true'
const LOGIN_PATH = import.meta.env.VITE_AUTH_LOGIN_PATH || '/api/auth/jwt/create/'
const REFRESH_PATH = import.meta.env.VITE_AUTH_REFRESH_PATH || '/api/auth/jwt/refresh/'
const ME_PATH = import.meta.env.VITE_AUTH_ME_PATH || '/api/users/me'

// Roles dummy por username (solo para desarrollo)
const dummyRoleMap = {
  recepcion: ['recepcion'],
  supervisor: ['supervisor'],
  admin: ['admin'],
  multi: ['recepcion', 'supervisor', 'admin'],
}

// Mapeo de nombres de grupo (Django) -> roles del FE
// Ajusta aquí si tus nombres de grupos en Django son diferentes
const GROUP_TO_ROLE = {
  'recepcion': 'recepcion',
  'recepción': 'recepcion',
  'supervisor': 'supervisor',
  'supervisión': 'supervisor',
  'admin': 'admin',
  'administrador': 'admin',
  'administración': 'admin',
}

function mapGroupsToRoles(groups = []) {
  const roles = (groups || [])
    .map((g) => String(g || '').trim().toLowerCase())
    .map((g) => GROUP_TO_ROLE[g] || g) // si no hay mapeo, usa el nombre tal cual (ya en minúscula)
    .filter(Boolean)

  // Evita duplicados
  return Array.from(new Set(roles))
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,            // { access, refresh }
      user: null,             // { id, username, first_name, last_name, email, roles: [] }
      isAuthenticated: false,

      login: async ({ username, password }) => {
        if (USE_DUMMY) {
          const uname = String(username || '').toLowerCase()
          const roles = dummyRoleMap[uname] || ['recepcion']
          set({
            token: { access: 'dummy-access', refresh: 'dummy-refresh' },
            user: { id: 1, username: uname, first_name: 'Usuario', last_name: 'Demo', roles },
            isAuthenticated: true,
          })
          return
        }

        // Login real -> tokens
        const { data } = await api.post(LOGIN_PATH, { username, password })
        if (!data?.access || !data?.refresh) {
          throw new Error('No se recibieron tokens válidos')
        }
        set({ token: { access: data.access, refresh: data.refresh } })

        // Perfil real
        const me = await api.get(ME_PATH)
        const rawUser = me?.data || {}

        // rawUser.groups viene del serializer (lista de nombres de grupo)
        const roles = mapGroupsToRoles(rawUser.groups)

        const user = {
          id: rawUser.id,
          username: rawUser.username,
          first_name: rawUser.first_name,
          last_name: rawUser.last_name,
          email: rawUser.email,
          roles: roles.length ? roles : ['recepcion'], // fallback si no trae grupos
        }

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
