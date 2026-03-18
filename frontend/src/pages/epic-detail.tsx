import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEpicsStore } from '@/stores/epics-store'
import { useTasksStore } from '@/stores/tasks-store'
import { useBoardStore } from '@/stores/board-store'
import { useAgentsStore } from '@/stores/agents-store'
import { IconPicker } from '@/components/ui/icon-picker'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft, Trash2, CalendarClock, ListChecks,
  Plus, Save, X, Clock, Bot, Flame, TrendingUp, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EpicStatus } from '@/lib/types'

const EPIC_COLORS = [
  '#3b82f6', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#a855f7',
]

const statusLabels: Record<EpicStatus, string> = {
  planning: 'Планирование',
  active: 'Активный',
  completed: 'Завершён',
  archived: 'В архиве',
}

const statusBadgeColors: Record<EpicStatus, string> = {
  planning: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  active: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  archived: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
}

const priorityLabels: Record<string, { label: string; class: string }> = {
  low: { label: 'Низкий', class: 'bg-green-500 h-2 w-2 rounded-full' },
  medium: { label: 'Средний', class: 'bg-blue-500 h-2 w-2 rounded-full' },
  high: { label: 'Высокий', class: 'bg-orange-500 h-2 w-2 rounded-full' },
  critical: { label: 'Критический', class: 'bg-red-500 h-2 w-2 rounded-full' },
}

export function EpicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { epics, updateEpic, deleteEpic } = useEpicsStore()
  const { tasks, updateTask } = useTasksStore()
  const { columns } = useBoardStore()
  const { agents } = useAgentsStore()

  const epic = epics.find((e) => e.id === id)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(epic?.name || '')
  const [icon, setIcon] = useState(epic?.icon || 'rocket')
  const [description, setDescription] = useState(epic?.description || '')
  const [color, setColor] = useState(epic?.color || '#3b82f6')
  const [status, setStatus] = useState<EpicStatus>(epic?.status || 'planning')
  const [startDate, setStartDate] = useState(epic?.startDate ? new Date(epic.startDate).toISOString().split('T')[0] : '')
  const [targetDate, setTargetDate] = useState(epic?.targetDate ? new Date(epic.targetDate).toISOString().split('T')[0] : '')

  if (!epic) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Эпик не найден</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/epics')}>Вернуться</Button>
      </div>
    )
  }

  const epicTasks = tasks.filter((t) => t.epicId === epic.id)
  const doneTasks = epicTasks.filter((t) => t.status === 'done' || t.progress === 100).length
  const failedTasks = epicTasks.filter((t) => t.status === 'failed').length
  const activeTasks = epicTasks.filter((t) => t.progress > 0 && t.progress < 100).length
  const progressPercent = epicTasks.length > 0 ? Math.round((doneTasks / epicTasks.length) * 100) : 0
  const totalEstimate = epicTasks.reduce((acc, t) => acc + t.estimatedTime, 0)
  const isOverdue = epic.targetDate && epic.targetDate < Date.now() && epic.status !== 'completed'

  // Agent breakdown
  const agentMap = new Map<string, number>()
  for (const t of epicTasks) {
    if (t.assignedAgent) {
      agentMap.set(t.assignedAgent, (agentMap.get(t.assignedAgent) || 0) + 1)
    }
  }

  // Priority breakdown
  const priorityMap: Record<string, number> = {}
  for (const t of epicTasks) {
    priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1
  }

  const startEditing = () => {
    setName(epic.name)
    setIcon(epic.icon)
    setDescription(epic.description)
    setColor(epic.color)
    setStatus(epic.status)
    setStartDate(epic.startDate ? new Date(epic.startDate).toISOString().split('T')[0] : '')
    setTargetDate(epic.targetDate ? new Date(epic.targetDate).toISOString().split('T')[0] : '')
    setEditing(true)
  }

  const saveEdit = () => {
    updateEpic(epic.id, {
      name, icon, description, color, status,
      startDate: startDate ? new Date(startDate).getTime() : null,
      targetDate: targetDate ? new Date(targetDate).getTime() : null,
    })
    setEditing(false)
  }

  const handleDelete = () => {
    epicTasks.forEach((t) => updateTask(t.id, { epicId: null }))
    deleteEpic(epic.id)
    navigate('/epics')
  }

  const daysLeft = epic.targetDate ? Math.ceil((epic.targetDate - Date.now()) / 86400000) : null
  const daysElapsed = epic.startDate ? Math.ceil((Date.now() - epic.startDate) / 86400000) : null
  const totalDays = epic.startDate && epic.targetDate ? Math.ceil((epic.targetDate - epic.startDate) / 86400000) : null
  const timeProgress = totalDays && daysElapsed ? Math.min(100, Math.round((daysElapsed / totalDays) * 100)) : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => navigate('/epics')}>
          <ArrowLeft className="h-4 w-4" /> Эпики
        </Button>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" className="gap-2" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" /> Отмена
              </Button>
              <Button className="gap-2" onClick={saveEdit}>
                <Save className="h-4 w-4" /> Сохранить
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={startEditing}>Редактировать</Button>
              <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Epic info */}
      <Card>
        <div className="h-1.5" style={{ backgroundColor: editing ? color : epic.color }} />
        <CardContent className="pt-6 space-y-4">
          {editing ? (
            <>
              <div className="flex items-start gap-4">
                <IconPicker value={icon} onChange={setIcon} />
                <Input value={name} onChange={(e) => setName(e.target.value)} className="text-lg h-12 font-semibold flex-1" />
              </div>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Описание эпика..." />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Статус</label>
                  <Select value={status} onChange={(e) => setStatus(e.target.value as EpicStatus)}
                    options={[
                      { value: 'planning', label: 'Планирование' },
                      { value: 'active', label: 'Активный' },
                      { value: 'completed', label: 'Завершён' },
                      { value: 'archived', label: 'В архиве' },
                    ]} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Цвет</label>
                  <div className="flex gap-2 pt-1">
                    {EPIC_COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => setColor(c)}
                        className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ backgroundColor: c, borderColor: color === c ? 'var(--foreground)' : 'transparent' }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Дата начала</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Целевая дата</label>
                  <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <DynamicIcon name={epic.icon} className="h-10 w-10 text-muted-foreground" />
                <div>
                  <h1 className="text-2xl font-bold">{epic.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={cn('border', statusBadgeColors[epic.status])}>
                      {statusLabels[epic.status]}
                    </Badge>
                    <Badge variant="outline" className="text-xs gap-1">
                      <ListChecks className="h-3 w-3" /> {epicTasks.length} задач
                    </Badge>
                  </div>
                </div>
              </div>
              {epic.description && <p className="text-muted-foreground">{epic.description}</p>}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                {epic.startDate && (
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4" />
                    Начало: {new Date(epic.startDate).toLocaleDateString('ru-RU')}
                  </div>
                )}
                {epic.targetDate && (
                  <div className={cn('flex items-center gap-1.5', isOverdue && 'text-destructive')}>
                    <CalendarClock className="h-4 w-4" />
                    Цель: {new Date(epic.targetDate).toLocaleDateString('ru-RU')}
                    {daysLeft !== null && (
                      <span className="text-xs">
                        ({daysLeft > 0 ? `${daysLeft} д` : 'просрочен'})
                      </span>
                    )}
                  </div>
                )}
                {totalEstimate > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {totalEstimate} мин ({Math.round(totalEstimate / 60)} ч)
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats cards */}
      {!editing && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{progressPercent}%</p>
                  <p className="text-xs text-muted-foreground">Прогресс</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeTasks}</p>
                  <p className="text-xs text-muted-foreground">В работе</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-foreground/5 dark:bg-primary/10 flex items-center justify-center">
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{doneTasks}<span className="text-sm text-muted-foreground">/{epicTasks.length}</span></p>
                  <p className="text-xs text-muted-foreground">Завершено</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <X className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{failedTasks}</p>
                  <p className="text-xs text-muted-foreground">Провалено</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress — dual bar */}
      {!editing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Прогресс</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Task progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Задачи: {doneTasks} из {epicTasks.length}</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} />
            </div>

            {/* Time progress */}
            {timeProgress !== null && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Время: {daysElapsed} из {totalDays} дней</span>
                  <span>{timeProgress}%</span>
                </div>
                <Progress value={timeProgress} />
                {timeProgress > progressPercent + 15 && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Прогресс задач отстаёт от графика</p>
                )}
              </div>
            )}

            {/* Column distribution bar */}
            {epicTasks.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Распределение по столбцам</p>
                <div className="flex gap-0.5 h-3 rounded-full overflow-hidden bg-muted">
                  {columns.map((col) => {
                    const count = epicTasks.filter((t) => t.status === col.id).length
                    if (count === 0) return null
                    return (
                      <div key={col.id} className="h-full transition-all duration-500"
                        style={{ backgroundColor: col.color, width: `${(count / epicTasks.length) * 100}%` }}
                        title={`${col.title}: ${count}`} />
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {columns.map((col) => {
                    const count = epicTasks.filter((t) => t.status === col.id).length
                    if (count === 0) return null
                    return (
                      <span key={col.id} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                        <DynamicIcon name={col.icon} className="h-3 w-3" /> {col.title}: {count}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agents breakdown */}
      {!editing && agentMap.size > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" /> Агенты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from(agentMap.entries()).map(([agentId, count]) => {
                const ag = agents.find((a) => a.id === agentId)
                if (!ag) return null
                return (
                  <div key={agentId}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/agents/${agentId}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-7 w-7 rounded-lg bg-foreground/5 dark:bg-primary/10 text-[10px] font-bold flex items-center justify-center">
                        {ag.avatar}
                      </div>
                      <span className="text-sm font-medium">{ag.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{count} задач · {ag.successRate}%</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Задачи</CardTitle>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/tasks/new')}>
              <Plus className="h-3.5 w-3.5" /> Новая задача
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {epicTasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Нет привязанных задач</p>
          )}
          {epicTasks.map((task) => {
            const col = columns.find((c) => c.id === task.status)
            const ag = task.assignedAgent ? agents.find((a) => a.id === task.assignedAgent) : null
            const pri = priorityLabels[task.priority]
            return (
              <div key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
                onClick={() => navigate(`/tasks/${task.id}`)}>
                <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <span className={cn('shrink-0', pri.class)} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {ag && (
                      <span className="text-xs text-muted-foreground">{ag.avatar} {ag.name}</span>
                    )}
                    {task.progress > 0 && task.progress < 100 && (
                      <div className="w-16"><Progress value={task.progress} size="sm" /></div>
                    )}
                  </div>
                </div>
                {col && (
                  <Badge variant="outline" className="text-xs gap-1 shrink-0">
                    <DynamicIcon name={col.icon} className="h-3 w-3" /> {col.title}
                  </Badge>
                )}
                <Button size="icon" variant="ghost"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); updateTask(task.id, { epicId: null }) }}
                  title="Отвязать">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}

          {/* Link unassigned tasks */}
          {tasks.filter((t) => t.epicId !== epic.id).length > 0 && (
            <div className="border-t pt-3 mt-3">
              <p className="text-xs text-muted-foreground mb-2">Привязать существующую задачу:</p>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {tasks.filter((t) => t.epicId !== epic.id).map((task) => (
                  <button key={task.id}
                    className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted/50 text-left text-sm transition-colors"
                    onClick={() => updateTask(task.id, { epicId: epic.id })}>
                    <Plus className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
