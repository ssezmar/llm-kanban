import { create } from 'zustand'
import type { User } from '@/lib/types'
import { mockUsers } from '@/lib/mock-data'

interface UsersState {
  users: User[]
  getUser: (id: string) => User | undefined
}

export const useUsersStore = create<UsersState>()((set, get) => ({
  users: mockUsers,
  getUser: (id) => get().users.find((u) => u.id === id),
}))
