import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiClient from '../api/client'

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setAuth: (user: User, token: string) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const res = await apiClient.post('/login', { email, password })
        const token = res.data.token
        localStorage.setItem('admin_token', token)
        set({
          user: res.data.user,
          token: token,
          isAuthenticated: true,
        })
      },
      logout: () => {
        localStorage.removeItem('admin_token')
        set({ user: null, token: null, isAuthenticated: false })
      },
      setAuth: (user, token) => {
        localStorage.setItem('admin_token', token)
        set({ user, token, isAuthenticated: true })
      },
    }),
    {
      name: 'admin-auth-storage',
    }
  )
)
