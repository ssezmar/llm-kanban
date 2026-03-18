import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTasksStore } from '@/stores/tasks-store'
import { useAgentsStore } from '@/stores/agents-store'
import { useBoardStore } from '@/stores/board-store'
import { useEpicsStore } from '@/stores/epics-store'
import { useUsersStore } from '@/stores/users-store'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ListChecks, CheckCircle2, AlertTriangle, Clock, TrendingUp,
  Star, Activity, Flame, CalendarClock, Tag, Bot, Users,
  ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Helpers ──

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}м назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}ч назад`
  const d = Math.floor(h / 24)
  return `${d}д назад`
}

const priorityDotColors: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
}

const priorityLabels: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
}

// ── Mini bar chart (pure CSS) ──

function BarChart({ data, maxValue }: { data: { label: string; value: number; color: string }[]; maxValue?: number }) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20 truncate text-right">{d.label}</span>
          <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }}
            />
          </div>
          <span className="text-xs font-medium w-6 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Donut chart (SVG) ──

function DonutChart({ segments, size = 120 }: { segments: { value: number; color: string; label: string }[]; size?: number }) {
  const total = segments.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="flex items-center justify-center" style={{ width: size, height: size }}><span className="text-xs text-muted-foreground">Нет данных</span></div>

  const r = (size - 16) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  let offset = 0

  return (
    <svg width={size} height={size} className="shrink-0">
      {segments.filter((s) => s.value > 0).map((seg) => {
        const pct = seg.value / total
        const dash = pct * circumference
        const gap = circumference - dash
        const currentOffset = offset
        offset += dash
        return (
          <circle
            key={seg.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={10}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-currentOffset}
            strokeLinecap="round"
            className="transition-all duration-700"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        )
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground text-xl font-bold">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground text-[10px]">задач</text>
    </svg>
  )
}

// ── Sparkline (SVG) ──

function Sparkline({ data, color = 'currentColor', height = 40, width = 120 }: { data: number[]; color?: string; height?: number; width?: number }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline points={areaPoints} fill={color} fillOpacity={0.1} stroke="none" />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ── Main Dashboard ──

export function DashboardPage() {
  const navigate = useNavigate()
  const { tasks } = useTasksStore()
  const { agents } = useAgentsStore()
  const { columns } = useBoardStore()
  const { epics } = useEpicsStore()
  const { users } = useUsersStore()

  // ── Computed data ──
  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.status === 'done').length
    const failed = tasks.filter((t) => t.status === 'failed').length
    const active = tasks.filter((t) => t.progress > 0 && t.progress < 100).length
    const overdue = tasks.filter((t) => t.deadline && t.deadline < Date.now() && t.progress < 100).length
    const reviewed = tasks.filter((t) => t.review)
    const avgScore = reviewed.length > 0
      ? reviewed.reduce((s, t) => s + (t.review?.score || 0), 0) / reviewed.length
      : 0
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0
    const totalEstimate = tasks.reduce((s, t) => s + t.estimatedTime, 0)
    const totalComments = tasks.reduce((s, t) => s + t.comments.length, 0)
    const totalLogs = tasks.reduce((s, t) => s + t.logs.length, 0)
    const totalSubtasks = tasks.reduce((s, t) => s + t.subtasks.length, 0)
    const doneSubtasks = tasks.reduce((s, t) => s + t.subtasks.filter((st) => st.done).length, 0)

    return { total, done, failed, active, overdue, avgScore, completionRate, reviewed: reviewed.length, totalEstimate, totalComments, totalLogs, totalSubtasks, doneSubtasks }
  }, [tasks])

  // Column distribution
  const columnData = useMemo(() =>
    columns.map((col) => ({
      label: col.title,
      value: tasks.filter((t) => t.status === col.id).length,
      color: col.color,
      icon: col.icon,
      id: col.id,
    })),
    [columns, tasks]
  )

  // Priority distribution
  const priorityData = useMemo(() => {
    const pris = ['low', 'medium', 'high', 'critical'] as const
    return pris.map((p) => ({
      label: priorityLabels[p],
      value: tasks.filter((t) => t.priority === p).length,
      color: p === 'low' ? '#22c55e' : p === 'medium' ? '#3b82f6' : p === 'high' ? '#f97316' : '#ef4444',
    }))
  }, [tasks])

  // Tags frequency
  const tagData = useMemo(() => {
    const map = new Map<string, number>()
    tasks.forEach((t) => t.tags.forEach((tag) => map.set(tag, (map.get(tag) || 0) + 1)))
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
  }, [tasks])

  // Most active users (by tasks created + comments)
  const activeUsers = useMemo(() => {
    const map = new Map<string, { created: number; comments: number }>()
    tasks.forEach((t) => {
      if (t.createdBy) {
        const e = map.get(t.createdBy) || { created: 0, comments: 0 }
        e.created++
        map.set(t.createdBy, e)
      }
      t.comments.forEach((c) => {
        const user = users.find((u) => u.name === c.author)
        if (user) {
          const e = map.get(user.id) || { created: 0, comments: 0 }
          e.comments++
          map.set(user.id, e)
        }
      })
    })
    return Array.from(map.entries())
      .map(([id, s]) => ({ user: users.find((u) => u.id === id), total: s.created + s.comments, created: s.created, comments: s.comments }))
      .filter((x) => x.user)
      .sort((a, b) => b.total - a.total)
  }, [tasks, users])

  // Agent performance
  const agentPerf = useMemo(() =>
    agents.map((a) => {
      const agTasks = tasks.filter((t) => t.assignedAgent === a.id)
      const done = agTasks.filter((t) => t.status === 'done').length
      const failed = agTasks.filter((t) => t.status === 'failed').length
      const avgScore = agTasks.filter((t) => t.review).reduce((s, t, _, arr) => s + (t.review!.score / arr.length), 0)
      return { agent: a, assigned: agTasks.length, done, failed, avgScore }
    }),
    [agents, tasks]
  )

  // Recent activity (logs + comments merged)
  const recentActivity = useMemo(() => {
    const items: { type: 'log' | 'comment'; message: string; taskTitle: string; taskId: string; timestamp: number; logType?: string; author?: string }[] = []
    tasks.forEach((t) => {
      t.logs.forEach((l) => items.push({ type: 'log', message: l.message, taskTitle: t.title, taskId: t.id, timestamp: l.timestamp, logType: l.type }))
      t.comments.forEach((c) => items.push({ type: 'comment', message: c.text, taskTitle: t.title, taskId: t.id, timestamp: c.timestamp, author: c.author }))
    })
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8)
  }, [tasks])

  // Upcoming deadlines
  const upcomingDeadlines = useMemo(() =>
    tasks
      .filter((t) => t.deadline && t.progress < 100)
      .sort((a, b) => a.deadline! - b.deadline!)
      .slice(0, 6),
    [tasks]
  )

  // Epic progress
  const epicProgress = useMemo(() =>
    epics.filter((e) => e.status !== 'archived').map((e) => {
      const epicTasks = tasks.filter((t) => t.epicId === e.id)
      const done = epicTasks.filter((t) => t.status === 'done' || t.progress === 100).length
      const total = epicTasks.length
      const pct = total > 0 ? Math.round((done / total) * 100) : 0
      return { epic: e, done, total, pct }
    }),
    [epics, tasks]
  )

  // Task creation sparkline (last 14 days)
  const creationSparkline = useMemo(() => {
    const DAY = 86400000
    const days = 14
    const data: number[] = []
    for (let i = days - 1; i >= 0; i--) {
      const start = Date.now() - (i + 1) * DAY
      const end = Date.now() - i * DAY
      data.push(tasks.filter((t) => t.createdAt >= start && t.createdAt < end).length)
    }
    return data
  }, [tasks])

  // Score distribution
  const scoreDistribution = useMemo(() => {
    const bins = Array.from({ length: 10 }, (_, i) => ({ score: i + 1, count: 0 }))
    tasks.forEach((t) => {
      if (t.review) {
        const idx = Math.min(t.review.score - 1, 9)
        if (idx >= 0) bins[idx].count++
      }
    })
    return bins
  }, [tasks])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Дашборд</h1>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* ── Row 1: Summary stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Всего задач</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-foreground/5 dark:bg-primary/10 flex items-center justify-center">
                <ListChecks className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Sparkline data={creationSparkline} color="hsl(var(--foreground))" width={80} height={24} />
              <span>за 14 дней</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Завершено</p>
                <p className="text-3xl font-bold mt-1">{stats.done}<span className="text-sm text-muted-foreground font-normal">/{stats.total}</span></p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={stats.completionRate} size="sm" className="flex-1" />
              <span className="text-xs font-medium">{stats.completionRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Средняя оценка</p>
                <p className="text-3xl font-bold mt-1">{stats.avgScore.toFixed(1)}<span className="text-sm text-muted-foreground font-normal">/10</span></p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">По {stats.reviewed} ревью</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Просрочено</p>
                <p className={cn('text-3xl font-bold mt-1', stats.overdue > 0 && 'text-destructive')}>{stats.overdue}</p>
              </div>
              <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', stats.overdue > 0 ? 'bg-red-500/10' : 'bg-foreground/5 dark:bg-primary/10')}>
                <AlertTriangle className={cn('h-6 w-6', stats.overdue > 0 ? 'text-red-500' : 'text-muted-foreground')} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.active} в работе, {stats.failed} провалено</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Column distribution + Priority donut ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Распределение по столбцам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {columnData.map((col) => (
                <div key={col.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-32 shrink-0">
                    <DynamicIcon name={col.icon} className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{col.label}</span>
                  </div>
                  <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((col.value / (stats.total || 1)) * 100, col.value > 0 ? 8 : 0)}%`, backgroundColor: col.color }}
                    >
                      {col.value > 0 && <span className="text-[10px] font-bold text-white drop-shadow-sm">{col.value}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Приоритеты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <DonutChart segments={priorityData} size={130} />
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                {priorityData.map((p) => (
                  <div key={p.label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-muted-foreground">{p.label}</span>
                    <span className="font-medium ml-auto">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Active tasks + Upcoming deadlines ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Задачи в работе
              </CardTitle>
              <Badge variant="outline">{stats.active}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.filter((t) => t.progress > 0 && t.progress < 100).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Нет активных задач</p>
            )}
            {tasks.filter((t) => t.progress > 0 && t.progress < 100).map((task) => {
              const agent = agents.find((a) => a.id === task.assignedAgent)
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    {agent && <p className="text-xs text-muted-foreground">{agent.name}</p>}
                  </div>
                  <div className="w-20 shrink-0">
                    <Progress value={task.progress} size="sm" />
                    <p className="text-[10px] text-muted-foreground text-center mt-0.5">{task.progress}%</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4" /> Ближайшие дедлайны
              </CardTitle>
              <Badge variant="outline" className={cn(stats.overdue > 0 && 'border-destructive text-destructive')}>
                {stats.overdue > 0 ? `${stats.overdue} просрочено` : 'Все в срок'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingDeadlines.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Нет дедлайнов</p>
            )}
            {upcomingDeadlines.map((task) => {
              const daysLeft = Math.ceil((task.deadline! - Date.now()) / 86400000)
              const isOverdue = daysLeft < 0
              const isUrgent = daysLeft >= 0 && daysLeft <= 2
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', priorityDotColors[task.priority])} />
                  <p className="text-sm flex-1 truncate">{task.title}</p>
                  <span className={cn(
                    'text-xs shrink-0 font-medium',
                    isOverdue ? 'text-destructive' : isUrgent ? 'text-orange-500' : 'text-muted-foreground'
                  )}>
                    {isOverdue ? `${Math.abs(daysLeft)}д просрочено` : daysLeft === 0 ? 'Сегодня' : `${daysLeft}д`}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Agent performance + Epic progress ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" /> Производительность агентов
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agentPerf.map(({ agent, assigned, done, failed, avgScore }) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/agents/${agent.id}`)}
              >
                <div className="h-10 w-10 rounded-xl bg-foreground/5 dark:bg-primary/10 text-foreground/70 text-xs font-bold flex items-center justify-center shrink-0">
                  {agent.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{agent.name}</p>
                    <Badge variant="outline" className={cn('text-[10px] border',
                      agent.status === 'idle' ? 'border-green-500/30 text-green-500' :
                      agent.status === 'busy' ? 'border-yellow-500/30 text-yellow-500' :
                      'border-muted text-muted-foreground'
                    )}>
                      {agent.status === 'idle' ? 'Свободен' : agent.status === 'busy' ? 'Занят' : 'Офлайн'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{assigned} задач</span>
                    <span className="text-green-500">{done} готово</span>
                    {failed > 0 && <span className="text-red-500">{failed} провал</span>}
                    <span>{agent.successRate}% успех</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{avgScore ? avgScore.toFixed(1) : '—'}</p>
                  <p className="text-[10px] text-muted-foreground">ср. оценка</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4" /> Прогресс эпиков
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {epicProgress.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Нет активных эпиков</p>
            )}
            {epicProgress.map(({ epic, done, total, pct }) => (
              <div
                key={epic.id}
                className="p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => navigate(`/epics/${epic.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DynamicIcon name={epic.icon} className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{epic.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{done}/{total}</span>
                </div>
                <Progress value={pct} size="sm" />
                <div className="flex items-center justify-between mt-1.5">
                  <Badge variant="outline" className="text-[10px]" style={{ borderColor: epic.color + '40', color: epic.color }}>
                    {epic.status === 'planning' ? 'Планирование' : epic.status === 'active' ? 'Активный' : 'Завершён'}
                  </Badge>
                  {epic.targetDate && (
                    <span className={cn('text-[10px]', epic.targetDate < Date.now() && epic.status !== 'completed' ? 'text-destructive' : 'text-muted-foreground')}>
                      {new Date(epic.targetDate).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 5: Most active users + Score distribution ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Самые активные пользователи
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeUsers.map(({ user, total, created, comments }, i) => (
              <div
                key={user!.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/users/${user!.id}`)}
              >
                <span className="text-xs text-muted-foreground w-5 text-center font-bold">{i + 1}</span>
                <div className="h-9 w-9 rounded-xl bg-foreground/5 dark:bg-primary/10 text-foreground/70 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {user!.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{user!.name}</p>
                  <p className="text-xs text-muted-foreground">{user!.position}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  <span title="Задач создано">{created} задач</span>
                  <span title="Комментариев">{comments} комм.</span>
                  <span className="font-bold text-foreground">{total}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" /> Распределение оценок
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-32 mb-3">
              {scoreDistribution.map((bin) => {
                const maxCount = Math.max(...scoreDistribution.map((b) => b.count), 1)
                const heightPct = (bin.count / maxCount) * 100
                const color = bin.score <= 3 ? 'bg-red-500/70' : bin.score <= 6 ? 'bg-yellow-500/70' : 'bg-green-500/70'
                return (
                  <div key={bin.score} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{bin.count || ''}</span>
                    <div
                      className={cn('w-full rounded-t-sm transition-all duration-500', color)}
                      style={{ height: `${Math.max(heightPct, bin.count > 0 ? 8 : 2)}%` }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex gap-1.5">
              {scoreDistribution.map((bin) => (
                <div key={bin.score} className="flex-1 text-center text-[10px] text-muted-foreground">{bin.score}</div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>Всего ревью: {stats.reviewed}</span>
              <span className="font-medium text-foreground">Средняя: {stats.avgScore.toFixed(1)}/10</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 6: Tags cloud + Quick stats ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" /> Популярные теги
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tagData.map(([tag, count]) => {
                const maxCount = tagData[0]?.[1] || 1
                const intensity = 0.3 + (count / maxCount) * 0.7
                return (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="gap-1 transition-opacity cursor-default"
                    style={{ opacity: intensity }}
                  >
                    {tag}
                    <span className="text-[10px] text-muted-foreground">{count}</span>
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Сводка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold">{stats.totalEstimate}м</p>
                <p className="text-[10px] text-muted-foreground">Общая оценка</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold">{Math.round(stats.totalEstimate / 60)}ч</p>
                <p className="text-[10px] text-muted-foreground">В часах</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold">{stats.totalComments}</p>
                <p className="text-[10px] text-muted-foreground">Комментариев</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold">{stats.doneSubtasks}/{stats.totalSubtasks}</p>
                <p className="text-[10px] text-muted-foreground">Подзадач</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold">{stats.totalLogs}</p>
                <p className="text-[10px] text-muted-foreground">Записей в логе</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold">{agents.filter((a) => a.status !== 'offline').length}/{agents.length}</p>
                <p className="text-[10px] text-muted-foreground">Агентов онлайн</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Последние события
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-3">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              {recentActivity.map((item, i) => {
                const dotColor = item.type === 'comment' ? 'bg-blue-500' :
                  item.logType === 'success' ? 'bg-green-500' :
                  item.logType === 'error' ? 'bg-red-500' :
                  item.logType === 'warning' ? 'bg-yellow-500' : 'bg-muted-foreground'
                return (
                  <div key={i} className="flex gap-3 relative">
                    <div className={cn('h-3.5 w-3.5 rounded-full shrink-0 mt-0.5 ring-2 ring-background', dotColor)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{item.message}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span
                          className="hover:underline cursor-pointer truncate max-w-[120px]"
                          onClick={() => navigate(`/tasks/${item.taskId}`)}
                        >
                          {item.taskTitle}
                        </span>
                        {item.author && <span>· {item.author}</span>}
                        <span className="shrink-0">{timeAgo(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
