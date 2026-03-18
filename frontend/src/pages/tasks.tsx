import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTasksStore } from '@/stores/tasks-store'
import { useAgentsStore } from '@/stores/agents-store'
import { useBoardStore } from '@/stores/board-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Search, Play, Trash2, CalendarClock, Plus } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { cn } from '@/lib/utils'

export function TasksPage() {
  const { tasks, startExecution, deleteTask } = useTasksStore()
  const { agents } = useAgentsStore()
  const { columns } = useBoardStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filtered = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Мониторинг задач</h1>
        <Button onClick={() => navigate('/tasks/new')} className="gap-2">
          <Plus className="h-4 w-4" /> Новая задача
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или тегу..." className="pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Button variant={filterStatus === 'all' ? 'default' : 'outline'} size="sm"
            onClick={() => setFilterStatus('all')}>Все</Button>
          {columns.map((col) => (
            <Button key={col.id} variant={filterStatus === col.id ? 'default' : 'outline'}
              size="sm" onClick={() => setFilterStatus(col.id)} className="gap-1.5">
              <DynamicIcon name={col.icon} className="h-3.5 w-3.5" /> {col.title}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Задачи не найдены</p>
        )}
        {filtered.map((task) => {
          const agent = agents.find((a) => a.id === task.assignedAgent)
          const col = columns.find((c) => c.id === task.status)
          const isOverdue = task.deadline && task.deadline < Date.now() && task.progress < 100
          return (
            <Card key={task.id}
              className="cursor-pointer hover:border-foreground/20 transition-colors overflow-hidden"
              onClick={() => navigate(`/tasks/${task.id}`)}>
              <div className="flex">
                <div className="w-1 shrink-0" style={{ backgroundColor: task.color || '#3b82f6' }} />
                <CardContent className="p-4 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{task.title}</h3>
                        {col && (
                          <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                            <DynamicIcon name={col.icon} className="h-3.5 w-3.5" /> {col.title}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                        ))}
                        {agent && <span className="text-xs text-muted-foreground">Агент: {agent.name}</span>}
                        {task.deadline && (
                          <span className={cn('text-xs flex items-center gap-1', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                            <CalendarClock className="h-3 w-3" />
                            {new Date(task.deadline).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                        {task.subtasks.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Подзадачи: {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.progress > 0 && task.progress < 100 && (
                        <div className="w-24">
                          <Progress value={task.progress} className="h-2" />
                          <p className="text-[10px] text-muted-foreground text-center mt-0.5">{task.progress}%</p>
                        </div>
                      )}
                      {task.assignedAgent && task.progress === 0 && (
                        <Button size="sm" variant="outline" className="gap-1"
                          onClick={(e) => { e.stopPropagation(); startExecution(task.id) }}>
                          <Play className="h-3 w-3" /> Запустить
                        </Button>
                      )}
                      {task.review && <Badge variant="secondary">{task.review.score}/10</Badge>}
                      <Button size="icon" variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
