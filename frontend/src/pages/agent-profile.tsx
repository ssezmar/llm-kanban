import { useParams, useNavigate } from 'react-router-dom'
import { useAgentsStore } from '@/stores/agents-store'
import { useTasksStore } from '@/stores/tasks-store'
import { useBoardStore } from '@/stores/board-store'
import { useEpicsStore } from '@/stores/epics-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft, Cpu, Zap, CheckCircle2, XCircle,
  Clock, Activity, Settings2, TrendingUp,
} from 'lucide-react'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { cn } from '@/lib/utils'

const statusLabels: Record<string, { label: string; class: string }> = {
  idle: { label: 'Свободен', class: 'bg-green-500/10 text-green-500 border-green-500/20' },
  busy: { label: 'Занят', class: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  offline: { label: 'Офлайн', class: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
}

const typeLabels: Record<string, string> = {
  'claude-code': 'Claude Code (Anthropic)',
  codex: 'Codex CLI (OpenAI)',
  'gemini-cli': 'Gemini CLI (Google)',
  custom: 'Custom Pipeline',
}

export function AgentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { agents } = useAgentsStore()
  const { tasks } = useTasksStore()
  const { columns } = useBoardStore()
  const { epics } = useEpicsStore()

  const agent = agents.find((a) => a.id === id)

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Агент не найден</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>Вернуться</Button>
      </div>
    )
  }

  const agentTasks = tasks.filter((t) => t.assignedAgent === agent.id)
  const completedTasks = agentTasks.filter((t) => t.status === 'done')
  const failedTasks = agentTasks.filter((t) => t.status === 'failed')
  const activeTasks = agentTasks.filter((t) => t.progress > 0 && t.progress < 100)
  const inReview = agentTasks.filter((t) => t.status === 'review')
  const avgScore = agentTasks
    .filter((t) => t.review?.score)
    .reduce((acc, t, _, arr) => acc + (t.review!.score / arr.length), 0)
  const totalLogs = agentTasks.reduce((acc, t) => acc + t.logs.length, 0)

  const statusInfo = statusLabels[agent.status]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Назад
      </Button>

      {/* Agent header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-2xl bg-foreground/5 dark:bg-primary/10 text-foreground/70 dark:text-primary/70 text-2xl font-bold flex items-center justify-center shrink-0">
              {agent.avatar}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{agent.name}</h1>
                  <Badge variant="outline" className={cn('border', statusInfo.class)}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{typeLabels[agent.type]}</p>
              </div>
              <p className="text-sm">{agent.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Создан {new Date(agent.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agent.tasksCompleted}</p>
                <p className="text-xs text-muted-foreground">Завершено</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-foreground/5 dark:bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agent.successRate}%</p>
                <p className="text-xs text-muted-foreground">Успешность</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agent.avgExecutionTime}м</p>
                <p className="text-xs text-muted-foreground">Ср. время</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgScore ? avgScore.toFixed(1) : '—'}</p>
                <p className="text-xs text-muted-foreground">Ср. оценка</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Конфигурация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Модель</p>
              <p className="text-sm font-medium font-mono">{agent.config.model}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Max Tokens</p>
              <p className="text-sm font-medium font-mono">{agent.config.maxTokens.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Temperature</p>
              <p className="text-sm font-medium font-mono">{agent.config.temperature}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" /> Статистика по задачам
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{agentTasks.length}</p>
              <p className="text-xs text-muted-foreground">Всего</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-blue-500">{activeTasks.length}</p>
              <p className="text-xs text-muted-foreground">В работе</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-yellow-500">{inReview.length}</p>
              <p className="text-xs text-muted-foreground">На ревью</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-green-500">{completedTasks.length}</p>
              <p className="text-xs text-muted-foreground">Готово</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-red-500">{failedTasks.length}</p>
              <p className="text-xs text-muted-foreground">Провалено</p>
            </div>
          </div>

          {/* Success rate bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Успешность</span>
              <span>{agent.successRate}%</span>
            </div>
            <Progress value={agent.successRate} size="lg" />
          </div>
        </CardContent>
      </Card>

      {/* Assigned tasks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4" /> Назначенные задачи ({agentTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {agentTasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Нет назначенных задач</p>
          )}
          {agentTasks.map((task) => {
            const col = columns.find((c) => c.id === task.status)
            const epic = task.epicId ? epics.find((e) => e.id === task.epicId) : null
            return (
              <div key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/tasks/${task.id}`)}>
                <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {epic && <span className="text-xs text-muted-foreground flex items-center gap-1"><DynamicIcon name={epic.icon} className="h-3 w-3" /> {epic.name}</span>}
                  </div>
                </div>
                {task.progress > 0 && task.progress < 100 && (
                  <div className="w-16 shrink-0">
                    <Progress value={task.progress} size="sm" />
                  </div>
                )}
                {col && (
                  <Badge variant="outline" className="text-xs gap-1 shrink-0">
                    <DynamicIcon name={col.icon} className="h-3 w-3" /> {col.title}
                  </Badge>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Recent logs from this agent */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Последние логи ({totalLogs})</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const allLogs = agentTasks.flatMap((t) =>
              t.logs.map((l) => ({ ...l, taskId: t.id, taskTitle: t.title }))
            ).sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)

            if (allLogs.length === 0) {
              return <p className="text-sm text-muted-foreground text-center py-4">Нет логов</p>
            }

            const logColors: Record<string, string> = {
              info: 'text-blue-400',
              success: 'text-green-400',
              error: 'text-red-400',
              warning: 'text-yellow-400',
            }

            return (
              <div className="space-y-1.5 font-mono text-sm">
                {allLogs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {new Date(log.timestamp).toLocaleString('ru-RU')}
                    </span>
                    <span
                      className="text-xs text-muted-foreground hover:underline cursor-pointer shrink-0 max-w-[120px] truncate"
                      onClick={() => navigate(`/tasks/${log.taskId}`)}
                    >
                      {log.taskTitle}
                    </span>
                    <span className={cn(logColors[log.type])}>{log.message}</span>
                  </div>
                ))}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}

function Calendar(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 2v4" /><path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}
