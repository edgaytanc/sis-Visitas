import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  login: async ({ email }) => {
    // FE-01: login dummy. En FE siguientes conectaremos con backend.
    set({ isAuthenticated: true, user: { email } })
  },
  logout: () => set({ isAuthenticated: false, user: null })
}))
