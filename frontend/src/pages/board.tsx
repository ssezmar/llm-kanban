import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, DragOverlay, closestCorners, PointerSensor,
  useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { useTasksStore } from '@/stores/tasks-store'
import { useBoardStore } from '@/stores/board-store'
import { useEpicsStore } from '@/stores/epics-store'
import type { Task } from '@/lib/types'
import { KanbanColumn } from '@/components/kanban-column'
import { TaskCard } from '@/components/task-card'
import { Button } from '@/components/ui/button'
import { Plus, Settings } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/dynamic-icon'

type DragHighlight = 'allowed' | 'current' | 'blocked' | null

export function BoardPage() {
  const navigate = useNavigate()
  const { tasks, moveTask } = useTasksStore()
  const { columns, canTransition, getAllowedTargets } = useBoardStore()
  const { epics } = useEpicsStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const columnHighlights = useMemo(() => {
    const map: Record<string, DragHighlight> = {}
    if (!activeTask) return map
    const allowed = getAllowedTargets(activeTask.status)
    for (const col of columns) {
      if (col.id === activeTask.status) map[col.id] = 'current'
      else if (allowed.includes(col.id)) map[col.id] = 'allowed'
      else map[col.id] = 'blocked'
    }
    return map
  }, [activeTask, columns, getAllowedTargets])

  const epicMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string; icon: string }>()
    for (const task of tasks) {
      if (task.epicId) {
        const epic = epics.find((e) => e.id === task.epicId)
        if (epic) map.set(task.id, { name: epic.name, color: epic.color, icon: epic.icon })
      }
    }
    return map
  }, [tasks, epics])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return
    const taskId = active.id as string
    let targetStatus: string | undefined
    if (columns.some((c) => c.id === over.id)) {
      targetStatus = over.id as string
    } else {
      const overTask = tasks.find((t) => t.id === over.id)
      if (overTask) targetStatus = overTask.status
    }
    if (targetStatus) {
      const task = tasks.find((t) => t.id === taskId)
      if (task && task.status !== targetStatus && canTransition(task.status, targetStatus)) {
        moveTask(taskId, targetStatus)
      }
    }
  }

  const gridCols =
    columns.length <= 3 ? 'lg:grid-cols-3'
    : columns.length === 4 ? 'lg:grid-cols-4'
    : columns.length === 5 ? 'lg:grid-cols-5'
    : 'lg:grid-cols-6'

  const activeEpic = activeTask ? epicMap.get(activeTask.id) : undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Канбан-доска</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/board/settings')} className="gap-2">
            <Settings className="h-4 w-4" /> Настройки
          </Button>
          <Button onClick={() => navigate('/tasks/new')} className="gap-2">
            <Plus className="h-4 w-4" /> Новая задача
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners}
        onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4`}>
          {columns.map((col) => (
            <KanbanColumn key={col.id} column={col}
              tasks={tasks.filter((t) => t.status === col.id)} epicMap={epicMap}
              dragHighlight={columnHighlights[col.id] ?? null}
              isDragging={!!activeTask} />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="w-[280px]">
              <TaskCard task={activeTask} isDragOverlay
                epicName={activeEpic?.name}
                epicColor={activeEpic?.color} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
