import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGitHubStore } from '@/stores/github-store'
import { useGitHubIssuesStore } from '@/stores/github-issues-store'
import { useTasksStore } from '@/stores/tasks-store'
import { useBoardStore } from '@/stores/board-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft, CircleDot, CircleCheck, ExternalLink, MessageSquare,
  Send, Loader2, KanbanSquare, Calendar, User, Tag,
} from 'lucide-react'

export function GitHubIssueDetailPage() {
  const { number } = useParams<{ number: string }>()
  const navigate = useNavigate()
  const { isConnected } = useGitHubStore()
  const {
    selectedIssue: issue, selectedComments: comments,
    isLoading, fetchOne, update, addComment, clearSelection,
  } = useGitHubIssuesStore()
  const { addTask } = useTasksStore()
  const { columns } = useBoardStore()
  const [commentText, setCommentText] = useState('')
  const [sending, setSending] = useState(false)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (isConnected && number) fetchOne(+number)
    return () => clearSelection()
  }, [isConnected, number])

  const handleToggleState = () => {
    if (!issue) return
    update(issue.number, { state: issue.state === 'open' ? 'closed' : 'open' })
  }

  const handleComment = async () => {
    if (!issue || !commentText.trim()) return
    setSending(true)
    await addComment(issue.number, commentText.trim())
    setCommentText('')
    setSending(false)
  }

  const handleSyncToKanban = () => {
    if (!issue) return
    const firstCol = columns[0]?.id || 'backlog'
    addTask({
      title: `[GH-${issue.number}] ${issue.title}`,
      description: issue.body || '',
      prompt: '',
      status: firstCol,
      priority: 'medium',
      assignedAgent: null,
      epicId: null,
      deadline: null,
      estimatedTime: 60,
      tags: ['github', ...issue.labels.map(l => l.name)],
      subtasks: [],
      comments: [],
      color: '#6366f1',
      pipelines: [],
      attachments: [],
    })
    setSynced(true)
  }

  if (isLoading || !issue) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12 max-w-3xl animate-fade-in-up">
      <Button variant="ghost" size="sm" onClick={() => navigate('/github/issues')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Issues
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {issue.state === 'open' ? (
            <CircleDot className="h-5 w-5 text-green-500 mt-1 shrink-0" />
          ) : (
            <CircleCheck className="h-5 w-5 text-purple-500 mt-1 shrink-0" />
          )}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{issue.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono">#{issue.number}</span>
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {issue.user.login}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(issue.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Labels */}
        {issue.labels.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pl-8">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            {issue.labels.map(l => (
              <Badge key={l.id} variant="outline" className="text-xs" style={{
                borderColor: `#${l.color}40`,
                color: `#${l.color}`,
                backgroundColor: `#${l.color}10`,
              }}>
                {l.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Assignees */}
        {issue.assignees.length > 0 && (
          <div className="flex items-center gap-2 pl-8">
            {issue.assignees.map(a => (
              <div key={a.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <img src={a.avatar_url} alt={a.login} className="w-5 h-5 rounded-full" />
                {a.login}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleToggleState}>
          {issue.state === 'open' ? (
            <><CircleCheck className="h-3.5 w-3.5 mr-1.5" /> Close Issue</>
          ) : (
            <><CircleDot className="h-3.5 w-3.5 mr-1.5" /> Reopen Issue</>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={handleSyncToKanban} disabled={synced}>
          <KanbanSquare className="h-3.5 w-3.5 mr-1.5" />
          {synced ? 'Synced!' : 'Sync to Kanban'}
        </Button>
        <a href={issue.html_url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Open on GitHub
          </Button>
        </a>
      </div>

      {/* Body */}
      {issue.body && (
        <Card>
          <CardContent className="pt-6">
            <div className="prose prose-sm prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed font-sans">{issue.body}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </h3>

        {comments.map(c => (
          <Card key={c.id}>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <img src={c.user.avatar_url} alt={c.user.login} className="w-5 h-5 rounded-full" />
                <span className="text-sm font-medium">{c.user.login}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed font-sans">{c.body}</pre>
            </CardContent>
          </Card>
        ))}

        {/* Add comment */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            className="flex-1"
          />
          <Button
            size="icon"
            className="shrink-0 self-end"
            onClick={handleComment}
            disabled={sending || !commentText.trim()}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
