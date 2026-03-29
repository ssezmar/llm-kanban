// ── GitHub API response types ──

export interface GitHubUser {
  id: number
  login: string
  avatar_url: string
  html_url: string
  name: string | null
  bio: string | null
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  private: boolean
  default_branch: string
  open_issues_count: number
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
}

export interface GitHubLabel {
  id: number
  name: string
  color: string
  description: string | null
}

export interface GitHubMilestone {
  id: number
  title: string
  state: 'open' | 'closed'
  due_on: string | null
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  html_url: string
  user: GitHubUser
  assignees: GitHubUser[]
  labels: GitHubLabel[]
  milestone: GitHubMilestone | null
  comments: number
  created_at: string
  updated_at: string
  closed_at: string | null
  pull_request?: { url: string } // present if this is a PR disguised as issue
}

export interface GitHubComment {
  id: number
  body: string
  user: GitHubUser
  created_at: string
  updated_at: string
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  html_url: string
  user: GitHubUser
  head: { ref: string; sha: string; repo: { full_name: string } | null }
  base: { ref: string; sha: string }
  merged: boolean
  mergeable: boolean | null
  mergeable_state: string
  draft: boolean
  assignees: GitHubUser[]
  labels: GitHubLabel[]
  requested_reviewers: GitHubUser[]
  comments: number
  review_comments: number
  commits: number
  additions: number
  deletions: number
  changed_files: number
  created_at: string
  updated_at: string
  merged_at: string | null
  closed_at: string | null
}

export interface GitHubReview {
  id: number
  user: GitHubUser
  body: string | null
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING'
  submitted_at: string
  html_url: string
}

export interface GitHubCheckRun {
  id: number
  name: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null
  html_url: string
  started_at: string | null
  completed_at: string | null
}

// ── GitHub Actions ──

export interface GitHubWorkflow {
  id: number
  name: string
  path: string
  state: 'active' | 'disabled_manually' | 'disabled_inactivity'
  html_url: string
  badge_url: string
  created_at: string
  updated_at: string
}

export type WorkflowRunStatus = 'queued' | 'in_progress' | 'completed' | 'waiting'
export type WorkflowRunConclusion = 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | 'stale' | null

export interface GitHubWorkflowRun {
  id: number
  name: string
  workflow_id: number
  status: WorkflowRunStatus
  conclusion: WorkflowRunConclusion
  html_url: string
  run_number: number
  event: string
  head_branch: string
  head_sha: string
  display_title: string
  created_at: string
  updated_at: string
  run_started_at: string | null
  actor: GitHubUser
  triggering_actor: GitHubUser
}

export type JobStatus = 'queued' | 'in_progress' | 'completed' | 'waiting'
export type JobConclusion = 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null

export interface GitHubJobStep {
  name: string
  status: JobStatus
  conclusion: JobConclusion
  number: number
  started_at: string | null
  completed_at: string | null
}

export interface GitHubWorkflowJob {
  id: number
  run_id: number
  name: string
  status: JobStatus
  conclusion: JobConclusion
  html_url: string
  started_at: string | null
  completed_at: string | null
  steps: GitHubJobStep[]
  runner_name: string | null
}

// ── API helpers ──

export interface GitHubApiError {
  message: string
  status: number
  documentation_url?: string
}

export interface GitHubRateLimit {
  limit: number
  remaining: number
  reset: number
}
