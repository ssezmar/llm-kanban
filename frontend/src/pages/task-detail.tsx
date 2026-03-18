import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTasksStore } from '@/stores/tasks-store'
import { useAgentsStore } from '@/stores/agents-store'
import { useBoardStore } from '@/stores/board-store'
import { useAuthStore } from '@/stores/auth-store'
import { useEpicsStore } from '@/stores/epics-store'
import { useUsersStore } from '@/stores/users-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/select'
import {
  ArrowLeft, Play, Clock, MessageSquare, Terminal, Star,
  CalendarClock, Plus, Trash2, CheckSquare, Square, Send,
  Save, X, Pencil, User, Bot, Tag, Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskPriority } from '@/lib/types'

const TASK_COLORS = [
  '#3b82f6', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#8b5cf6', '#ec4899', '#14b8a6', '#64748b', '#a855f7',
]

const logTypeColors: Record<string, string> = {
  info: 'text-blue-400',
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
}

const logTypeIcons: Record<string, string> = {
  info: '○',
  success: '✓',
  error: '✗',
  warning: '△',
}

const priorityConfig: Record<TaskPriority, { label: string; emoji: string; class: string }> = {
  low: { label: 'Низкий', emoji: '🟢', class: 'bg-green-500/10 text-green-600 border-green-500/20' },
  medium: { label: 'Средний', emoji: '🔵', class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  high: { label: 'Высокий', emoji: '🟠', class: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  critical: { label: 'Критический', emoji: '🔴', class: 'bg-red-500/10 text-red-600 border-red-500/20' },
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    tasks, updateTask, startExecution, moveTask, assignAgent,
    addSubtask, toggleSubtask, removeSubtask,
    addComment, removeComment,
  } = useTasksStore()
  const { agents } = useAgentsStore()
  const { columns, getAllowedTargets } = useBoardStore()
  const { user } = useAuthStore()
  const { epics } = useEpicsStore()
  const { getUser } = useUsersStore()

  const [editing, setEditing] = useState(false)
  const [newSubtask, setNewSubtask] = useState('')
  const [commentText, setCommentText] = useState('')

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPrompt, setEditPrompt] = useState('')
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium')
  const [editAgent, setEditAgent] = useState('')
  const [editEpic, setEditEpic] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editTime, setEditTime] = useState(30)
  const [editDeadline, setEditDeadline] = useState('')
  const [editColor, setEditColor] = useState('#3b82f6')

  const task = tasks.find((t) => t.id === id)
  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Задача не найдена</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/tasks')}>Вернуться</Button>
      </div>
    )
  }

  const agent = agents.find((a) => a.id === task.assignedAgent)
  const currentCol = columns.find((c) => c.id === task.status)
  const epic = task.epicId ? epics.find((e) => e.id === task.epicId) : null
  const creator = task.createdBy ? getUser(task.createdBy) : null
  const allowedTargets = getAllowedTargets(task.status)
  const targetColumns = columns.filter((c) => allowedTargets.includes(c.id) && c.id !== task.status)
  const isOverdue = task.deadline && task.deadline < Date.now() && task.progress < 100
  const doneSubtasks = task.subtasks.filter((s) => s.done).length
  const pri = priorityConfig[task.priority]

  const startEditing = () => {
    setEditTitle(task.title)
    setEditDesc(task.description)
    setEditPrompt(task.prompt)
    setEditPriority(task.priority)
    setEditAgent(task.assignedAgent || '')
    setEditEpic(task.epicId || '')
    setEditStatus(task.status)
    setEditTags(task.tags.join(', '))
    setEditTime(task.estimatedTime)
    setEditDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '')
    setEditColor(task.color)
    setEditing(true)
  }

  const saveEdit = () => {
    updateTask(task.id, {
      title: editTitle,
      description: editDesc,
      prompt: editPrompt,
      priority: editPriority,
      assignedAgent: editAgent || null,
      epicId: editEpic || null,
      status: editStatus,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
      estimatedTime: editTime,
      deadline: editDeadline ? new Date(editDeadline).getTime() : null,
      color: editColor,
    })
    setEditing(false)
  }

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return
    addSubtask(task.id, newSubtask.trim())
    setNewSubtask('')
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return
    addComment(task.id, user?.name || 'Аноним', commentText.trim())
    setCommentText('')
  }

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`
    return `${Math.floor(diff / 86400000)} д назад`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Назад
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
            <Button variant="outline" className="gap-2" onClick={startEditing}>
              <Pencil className="h-4 w-4" /> Редактировать
            </Button>
          )}
        </div>
      </div>

      {/* Title & meta — editable */}
      <Card>
        <div className="h-1.5" style={{ backgroundColor: editing ? editColor : task.color }} />
        <CardContent className="pt-5 space-y-3">
          {editing ? (
            <div className="space-y-4">
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-lg h-12 font-semibold" />
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} placeholder="Описание..." />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Столбец</label>
                  <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                    options={columns.map((c) => ({ value: c.id, label: `${c.emoji} ${c.title}` }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Приоритет</label>
                  <Select value={editPriority} onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    options={[
                      { value: 'low', label: '🟢 Низкий' }, { value: 'medium', label: '🔵 Средний' },
                      { value: 'high', label: '🟠 Высокий' }, { value: 'critical', label: '🔴 Критический' },
                    ]} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Агент</label>
                  <Select value={editAgent} onChange={(e) => setEditAgent(e.target.value)}
                    options={[{ value: '', label: 'Не назначен' }, ...agents.map((a) => ({ value: a.id, label: a.name }))]} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Эпик</label>
                  <Select value={editEpic} onChange={(e) => setEditEpic(e.target.value)}
                    options={[{ value: '', label: 'Без эпика' }, ...epics.filter((e) => e.status !== 'archived').map((e) => ({ value: e.id, label: `${e.emoji} ${e.name}` }))]} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Дедлайн</label>
                  <Input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Оценка (мин)</label>
                  <Input type="number" value={editTime} onChange={(e) => setEditTime(+e.target.value)} min={1} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Теги</label>
                <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="backend, api" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Промпт для агента</label>
                <Textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} rows={4} className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Цвет</label>
                <div className="flex gap-2">
                  {TASK_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setEditColor(c)}
                      className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: c, borderColor: editColor === c ? 'var(--foreground)' : 'transparent' }} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{task.title}</h1>
                  <p className="text-muted-foreground">{task.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {currentCol && (
                  <Badge variant="outline" className="gap-1.5">
                    <span>{currentCol.emoji}</span> {currentCol.title}
                  </Badge>
                )}
                <Badge variant="outline" className={cn('gap-1.5 border', pri.class)}>
                  <Flame className="h-3 w-3" /> {pri.label}
                </Badge>
                {epic && (
                  <Badge variant="outline" className="gap-1.5 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => navigate(`/epics/${epic.id}`)}>
                    <span>{epic.emoji}</span> {epic.name}
                  </Badge>
                )}
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs gap-1">
                    <Tag className="h-2.5 w-2.5" /> {tag}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info cards */}
      {!editing && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-5 pb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" /> Время
              </div>
              <p className="text-xl font-bold">{task.estimatedTime} мин</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Создана: {new Date(task.createdAt).toLocaleDateString('ru-RU')}</p>
                <p>Обновлена: {timeAgo(task.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Прогресс</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold">{task.progress}%</span>
                {task.subtasks.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({doneSubtasks}/{task.subtasks.length} подзадач)
                  </span>
                )}
              </div>
              <Progress value={task.progress} animated />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarClock className="h-4 w-4" /> Дедлайн
              </div>
              {task.deadline ? (
                <>
                  <p className={cn('text-xl font-bold', isOverdue && 'text-destructive')}>
                    {new Date(task.deadline).toLocaleDateString('ru-RU')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isOverdue ? 'Просрочена!' : `Осталось ${Math.ceil((task.deadline - Date.now()) / 86400000)} д`}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Не задан</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Bot className="h-4 w-4" /> Агент
              </div>
              {agent ? (
                <div
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/agents/${agent.id}`)}
                >
                  <div className="h-9 w-9 rounded-lg bg-foreground/5 dark:bg-primary/10 text-xs font-bold flex items-center justify-center">
                    {agent.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.successRate}% успешность</p>
                  </div>
                </div>
              ) : (
                <Select value={task.assignedAgent || ''} onChange={(e) => assignAgent(task.id, e.target.value)}
                  options={[{ value: '', label: 'Выберите' }, ...agents.filter((a) => a.status !== 'offline').map((a) => ({ value: a.id, label: a.name }))]} />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Creator info */}
      {!editing && creator && (
        <div className="flex items-center gap-3 px-1">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Создал:</span>
          <button
            className="flex items-center gap-2 text-sm hover:underline"
            onClick={() => navigate(`/users/${creator.id}`)}
          >
            <div className="h-6 w-6 rounded-full bg-foreground/5 dark:bg-primary/10 text-[9px] font-bold flex items-center justify-center">
              {creator.avatar}
            </div>
            {creator.name}
          </button>
          {creator.position && (
            <span className="text-xs text-muted-foreground">· {creator.position}</span>
          )}
        </div>
      )}

      {/* Actions */}
      {!editing && targetColumns.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {task.assignedAgent && task.status !== 'executing' && (
            <Button size="sm" className="gap-1" onClick={() => startExecution(task.id)}>
              <Play className="h-3 w-3" /> Запустить агента
            </Button>
          )}
          {targetColumns.map((col) => (
            <Button key={col.id} size="sm" variant="outline" className="gap-1.5"
              onClick={() => moveTask(task.id, col.id)}>
              <span>{col.emoji}</span> {col.title}
            </Button>
          ))}
        </div>
      )}

      {/* Prompt */}
      {!editing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Промпт для агента
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/50 border p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {task.prompt}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subtasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckSquare className="h-5 w-5" /> Подзадачи
            {task.subtasks.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">{doneSubtasks}/{task.subtasks.length}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {task.subtasks.length > 0 && (
            <Progress value={task.subtasks.length > 0 ? (doneSubtasks / task.subtasks.length) * 100 : 0} size="sm" className="mb-3" />
          )}
          {task.subtasks.map((st) => (
            <div key={st.id} className="flex items-center gap-2 group/st">
              <button onClick={() => toggleSubtask(task.id, st.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                {st.done ? <CheckSquare className="h-4 w-4 text-foreground" /> : <Square className="h-4 w-4" />}
              </button>
              <span className={cn('text-sm flex-1', st.done && 'line-through text-muted-foreground')}>{st.title}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover/st:opacity-100"
                onClick={() => removeSubtask(task.id, st.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="Добавить подзадачу..." className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())} />
            <Button size="sm" className="h-8 gap-1" onClick={handleAddSubtask}><Plus className="h-3 w-3" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs — enhanced timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Terminal className="h-5 w-5" /> Логи выполнения
            {task.logs.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">{task.logs.length}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {task.logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Логи пока отсутствуют</p>
          ) : (
            <div className="relative pl-6 space-y-3 max-h-[400px] overflow-y-auto">
              {/* Timeline line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
              {task.logs.map((log, i) => (
                <div key={i} className="relative flex gap-3">
                  <div className={cn(
                    'absolute left-[-15px] top-1.5 h-3 w-3 rounded-full border-2 border-card',
                    log.type === 'success' ? 'bg-green-500' :
                    log.type === 'error' ? 'bg-red-500' :
                    log.type === 'warning' ? 'bg-yellow-500' : 'bg-muted-foreground'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm', logTypeColors[log.type])}>{log.message}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString('ru-RU')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review */}
      {task.review && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Star className="h-5 w-5" /> Ревью</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className={cn(
                    'h-3 w-3 rounded-sm',
                    i < task.review!.score ? 'bg-foreground/70 dark:bg-primary/70' : 'bg-muted'
                  )} />
                ))}
              </div>
              <span className="text-2xl font-bold">{task.review.score}<span className="text-sm text-muted-foreground">/10</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{task.review.reviewer}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{new Date(task.review.timestamp).toLocaleDateString('ru-RU')}</span>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{task.review.comment}</p>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Комментарии
            {task.comments.length > 0 && <span className="text-sm font-normal text-muted-foreground">{task.comments.length}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.comments.map((c) => (
            <div key={c.id} className="flex gap-3 group/comment">
              <div className="h-8 w-8 rounded-lg bg-foreground/5 dark:bg-primary/10 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {c.author.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.author}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(c.timestamp)}</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover/comment:opacity-100"
                    onClick={() => removeComment(task.id, c.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
                <p className="text-sm mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-1 border-t">
            <div className="h-8 w-8 rounded-lg bg-foreground/5 dark:bg-primary/10 text-[10px] font-bold flex items-center justify-center shrink-0 mt-1">
              {user?.avatar || '??'}
            </div>
            <div className="flex-1">
              <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)}
                placeholder="Написать комментарий..." className="min-h-[36px] text-sm" rows={1}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }} />
            </div>
            <Button size="icon" className="h-9 w-9 shrink-0 mt-1" onClick={handleAddComment}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
