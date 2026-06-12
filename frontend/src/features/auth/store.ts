import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, Role } from './types'

interface AuthState {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void
  setUser: (user: AuthUser) => void
  logout: () => void
  hasRole: (roles: Role[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (token, refreshToken, user) => {
        localStorage.setItem('access_token', token)
        set({ token, refreshToken, user, isAuthenticated: true })
      },

      setUser: (user) => {
        set({ user })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false })
      },

      hasRole: (roles) => {
        const { user } = get()
        if (!user) return false
        return user.roles.some((r) => roles.includes(r))
      },
    }),
    {
      name: 'clinic-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
