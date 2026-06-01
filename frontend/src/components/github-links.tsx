import { Link } from 'react-router-dom'
import { useTasksStore } from '@/stores/tasks-store'
import { useAgentsStore } from '@/stores/agents-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, KanbanSquare, ArrowUpRight, Link2 } from 'lucide-react'

interface Props {
  issueNumber?: number
  prNumber?: number
  authorLogin?: string
}

export function GitHubLinks({ issueNumber, prNumber, authorLogin }: Props) {
  const tasks = useTasksStore((s) => s.tasks)
  const agents = useAgentsStore((s) => s.agents)

  const linkedTasks = tasks.filter((t) =>
    (issueNumber != null && t.githubIssueNumber === issueNumber) ||
    (prNumber != null && (t.githubPrNumbers || []).includes(prNumber))
  )
  const authorAgent = authorLogin ? agents.find((a) => a.githubLogin === authorLogin) : undefined

  if (!linkedTasks.length && !authorAgent) return null

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" />
          Связи
        </h3>

        {authorAgent && (
          <Link
            to={`/agents/${authorAgent.id}`}
            className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-muted transition-colors group"
          >
            <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
              {authorAgent.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Bot className="h-3 w-3" /> Сгенерировано LLM-агентом
              </p>
              <p className="text-sm font-medium truncate">{authorAgent.name}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        )}

        {linkedTasks.map((t) => (
          <Link
            key={t.id}
            to={`/tasks/${t.id}`}
            className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-muted transition-colors group"
          >
            <div
              className="h-8 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: t.color }}
            />
            <KanbanSquare className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Связанная задача канбана</p>
              <p className="text-sm font-medium truncate">{t.title}</p>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{t.status}</Badge>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
