import { create } from 'zustand'
import type { GitHubIssue, GitHubLabel, GitHubComment } from '@/lib/github-types'
import * as api from '@/lib/github-api'
import { useGitHubStore } from './github-store'

interface GitHubIssuesState {
  issues: GitHubIssue[]
  labels: GitHubLabel[]
  selectedIssue: GitHubIssue | null
  selectedComments: GitHubComment[]
  isLoading: boolean
  error: string | null
  filter: 'open' | 'closed' | 'all'

  setFilter: (f: 'open' | 'closed' | 'all') => void
  fetchAll: () => Promise<void>
  fetchOne: (number: number) => Promise<void>
  fetchLabels: () => Promise<void>
  create: (title: string, body?: string, labels?: string[], assignees?: string[]) => Promise<GitHubIssue | null>
  update: (number: number, data: Partial<{ title: string; body: string; state: 'open' | 'closed'; labels: string[]; assignees: string[] }>) => Promise<void>
  addComment: (number: number, body: string) => Promise<void>
  clearSelection: () => void
}

function getConn() {
  const { token, owner, repo, isConnected } = useGitHubStore.getState()
  if (!isConnected || !token || !owner || !repo) return null
  return { token, owner, repo }
}

export const useGitHubIssuesStore = create<GitHubIssuesState>()((set, get) => ({
  issues: [],
  labels: [],
  selectedIssue: null,
  selectedComments: [],
  isLoading: false,
  error: null,
  filter: 'open',

  setFilter: (f) => { set({ filter: f }); get().fetchAll() },

  fetchAll: async () => {
    const c = getConn()
    if (!c) return
    set({ isLoading: true, error: null })
    try {
      const issues = await api.fetchIssues(c.token, c.owner, c.repo, get().filter)
      // Filter out PRs (GitHub returns PRs in issues endpoint)
      set({ issues: issues.filter(i => !i.pull_request), isLoading: false })
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to load issues', isLoading: false })
    }
  },

  fetchOne: async (number) => {
    const c = getConn()
    if (!c) return
    set({ isLoading: true, error: null })
    try {
      const [issue, comments] = await Promise.all([
        api.fetchIssue(c.token, c.owner, c.repo, number),
        api.fetchIssueComments(c.token, c.owner, c.repo, number),
      ])
      set({ selectedIssue: issue, selectedComments: comments, isLoading: false })
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to load issue', isLoading: false })
    }
  },

  fetchLabels: async () => {
    const c = getConn()
    if (!c) return
    try {
      const labels = await api.fetchLabels(c.token, c.owner, c.repo)
      set({ labels })
    } catch { /* silent */ }
  },

  create: async (title, body, labels, assignees) => {
    const c = getConn()
    if (!c) return null
    try {
      const issue = await api.createIssue(c.token, c.owner, c.repo, { title, body, labels, assignees })
      set((s) => ({ issues: [issue, ...s.issues] }))
      return issue
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to create issue' })
      return null
    }
  },

  update: async (number, data) => {
    const c = getConn()
    if (!c) return
    try {
      const updated = await api.updateIssue(c.token, c.owner, c.repo, number, data)
      set((s) => ({
        issues: s.issues.map(i => i.number === number ? updated : i),
        selectedIssue: s.selectedIssue?.number === number ? updated : s.selectedIssue,
      }))
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to update issue' })
    }
  },

  addComment: async (number, body) => {
    const c = getConn()
    if (!c) return
    try {
      const comment = await api.createIssueComment(c.token, c.owner, c.repo, number, body)
      set((s) => ({ selectedComments: [...s.selectedComments, comment] }))
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to add comment' })
    }
  },

  clearSelection: () => set({ selectedIssue: null, selectedComments: [] }),
}))
