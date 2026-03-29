import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGitHubStore } from '@/stores/github-store'
import { useGitHubPRsStore } from '@/stores/github-prs-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PageHero } from '@/components/page-hero'
import {
  GitPullRequest, Search, Loader2, AlertTriangle, Filter,
  GitMerge, ArrowUpRight, CircleDot, MessageSquare, FileCode,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const prStatusBadge = (pr: { state: string; merged: boolean; draft: boolean }) => {
  if (pr.merged) return { label: 'Merged', cls: 'border-purple-500/30 text-purple-500 bg-purple-500/10' }
  if (pr.draft) return { label: 'Draft', cls: 'border-muted-foreground/30 text-muted-foreground' }
  if (pr.state === 'open') return { label: 'Open', cls: 'border-green-500/30 text-green-500 bg-green-500/10' }
  return { label: 'Closed', cls: 'border-red-500/30 text-red-500 bg-red-500/10' }
}

export function GitHubPRsPage() {
  const navigate = useNavigate()
  const { isConnected } = useGitHubStore()
  const { pullRequests, isLoading, error, filter, setFilter, fetchAll } = useGitHubPRsStore()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isConnected) fetchAll()
  }, [isConnected])

  const filtered = pullRequests.filter(pr =>
    pr.title.toLowerCase().includes(search.toLowerCase()) ||
    `#${pr.number}`.includes(search)
  )

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
          <GitPullRequest className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">Pull Requests</h1>
        </div>
        <p className="text-sm text-muted-foreground">Review and track pull requests</p>
      </PageHero>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search PRs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {(['open', 'closed', 'all'] as const).map(f => (
            <Button key={f} variant={filter === f ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter(f)} className="capitalize">
              {f === 'open' && <GitPullRequest className="h-3.5 w-3.5 mr-1.5 text-green-500" />}
              {f === 'closed' && <GitMerge className="h-3.5 w-3.5 mr-1.5 text-purple-500" />}
              {f === 'all' && <Filter className="h-3.5 w-3.5 mr-1.5" />}
              {f}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {isLoading && !pullRequests.length && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* PR list */}
      <div className="space-y-2 stagger-children">
        {filtered.map(pr => {
          const status = prStatusBadge(pr)
          return (
            <Card
              key={pr.id}
              className="group cursor-pointer hover:border-muted-foreground/30 transition-all duration-200"
              onClick={() => navigate(`/github/prs/${pr.number}`)}
            >
              <CardContent className="py-4 flex items-start gap-4">
                <div className="mt-0.5 shrink-0">
                  {pr.merged ? (
                    <GitMerge className="h-4 w-4 text-purple-500" />
                  ) : pr.state === 'open' ? (
                    <GitPullRequest className="h-4 w-4 text-green-500" />
                  ) : (
                    <GitPullRequest className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm group-hover:underline">{pr.title}</span>
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', status.cls)}>
                      {status.label}
                    </Badge>
                    {pr.labels.map(l => (
                      <Badge key={l.id} variant="outline" className="text-[10px] px-1.5 py-0" style={{
                        borderColor: `#${l.color}40`,
                        color: `#${l.color}`,
                        backgroundColor: `#${l.color}10`,
                      }}>
                        {l.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">#{pr.number}</span>
                    <span>{pr.user.login}</span>
                    <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {pr.head.ref} → {pr.base.ref}
                    </span>
                    {pr.comments + pr.review_comments > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {pr.comments + pr.review_comments}
                      </span>
                    )}
                    {pr.changed_files > 0 && (
                      <span className="flex items-center gap-1">
                        <FileCode className="h-3 w-3" />
                        {pr.changed_files} files
                      </span>
                    )}
                    <span className="flex gap-1.5">
                      <span className="text-green-500">+{pr.additions}</span>
                      <span className="text-red-500">-{pr.deletions}</span>
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!isLoading && !filtered.length && (
        <p className="text-center text-sm text-muted-foreground py-12">
          {search ? 'No matching pull requests' : 'No pull requests found'}
        </p>
      )}
    </div>
  )
}
