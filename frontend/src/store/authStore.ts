import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
  zone_id?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        if (token) localStorage.setItem('token', token)
        if (user) localStorage.setItem('user', JSON.stringify(user))
        set({ user: user || null, token: token || null, isAuthenticated: !!(user && token) })
      },
      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const token = localStorage.getItem('token')
          const userStr = localStorage.getItem('user')
          if (token && userStr) {
            try {
              const user = JSON.parse(userStr)
              state.user = user
              state.token = token
              state.isAuthenticated = true
            } catch (e) {
              console.error('Failed to parse user from storage', e)
            }
          }
        }
      },
    }
  )
)

