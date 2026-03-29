import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GitHubUser, GitHubRepo } from '@/lib/github-types'
import { fetchCurrentUser, fetchRepo, getRateLimit } from '@/lib/github-api'

interface GitHubState {
  token: string | null
  owner: string | null
  repo: string | null
  user: GitHubUser | null
  repoInfo: GitHubRepo | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  rateLimitRemaining: number | null

  connect: (token: string, owner: string, repo: string) => Promise<boolean>
  disconnect: () => void
  setRepo: (owner: string, repo: string) => Promise<boolean>
  refreshRateLimit: () => void
}

export const useGitHubStore = create<GitHubState>()(
  persist(
    (set, get) => ({
      token: null,
      owner: null,
      repo: null,
      user: null,
      repoInfo: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      rateLimitRemaining: null,

      connect: async (token, owner, repo) => {
        set({ isConnecting: true, error: null })
        try {
          const [user, repoInfo] = await Promise.all([
            fetchCurrentUser(token),
            fetchRepo(token, owner, repo),
          ])
          const rl = getRateLimit()
          set({
            token, owner, repo, user, repoInfo,
            isConnected: true, isConnecting: false,
            rateLimitRemaining: rl?.remaining ?? null,
          })
          return true
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Connection failed'
          set({ isConnecting: false, error: msg, isConnected: false })
          return false
        }
      },

      disconnect: () => {
        set({
          token: null, owner: null, repo: null,
          user: null, repoInfo: null,
          isConnected: false, error: null, rateLimitRemaining: null,
        })
      },

      setRepo: async (owner, repo) => {
        const { token } = get()
        if (!token) return false
        set({ isConnecting: true, error: null })
        try {
          const repoInfo = await fetchRepo(token, owner, repo)
          set({ owner, repo, repoInfo, isConnecting: false })
          return true
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Repo not found'
          set({ isConnecting: false, error: msg })
          return false
        }
      },

      refreshRateLimit: () => {
        const rl = getRateLimit()
        if (rl) set({ rateLimitRemaining: rl.remaining })
      },
    }),
    { name: 'github-storage' },
  ),
)
