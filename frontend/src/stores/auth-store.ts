import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/types'
import { mockUsers } from '@/lib/mock-data'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => boolean
  register: (name: string, email: string, password: string) => boolean
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
}

const MOCK_CREDENTIALS: { email: string; password: string }[] = [
  { email: 'admin@llmkanban.ru', password: 'admin123' },
  { email: 'a.kozlov@llmkanban.ru', password: 'dev123' },
  { email: 'm.sidorova@llmkanban.ru', password: 'dev123' },
  { email: 'd.volkov@llmkanban.ru', password: 'dev123' },
  { email: 'e.novikova@llmkanban.ru', password: 'dev123' },
]

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (email: string, password: string) => {
        // Check mock credentials
        const cred = MOCK_CREDENTIALS.find((c) => c.email === email && c.password === password)
        if (cred) {
          const user = mockUsers.find((u) => u.email === email)
          if (user) {
            set({ user, isAuthenticated: true })
            return true
          }
        }
        // Check registered users
        const stored = JSON.parse(localStorage.getItem('registered_users') || '[]') as { email: string; password: string; user: User }[]
        const found = stored.find((u) => u.email === email && u.password === password)
        if (found) {
          set({ user: found.user, isAuthenticated: true })
          return true
        }
        return false
      },

      register: (name: string, email: string, password: string) => {
        const allEmails = [...mockUsers.map((u) => u.email)]
        const stored = JSON.parse(localStorage.getItem('registered_users') || '[]') as { email: string; password: string; user: User }[]
        allEmails.push(...stored.map((u) => u.email))

        if (allEmails.includes(email)) return false

        const newUser: User = {
          id: `user-${Date.now()}`,
          name,
          email,
          role: 'developer',
          avatar: name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
          bio: '',
          position: '',
          joinedAt: Date.now(),
        }
        stored.push({ email, password, user: newUser })
        localStorage.setItem('registered_users', JSON.stringify(stored))
        set({ user: newUser, isAuthenticated: true })
        return true
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      },

      updateProfile: (updates) => {
        const { user } = get()
        if (!user) return
        const updated = { ...user, ...updates }
        set({ user: updated })

        // Also update in registered_users if not a mock user
        if (!mockUsers.find((u) => u.id === user.id)) {
          const stored = JSON.parse(localStorage.getItem('registered_users') || '[]') as { email: string; password: string; user: User }[]
          const idx = stored.findIndex((s) => s.user.id === user.id)
          if (idx >= 0) {
            stored[idx].user = updated
            localStorage.setItem('registered_users', JSON.stringify(stored))
          }
        }
      },
    }),
    { name: 'auth-storage' }
  )
)
