import { useState } from 'react'
import { useEpicsStore } from '@/stores/epics-store'
import { useTasksStore } from '@/stores/tasks-store'
import { useBoardStore } from '@/stores/board-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Plus, Trash2, CalendarClock, ListChecks,
  ChevronDown, ChevronRight, Package,
} from 'lucide-react'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import type { EpicStatus } from '@/lib/types'

const statusLabels: Record<EpicStatus, string> = {
  planning: 'Планирование',
  active: 'Активный',
  completed: 'Завершён',
  archived: 'В архиве',
}

const statusBadgeColors: Record<EpicStatus, string> = {
  planning: 'bg-slate-500/15 text-slate-400',
  active: 'bg-blue-500/15 text-blue-400',
  completed: 'bg-green-500/15 text-green-400',
  archived: 'bg-muted text-muted-foreground',
}

export function EpicsPage() {
  const { epics, deleteEpic } = useEpicsStore()
  const { tasks, updateTask } = useTasksStore()
  const { columns } = useBoardStore()
  const navigate = useNavigate()

  const [expandedEpic, setExpandedEpic] = useState<string | null>(null)

  const getEpicTasks = (epicId: string) => tasks.filter((t) => t.epicId === epicId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Эпики</h1>
          <p className="text-muted-foreground mt-1">Группируйте задачи в эпики для стратегического планирования</p>
        </div>
        <Button onClick={() => navigate('/epics/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Новый эпик
        </Button>
      </div>

      <div className="space-y-4 stagger-children">
        {epics.map((epic) => {
          const epicTasks = getEpicTasks(epic.id)
          const doneTasks = epicTasks.filter((t) => t.status === 'done' || t.progress === 100).length
          const totalTasks = epicTasks.length
          const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
          const isExpanded = expandedEpic === epic.id

          return (
            <Card key={epic.id} className="overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-md"
              onClick={() => navigate(`/epics/${epic.id}`)}>
              <div className="h-1" style={{ backgroundColor: epic.color }} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedEpic(isExpanded ? null : epic.id) }}
                      className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <DynamicIcon name={epic.icon} className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{epic.name}</CardTitle>
                        <Badge className={cn('text-[10px] border-0', statusBadgeColors[epic.status])}>
                          {statusLabels[epic.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{epic.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteEpic(epic.id) }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <Progress value={progressPercent} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ListChecks className="h-3 w-3" />
                        {doneTasks} из {totalTasks} задач
                      </div>
                      <span>{progressPercent}%</span>
                    </div>
                  </div>
                  {epic.targetDate && (
                    <div className={cn(
                      'flex items-center gap-1 text-xs shrink-0',
                      epic.targetDate < Date.now() && epic.status !== 'completed'
                        ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      <CalendarClock className="h-3 w-3" />
                      {new Date(epic.targetDate).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>

                {totalTasks > 0 && (
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
                    {columns.map((col) => {
                      const count = epicTasks.filter((t) => t.status === col.id).length
                      if (count === 0) return null
                      return (
                        <div key={col.id} className="h-full transition-all duration-500"
                          style={{ backgroundColor: col.color, width: `${(count / totalTasks) * 100}%` }}
                          title={`${col.title}: ${count}`} />
                      )
                    })}
                  </div>
                )}

                {isExpanded && (
                  <div className="space-y-2 pt-2 border-t animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                    {epicTasks.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Нет привязанных задач</p>
                    )}
                    {epicTasks.map((task) => {
                      const col = columns.find((c) => c.id === task.status)
                      return (
                        <div key={task.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/tasks/${task.id}`)}>
                          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: task.color }} />
                          <span className="text-sm flex-1 truncate">{task.title}</span>
                          {task.progress > 0 && task.progress < 100 && (
                            <div className="w-16"><Progress value={task.progress} className="h-1" /></div>
                          )}
                          {col && (
                            <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                              <DynamicIcon name={col.icon} className="h-3 w-3" /> {col.title}
                            </Badge>
                          )}
                          <Button size="icon" variant="ghost"
                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); updateTask(task.id, { epicId: null }) }}
                            title="Отвязать от эпика">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {epics.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4 flex justify-center"><Package className="h-12 w-12 text-muted-foreground" /></p>
            <p className="text-muted-foreground">Нет эпиков. Создайте первый!</p>
          </div>
        )}
      </div>
    </div>
  )
}
