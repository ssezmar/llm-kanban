import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGitHubStore } from '@/stores/github-store'
import { useGitHubPRsStore } from '@/stores/github-prs-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft, GitPullRequest, GitMerge, ExternalLink, Loader2,
  CheckCircle2, XCircle, MessageSquare, FileCode, Clock, User,
  GitBranch, AlertCircle, Eye, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const reviewStateConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  APPROVED: { icon: CheckCircle2, color: 'text-green-500', label: 'Approved' },
  CHANGES_REQUESTED: { icon: AlertCircle, color: 'text-orange-500', label: 'Changes Requested' },
  COMMENTED: { icon: MessageSquare, color: 'text-muted-foreground', label: 'Commented' },
  DISMISSED: { icon: XCircle, color: 'text-muted-foreground', label: 'Dismissed' },
  PENDING: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
}

const checkConclusion: Record<string, { color: string; label: string }> = {
  success: { color: 'text-green-500', label: 'Passed' },
  failure: { color: 'text-red-500', label: 'Failed' },
  neutral: { color: 'text-muted-foreground', label: 'Neutral' },
  cancelled: { color: 'text-muted-foreground', label: 'Cancelled' },
  skipped: { color: 'text-muted-foreground', label: 'Skipped' },
  timed_out: { color: 'text-orange-500', label: 'Timed Out' },
}

export function GitHubPRDetailPage() {
  const { number } = useParams<{ number: string }>()
  const navigate = useNavigate()
  const { isConnected } = useGitHubStore()
  const { selectedPR: pr, reviews, checks, isLoading, fetchOne, clearSelection } = useGitHubPRsStore()

  useEffect(() => {
    if (isConnected && number) fetchOne(+number)
    return () => clearSelection()
  }, [isConnected, number])

  if (isLoading || !pr) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalLines = pr.additions + pr.deletions
  const addPct = totalLines > 0 ? Math.round((pr.additions / totalLines) * 100) : 50

  return (
    <div className="space-y-6 pb-12 max-w-3xl animate-fade-in-up">
      <Button variant="ghost" size="sm" onClick={() => navigate('/github/prs')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Pull Requests
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {pr.merged ? (
            <GitMerge className="h-5 w-5 text-purple-500 mt-1 shrink-0" />
          ) : pr.state === 'open' ? (
            <GitPullRequest className="h-5 w-5 text-green-500 mt-1 shrink-0" />
          ) : (
            <GitPullRequest className="h-5 w-5 text-red-500 mt-1 shrink-0" />
          )}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{pr.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <span className="font-mono">#{pr.number}</span>
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {pr.user.login}
              </span>
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded flex items-center gap-1.5">
                <GitBranch className="h-3 w-3" />
                {pr.head.ref} → {pr.base.ref}
              </span>
              {pr.draft && <Badge variant="outline" className="text-[10px]">Draft</Badge>}
            </div>
          </div>
        </div>

        {/* Labels */}
        {pr.labels.length > 0 && (
          <div className="flex gap-2 flex-wrap pl-8">
            {pr.labels.map(l => (
              <Badge key={l.id} variant="outline" className="text-xs" style={{
                borderColor: `#${l.color}40`, color: `#${l.color}`, backgroundColor: `#${l.color}10`,
              }}>{l.name}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <a href={pr.html_url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Open on GitHub
          </Button>
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: FileCode, label: 'Files', value: pr.changed_files },
          { icon: GitBranch, label: 'Commits', value: pr.commits },
          { label: 'Additions', value: `+${pr.additions}`, color: 'text-green-500' },
          { label: 'Deletions', value: `-${pr.deletions}`, color: 'text-red-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="py-3 text-center">
              {Icon && <Icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />}
              <p className={cn('text-lg font-bold font-mono', color)}>{value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Change bar */}
      <div className="h-2 rounded-full overflow-hidden flex bg-muted">
        <div className="bg-green-500 transition-all" style={{ width: `${addPct}%` }} />
        <div className="bg-red-500 transition-all" style={{ width: `${100 - addPct}%` }} />
      </div>

      {/* Body */}
      {pr.body && (
        <Card>
          <CardContent className="pt-6">
            <pre className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed font-sans">{pr.body}</pre>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Reviews ({reviews.length})
          </h3>
          <div className="space-y-2">
            {reviews.map(r => {
              const cfg = reviewStateConfig[r.state] || reviewStateConfig.COMMENTED
              const Icon = cfg.icon
              return (
                <Card key={r.id}>
                  <CardContent className="py-3 flex items-center gap-3">
                    <Icon className={cn('h-4 w-4 shrink-0', cfg.color)} />
                    <img src={r.user.avatar_url} alt={r.user.login} className="w-5 h-5 rounded-full" />
                    <span className="text-sm font-medium">{r.user.login}</span>
                    <Badge variant="outline" className="text-[10px]">{cfg.label}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(r.submitted_at).toLocaleString()}
                    </span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Checks */}
      {checks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Checks ({checks.length})
          </h3>
          <div className="space-y-2">
            {checks.map(c => {
              const cfg = c.conclusion ? checkConclusion[c.conclusion] || checkConclusion.neutral : { color: 'text-blue-500', label: c.status }
              return (
                <Card key={c.id}>
                  <CardContent className="py-3 flex items-center gap-3">
                    {c.conclusion === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : c.conclusion === 'failure' ? (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    ) : (
                      <Clock className={cn('h-4 w-4 shrink-0', cfg.color)} />
                    )}
                    <span className="text-sm font-medium flex-1">{c.name}</span>
                    <Badge variant="outline" className={cn('text-[10px]', cfg.color)}>{cfg.label}</Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Requested reviewers */}
      {pr.requested_reviewers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Requested Reviewers
          </h3>
          <div className="flex gap-2">
            {pr.requested_reviewers.map(u => (
              <div key={u.id} className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded-lg px-2 py-1.5">
                <img src={u.avatar_url} alt={u.login} className="w-4 h-4 rounded-full" />
                {u.login}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
