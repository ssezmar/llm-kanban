import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGitHubStore } from '@/stores/github-store'
import { useGitHubIssuesStore } from '@/stores/github-issues-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageHero } from '@/components/page-hero'
import {
  CircleDot, Search, Plus, MessageSquare, Loader2, AlertTriangle,
  CircleCheck, Filter, X, ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function GitHubIssuesPage() {
  const navigate = useNavigate()
  const { isConnected } = useGitHubStore()
  const { issues, isLoading, error, filter, setFilter, fetchAll, create } = useGitHubIssuesStore()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isConnected) fetchAll()
  }, [isConnected])

  const filtered = issues.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    `#${i.number}`.includes(search)
  )

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    const issue = await create(newTitle.trim(), newBody.trim() || undefined)
    setCreating(false)
    if (issue) {
      setShowCreate(false)
      setNewTitle('')
      setNewBody('')
    }
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
          <CircleDot className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">Issues</h1>
        </div>
        <p className="text-sm text-muted-foreground">Manage GitHub issues directly from your Kanban</p>
      </PageHero>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['open', 'closed', 'all'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === 'open' && <CircleDot className="h-3.5 w-3.5 mr-1.5 text-green-500" />}
              {f === 'closed' && <CircleCheck className="h-3.5 w-3.5 mr-1.5 text-purple-500" />}
              {f === 'all' && <Filter className="h-3.5 w-3.5 mr-1.5" />}
              {f}
            </Button>
          ))}
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4 mr-1.5" />}
            {showCreate ? '' : 'New'}
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card className="animate-scale-in">
          <CardContent className="pt-6 space-y-3">
            <Input
              placeholder="Issue title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="Description (optional, markdown supported)"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating || !newTitle.trim()}>
                {creating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Create Issue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && !issues.length && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Issues list */}
      <div className="space-y-2 stagger-children">
        {filtered.map(issue => (
          <Card
            key={issue.id}
            className="group cursor-pointer hover:border-muted-foreground/30 transition-all duration-200"
            onClick={() => navigate(`/github/issues/${issue.number}`)}
          >
            <CardContent className="py-4 flex items-start gap-4">
              {issue.state === 'open' ? (
                <CircleDot className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <CircleCheck className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm group-hover:underline">{issue.title}</span>
                  {issue.labels.map(l => (
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
                  <span className="font-mono">#{issue.number}</span>
                  <span>by {issue.user.login}</span>
                  <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                  {issue.comments > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {issue.comments}
                    </span>
                  )}
                  {issue.assignees.length > 0 && (
                    <span className="flex items-center gap-1">
                      {issue.assignees.map(a => (
                        <img key={a.id} src={a.avatar_url} alt={a.login} className="w-4 h-4 rounded-full" />
                      ))}
                    </span>
                  )}
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && !filtered.length && (
        <p className="text-center text-sm text-muted-foreground py-12">
          {search ? 'No matching issues' : 'No issues found'}
        </p>
      )}
    </div>
  )
}
