import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task, Column } from '@/lib/types'
import { TaskCard } from './task-card'
import { cn } from '@/lib/utils'

type DragHighlight = 'allowed' | 'current' | 'blocked' | null

interface KanbanColumnProps {
  column: Column
  tasks: Task[]
  epicMap?: Map<string, { name: string; color: string; emoji: string }>
  dragHighlight?: DragHighlight
  isDragging?: boolean
}

export function KanbanColumn({ column, tasks, epicMap, dragHighlight = null, isDragging = false }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const isOverLimit = column.limit !== undefined && column.limit > 0 && tasks.length > column.limit
  const isAllowed = dragHighlight === 'allowed'
  const isBlocked = dragHighlight === 'blocked'
  const isCurrent = dragHighlight === 'current'

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl min-h-[500px] transition-all duration-300',
        'bg-muted/30 border',
        // Default state
        !isDragging && 'border-transparent',
        // Current column (where card came from)
        isCurrent && 'border-muted-foreground/20 opacity-60',
        // Allowed target
        isAllowed && !isOver && 'border-foreground/20 dark:border-primary/30 bg-foreground/[0.02] dark:bg-primary/[0.03] shadow-md',
        // Allowed + hovering over it
        isAllowed && isOver && 'border-foreground/30 dark:border-primary/50 bg-foreground/[0.04] dark:bg-primary/[0.06] shadow-lg shadow-foreground/5 dark:shadow-primary/10 scale-[1.02]',
        // Blocked target
        isBlocked && 'opacity-40 border-transparent',
        // No drag active, but hovering (for reorder within column)
        !isDragging && isOver && 'bg-foreground/[0.02] dark:bg-primary/[0.04] border-foreground/10 dark:border-primary/20 shadow-lg shadow-foreground/5 dark:shadow-primary/5 scale-[1.01]'
      )}
    >
      <div className="flex items-center justify-between p-3 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{column.emoji}</span>
          <h3 className="font-semibold text-sm tracking-tight">{column.title}</h3>
        </div>
        <span
          className={cn(
            'text-xs rounded-md px-2 py-0.5 font-medium tabular-nums',
            isOverLimit
              ? 'bg-destructive/15 text-destructive'
              : 'text-muted-foreground bg-muted/80'
          )}
        >
          {tasks.length}
          {column.limit ? ` / ${column.limit}` : ''}
        </span>
      </div>

      {/* Column description — always visible as subtle text, highlighted when allowed target */}
      <div className={cn(
        'px-3 pb-2 transition-all duration-300 overflow-hidden',
        isDragging && isAllowed ? 'max-h-12 opacity-100' : 'max-h-8 opacity-50'
      )}>
        <p className={cn(
          'text-[11px] leading-tight line-clamp-2',
          isDragging && isAllowed ? 'text-foreground/70 dark:text-primary/60' : 'text-muted-foreground/60'
        )}>
          {column.description}
        </p>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1 p-2 pt-0">
          {tasks.map((task) => {
            const epic = epicMap?.get(task.id)
            return (
              <TaskCard
                key={task.id}
                task={task}
                epicName={epic ? `${epic.emoji} ${epic.name}` : undefined}
                epicColor={epic?.color}
              />
            )
          })}
          {tasks.length === 0 && (
            <div className={cn(
              'flex-1 flex items-center justify-center min-h-[80px] rounded-lg border border-dashed transition-colors',
              isAllowed && isOver
                ? 'border-foreground/20 dark:border-primary/30 bg-foreground/[0.02] dark:bg-primary/[0.03]'
                : 'border-border/50',
              isAllowed && !isOver && 'border-foreground/10 dark:border-primary/20'
            )}>
              <p className="text-xs text-muted-foreground/60">
                {isDragging && isAllowed ? 'Перетащите сюда ↓' : 'Перетащите сюда'}
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
