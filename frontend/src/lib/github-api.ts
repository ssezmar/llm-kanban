import type {
  GitHubUser, GitHubRepo, GitHubIssue, GitHubLabel, GitHubComment,
  GitHubPullRequest, GitHubReview, GitHubCheckRun,
  GitHubWorkflow, GitHubWorkflowRun, GitHubWorkflowJob,
  GitHubRateLimit,
} from './github-types'

const BASE = 'https://api.github.com'

let lastRateLimit: GitHubRateLimit | null = null
export function getRateLimit() { return lastRateLimit }

async function ghFetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...init?.headers,
    },
  })

  const remaining = res.headers.get('x-ratelimit-remaining')
  const limit = res.headers.get('x-ratelimit-limit')
  const reset = res.headers.get('x-ratelimit-reset')
  if (remaining && limit && reset) {
    lastRateLimit = { remaining: +remaining, limit: +limit, reset: +reset }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }))
    throw Object.assign(new Error(body.message || res.statusText), { status: res.status })
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Auth ──

export const fetchCurrentUser = (token: string) =>
  ghFetch<GitHubUser>(token, '/user')

// ── Repos ──

export const fetchRepo = (token: string, owner: string, repo: string) =>
  ghFetch<GitHubRepo>(token, `/repos/${owner}/${repo}`)

// ── Issues ──

export const fetchIssues = (token: string, owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open', page = 1) =>
  ghFetch<GitHubIssue[]>(token, `/repos/${owner}/${repo}/issues?state=${state}&per_page=30&page=${page}&sort=updated&direction=desc`)

export const fetchIssue = (token: string, owner: string, repo: string, number: number) =>
  ghFetch<GitHubIssue>(token, `/repos/${owner}/${repo}/issues/${number}`)

export const fetchIssueComments = (token: string, owner: string, repo: string, number: number) =>
  ghFetch<GitHubComment[]>(token, `/repos/${owner}/${repo}/issues/${number}/comments?per_page=50`)

export const createIssue = (token: string, owner: string, repo: string, data: { title: string; body?: string; labels?: string[]; assignees?: string[] }) =>
  ghFetch<GitHubIssue>(token, `/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

export const updateIssue = (token: string, owner: string, repo: string, number: number, data: Partial<{ title: string; body: string; state: 'open' | 'closed'; labels: string[]; assignees: string[] }>) =>
  ghFetch<GitHubIssue>(token, `/repos/${owner}/${repo}/issues/${number}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

export const createIssueComment = (token: string, owner: string, repo: string, number: number, body: string) =>
  ghFetch<GitHubComment>(token, `/repos/${owner}/${repo}/issues/${number}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })

// ── Labels ──

export const fetchLabels = (token: string, owner: string, repo: string) =>
  ghFetch<GitHubLabel[]>(token, `/repos/${owner}/${repo}/labels?per_page=100`)

// ── Collaborators ──

export const fetchCollaborators = (token: string, owner: string, repo: string) =>
  ghFetch<GitHubUser[]>(token, `/repos/${owner}/${repo}/collaborators?per_page=50`)

// ── Pull Requests ──

export const fetchPullRequests = (token: string, owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open', page = 1) =>
  ghFetch<GitHubPullRequest[]>(token, `/repos/${owner}/${repo}/pulls?state=${state}&per_page=30&page=${page}&sort=updated&direction=desc`)

export const fetchPullRequest = (token: string, owner: string, repo: string, number: number) =>
  ghFetch<GitHubPullRequest>(token, `/repos/${owner}/${repo}/pulls/${number}`)

export const fetchPRReviews = (token: string, owner: string, repo: string, number: number) =>
  ghFetch<GitHubReview[]>(token, `/repos/${owner}/${repo}/pulls/${number}/reviews`)

export const fetchPRChecks = (token: string, owner: string, repo: string, ref: string) =>
  ghFetch<{ total_count: number; check_runs: GitHubCheckRun[] }>(token, `/repos/${owner}/${repo}/commits/${ref}/check-runs`)

// ── Workflows & Actions ──

export const fetchWorkflows = (token: string, owner: string, repo: string) =>
  ghFetch<{ total_count: number; workflows: GitHubWorkflow[] }>(token, `/repos/${owner}/${repo}/actions/workflows`)

export const fetchWorkflowRuns = (token: string, owner: string, repo: string, params?: { workflow_id?: number; page?: number; per_page?: number }) => {
  const p = new URLSearchParams()
  if (params?.page) p.set('page', String(params.page))
  p.set('per_page', String(params?.per_page ?? 20))
  const base = params?.workflow_id
    ? `/repos/${owner}/${repo}/actions/workflows/${params.workflow_id}/runs`
    : `/repos/${owner}/${repo}/actions/runs`
  return ghFetch<{ total_count: number; workflow_runs: GitHubWorkflowRun[] }>(token, `${base}?${p}`)
}

export const fetchWorkflowRun = (token: string, owner: string, repo: string, runId: number) =>
  ghFetch<GitHubWorkflowRun>(token, `/repos/${owner}/${repo}/actions/runs/${runId}`)

export const fetchRunJobs = (token: string, owner: string, repo: string, runId: number) =>
  ghFetch<{ total_count: number; jobs: GitHubWorkflowJob[] }>(token, `/repos/${owner}/${repo}/actions/runs/${runId}/jobs`)

export const rerunWorkflow = (token: string, owner: string, repo: string, runId: number) =>
  ghFetch<void>(token, `/repos/${owner}/${repo}/actions/runs/${runId}/rerun`, { method: 'POST' })

export const cancelWorkflowRun = (token: string, owner: string, repo: string, runId: number) =>
  ghFetch<void>(token, `/repos/${owner}/${repo}/actions/runs/${runId}/cancel`, { method: 'POST' })
