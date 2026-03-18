import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import type { Task } from '@/lib/types'
import { useAgentsStore } from '@/stores/agents-store'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, CalendarClock, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const priorityColors: Record<string, string> = {
  low: 'bg-slate-500/20 text-slate-300',
  medium: 'bg-blue-500/20 text-blue-300',
  high: 'bg-orange-500/20 text-orange-300',
  critical: 'bg-red-500/15 text-red-400',
}

const priorityDotColors: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
}

interface TaskCardProps {
  task: Task
  isDragOverlay?: boolean
  epicName?: string
  epicColor?: string
}

export function TaskCard({ task, isDragOverlay, epicName }: TaskCardProps) {
  const navigate = useNavigate()
  const { agents } = useAgentsStore()
  const agent = agents.find((a) => a.id === task.assignedAgent)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const doneSubtasks = task.subtasks.filter((s) => s.done).length
  const totalSubtasks = task.subtasks.length
  const isOverdue = task.deadline && task.deadline < Date.now() && task.progress < 100

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-xl border bg-card overflow-hidden cursor-grab active:cursor-grabbing',
        'transition-all duration-200',
        'hover:shadow-lg hover:shadow-foreground/5 dark:hover:shadow-primary/5 hover:border-foreground/10 dark:hover:border-primary/30 hover:-translate-y-0.5',
        isDragging && 'opacity-40 shadow-xl scale-[0.98]',
        isDragOverlay && 'shadow-2xl shadow-foreground/10 dark:shadow-primary/20 rotate-[2deg] scale-105 border-foreground/15 dark:border-primary/40'
      )}
      onClick={() => { if (!isDragging) navigate(`/tasks/${task.id}`) }}
      {...attributes}
      {...listeners}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: task.color || '#3b82f6' }} />

      <div className="p-3 pl-4 space-y-2.5">
        {epicName && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">{epicName}</span>
          </div>
        )}

        <p className="text-sm font-medium leading-snug line-clamp-2">{task.title}</p>

        <div className="flex flex-wrap gap-1">
          <Badge className={cn('text-[10px] px-1.5 py-0 border-0 gap-0.5', priorityColors[task.priority])}>
            <span className={cn('h-2 w-2 rounded-full', priorityDotColors[task.priority])} />
          </Badge>
          {task.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 border-border/50">{tag}</Badge>
          ))}
          {task.tags.length > 2 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/50">+{task.tags.length - 2}</Badge>
          )}
        </div>

        {task.progress > 0 && task.progress < 100 && (
          <div className="space-y-1">
            <Progress value={task.progress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground text-right">{task.progress}%</p>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{task.estimatedTime}м
            </div>
            {totalSubtasks > 0 && (
              <div className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                <span className={doneSubtasks === totalSubtasks ? 'text-green-400' : ''}>{doneSubtasks}/{totalSubtasks}</span>
              </div>
            )}
            {task.deadline && (
              <div className={cn('flex items-center gap-1', isOverdue && 'text-red-400 font-medium')}>
                <CalendarClock className="h-3 w-3" />
                {new Date(task.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
          {agent && (
            <div className="h-5 w-5 rounded-full text-[8px] font-bold flex items-center justify-center ring-1 ring-border bg-muted">
              {agent.avatar}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
