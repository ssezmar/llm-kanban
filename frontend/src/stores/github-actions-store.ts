import { create } from 'zustand'
import type { GitHubWorkflow, GitHubWorkflowRun, GitHubWorkflowJob } from '@/lib/github-types'
import * as api from '@/lib/github-api'
import { useGitHubStore } from './github-store'

interface GitHubActionsState {
  workflows: GitHubWorkflow[]
  runs: GitHubWorkflowRun[]
  jobs: Record<number, GitHubWorkflowJob[]> // keyed by run ID
  selectedRunId: number | null
  isLoading: boolean
  error: string | null
  pollingInterval: ReturnType<typeof setInterval> | null

  fetchWorkflows: () => Promise<void>
  fetchRuns: (workflowId?: number) => Promise<void>
  fetchJobs: (runId: number) => Promise<void>
  rerun: (runId: number) => Promise<void>
  cancel: (runId: number) => Promise<void>
  selectRun: (runId: number | null) => void
  startPolling: (intervalMs?: number) => void
  stopPolling: () => void
}

function getConn() {
  const { token, owner, repo, isConnected } = useGitHubStore.getState()
  if (!isConnected || !token || !owner || !repo) return null
  return { token, owner, repo }
}

export const useGitHubActionsStore = create<GitHubActionsState>()((set, get) => ({
  workflows: [],
  runs: [],
  jobs: {},
  selectedRunId: null,
  isLoading: false,
  error: null,
  pollingInterval: null,

  fetchWorkflows: async () => {
    const c = getConn()
    if (!c) return
    set({ isLoading: true, error: null })
    try {
      const res = await api.fetchWorkflows(c.token, c.owner, c.repo)
      set({ workflows: res.workflows, isLoading: false })
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to load workflows', isLoading: false })
    }
  },

  fetchRuns: async (workflowId) => {
    const c = getConn()
    if (!c) return
    set({ isLoading: true, error: null })
    try {
      const res = await api.fetchWorkflowRuns(c.token, c.owner, c.repo, { workflow_id: workflowId, per_page: 20 })
      set({ runs: res.workflow_runs, isLoading: false })
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to load runs', isLoading: false })
    }
  },

  fetchJobs: async (runId) => {
    const c = getConn()
    if (!c) return
    try {
      const res = await api.fetchRunJobs(c.token, c.owner, c.repo, runId)
      set((s) => ({ jobs: { ...s.jobs, [runId]: res.jobs } }))
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to load jobs' })
    }
  },

  rerun: async (runId) => {
    const c = getConn()
    if (!c) return
    try {
      await api.rerunWorkflow(c.token, c.owner, c.repo, runId)
      // Refetch after a short delay to pick up new run
      setTimeout(() => get().fetchRuns(), 2000)
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to rerun' })
    }
  },

  cancel: async (runId) => {
    const c = getConn()
    if (!c) return
    try {
      await api.cancelWorkflowRun(c.token, c.owner, c.repo, runId)
      setTimeout(() => get().fetchRuns(), 1000)
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to cancel' })
    }
  },

  selectRun: (runId) => {
    set({ selectedRunId: runId })
    if (runId) get().fetchJobs(runId)
  },

  startPolling: (intervalMs = 10000) => {
    get().stopPolling()
    const id = setInterval(() => {
      get().fetchRuns()
      const { selectedRunId } = get()
      if (selectedRunId) get().fetchJobs(selectedRunId)
    }, intervalMs)
    set({ pollingInterval: id })
  },

  stopPolling: () => {
    const { pollingInterval } = get()
    if (pollingInterval) {
      clearInterval(pollingInterval)
      set({ pollingInterval: null })
    }
  },
}))
