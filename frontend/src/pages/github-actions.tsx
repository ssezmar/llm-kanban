import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGitHubStore } from '@/stores/github-store'
import { useGitHubActionsStore } from '@/stores/github-actions-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHero } from '@/components/page-hero'
import {
  Play, Loader2, AlertTriangle, CheckCircle2, XCircle, Clock,
  RefreshCw, GitBranch, GitCommitHorizontal, ChevronDown, ChevronRight,
  RotateCcw, Ban, ExternalLink, Timer, Workflow,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GitHubWorkflowRun, GitHubWorkflowJob, WorkflowRunConclusion, WorkflowRunStatus } from '@/lib/github-types'

const runStatusIcon = (status: WorkflowRunStatus, conclusion: WorkflowRunConclusion) => {
  if (status === 'completed') {
    if (conclusion === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (conclusion === 'failure') return <XCircle className="h-4 w-4 text-red-500" />
    if (conclusion === 'cancelled') return <Ban className="h-4 w-4 text-muted-foreground" />
    return <Clock className="h-4 w-4 text-muted-foreground" />
  }
  if (status === 'in_progress') return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
  if (status === 'queued' || status === 'waiting') return <Clock className="h-4 w-4 text-yellow-500" />
  return <Clock className="h-4 w-4 text-muted-foreground" />
}

const runStatusBadge = (status: WorkflowRunStatus, conclusion: WorkflowRunConclusion) => {
  if (status === 'completed') {
    if (conclusion === 'success') return 'border-green-500/30 text-green-500 bg-green-500/10'
    if (conclusion === 'failure') return 'border-red-500/30 text-red-500 bg-red-500/10'
    if (conclusion === 'cancelled') return ''
    return ''
  }
  if (status === 'in_progress') return 'border-blue-500/30 text-blue-500 bg-blue-500/10'
  return 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10'
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '—'
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  const diff = Math.floor((e - s) / 1000)
  if (diff < 60) return `${diff}s`
  const m = Math.floor(diff / 60)
  const sec = diff % 60
  return `${m}m ${sec}s`
}

function JobsList({ jobs, runId }: { jobs: GitHubWorkflowJob[]; runId: number }) {
  return (
    <div className="space-y-1.5 pl-6 border-l border-border ml-2 mt-3">
      {jobs.map(job => (
        <div key={job.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
          {job.status === 'completed' ? (
            job.conclusion === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" /> :
            job.conclusion === 'failure' ? <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" /> :
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : job.status === 'in_progress' ? (
            <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin shrink-0" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          )}
          <span className="text-sm flex-1">{job.name}</span>
          <span className="text-xs text-muted-foreground font-mono">
            {formatDuration(job.started_at, job.completed_at)}
          </span>
          {job.steps && job.steps.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {job.steps.filter(s => s.conclusion === 'success').length}/{job.steps.length} steps
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export function GitHubActionsPage() {
  const navigate = useNavigate()
  const { isConnected } = useGitHubStore()
  const {
    workflows, runs, jobs, isLoading, error, selectedRunId,
    fetchWorkflows, fetchRuns, fetchJobs, selectRun, rerun, cancel,
    startPolling, stopPolling,
  } = useGitHubActionsStore()
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | undefined>()
  const [expandedRuns, setExpandedRuns] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (isConnected) {
      fetchWorkflows()
      fetchRuns()
      startPolling(15000)
    }
    return () => stopPolling()
  }, [isConnected])

  const toggleExpand = (runId: number) => {
    setExpandedRuns(prev => {
      const next = new Set(prev)
      if (next.has(runId)) { next.delete(runId) } else {
        next.add(runId)
        if (!jobs[runId]) fetchJobs(runId)
      }
      return next
    })
  }

  const handleWorkflowFilter = (wfId?: number) => {
    setSelectedWorkflow(wfId)
    fetchRuns(wfId)
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-fade-in-up">
        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">Connect a GitHub repository first</p>
        <Button variant="outline" onClick={() => navigate('/github/settings')}>Go to Settings</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      <PageHero>
        <div className="flex items-center gap-3 mb-2">
          <Play className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">GitHub Actions</h1>
        </div>
        <p className="text-sm text-muted-foreground">Monitor workflows, runs and jobs</p>
      </PageHero>

      {/* Workflow filter */}
      {workflows.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={!selectedWorkflow ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleWorkflowFilter()}
          >
            <Workflow className="h-3.5 w-3.5 mr-1.5" />
            All Workflows
          </Button>
          {workflows.map(wf => (
            <Button
              key={wf.id}
              variant={selectedWorkflow === wf.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleWorkflowFilter(wf.id)}
            >
              {wf.name}
            </Button>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {isLoading && !runs.length && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Runs list */}
      <div className="space-y-2">
        {runs.map(run => {
          const expanded = expandedRuns.has(run.id)
          const runJobs = jobs[run.id]
          return (
            <Card key={run.id} className="transition-all duration-200">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">
                    {runStatusIcon(run.status, run.conclusion)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        className="font-semibold text-sm hover:underline text-left"
                        onClick={() => toggleExpand(run.id)}
                      >
                        {run.display_title || run.name}
                      </button>
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', runStatusBadge(run.status, run.conclusion))}>
                        {run.conclusion || run.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {run.event}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">#{run.run_number}</span>
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        {run.head_branch}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <GitCommitHorizontal className="h-3 w-3" />
                        {run.head_sha.slice(0, 7)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {formatDuration(run.run_started_at || run.created_at, run.status === 'completed' ? run.updated_at : null)}
                      </span>
                      <span>{new Date(run.created_at).toLocaleString()}</span>
                    </div>

                    {/* Expanded jobs */}
                    {expanded && runJobs && <JobsList jobs={runJobs} runId={run.id} />}
                    {expanded && !runJobs && (
                      <div className="flex items-center gap-2 py-3 pl-6 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading jobs...
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(run.id)}>
                      {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </Button>
                    {run.status === 'completed' && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => rerun(run.id)} title="Re-run">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {(run.status === 'in_progress' || run.status === 'queued') && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => cancel(run.id)} title="Cancel">
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <a href={run.html_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!isLoading && !runs.length && (
        <p className="text-center text-sm text-muted-foreground py-12">No workflow runs found</p>
      )}
    </div>
  )
}
