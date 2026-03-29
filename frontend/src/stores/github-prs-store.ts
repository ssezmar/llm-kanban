import { create } from 'zustand'
import type { GitHubPullRequest, GitHubReview, GitHubCheckRun } from '@/lib/github-types'
import * as api from '@/lib/github-api'
import { useGitHubStore } from './github-store'

interface GitHubPRsState {
  pullRequests: GitHubPullRequest[]
  selectedPR: GitHubPullRequest | null
  reviews: GitHubReview[]
  checks: GitHubCheckRun[]
  isLoading: boolean
  error: string | null
  filter: 'open' | 'closed' | 'all'

  setFilter: (f: 'open' | 'closed' | 'all') => void
  fetchAll: () => Promise<void>
  fetchOne: (number: number) => Promise<void>
  clearSelection: () => void
}

function getConn() {
  const { token, owner, repo, isConnected } = useGitHubStore.getState()
  if (!isConnected || !token || !owner || !repo) return null
  return { token, owner, repo }
}

export const useGitHubPRsStore = create<GitHubPRsState>()((set, get) => ({
  pullRequests: [],
  selectedPR: null,
  reviews: [],
  checks: [],
  isLoading: false,
  error: null,
  filter: 'open',

  setFilter: (f) => { set({ filter: f }); get().fetchAll() },

  fetchAll: async () => {
    const c = getConn()
    if (!c) return
    set({ isLoading: true, error: null })
    try {
      const prs = await api.fetchPullRequests(c.token, c.owner, c.repo, get().filter)
      set({ pullRequests: prs, isLoading: false })
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to load PRs', isLoading: false })
    }
  },

  fetchOne: async (number) => {
    const c = getConn()
    if (!c) return
    set({ isLoading: true, error: null })
    try {
      const [pr, reviews] = await Promise.all([
        api.fetchPullRequest(c.token, c.owner, c.repo, number),
        api.fetchPRReviews(c.token, c.owner, c.repo, number),
      ])
      let checks: GitHubCheckRun[] = []
      try {
        const res = await api.fetchPRChecks(c.token, c.owner, c.repo, pr.head.sha)
        checks = res.check_runs
      } catch { /* no checks */ }
      set({ selectedPR: pr, reviews, checks, isLoading: false })
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to load PR', isLoading: false })
    }
  },

  clearSelection: () => set({ selectedPR: null, reviews: [], checks: [] }),
}))
