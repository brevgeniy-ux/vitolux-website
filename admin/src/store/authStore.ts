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
        set({
          user: res.data.user,
          token: res.data.token,
          isAuthenticated: true,
        })
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        delete apiClient.defaults.headers.common['Authorization']
      },
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true })
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },
    }),
    {
      name: 'admin-auth-storage',
    }
  )
)
