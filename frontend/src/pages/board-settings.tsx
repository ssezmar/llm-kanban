import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoardStore } from '@/stores/board-store'
import { useTasksStore } from '@/stores/tasks-store'
import { TransitionGraph } from '@/components/transition-graph'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconPicker } from '@/components/ui/icon-picker'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { ArrowLeft, ArrowRight, Plus, Trash2, RotateCcw } from 'lucide-react'
import { ReactFlowProvider } from '@xyflow/react'

const COLUMN_COLORS = [
  '#64748b', '#3b82f6', '#eab308', '#22c55e', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
]

export function BoardSettingsPage() {
  const navigate = useNavigate()
  const {
    columns, transitions,
    addColumn, updateColumn, removeColumn,
    addTransition, removeTransition,
    resetToDefaults,
  } = useBoardStore()
  const { tasks } = useTasksStore()

  const [newColTitle, setNewColTitle] = useState('')
  const [newColIcon, setNewColIcon] = useState('clipboard-list')
  const [newColColor, setNewColColor] = useState('#3b82f6')
  const [newColLimit, setNewColLimit] = useState('')
  const [newColDesc, setNewColDesc] = useState('')

  const taskCounts: Record<string, number> = {}
  for (const t of tasks) {
    taskCounts[t.status] = (taskCounts[t.status] || 0) + 1
  }

  const handleAddColumn = () => {
    if (!newColTitle.trim()) return
    const id = newColTitle.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-zа-яё0-9_]/gi, '') || `col-${Date.now()}`
    if (columns.some((c) => c.id === id)) return
    addColumn({
      id,
      title: newColTitle.trim(),
      icon: newColIcon,
      description: newColDesc.trim(),
      color: newColColor,
      limit: newColLimit ? parseInt(newColLimit) : undefined,
    })
    setNewColTitle('')
    setNewColLimit('')
    setNewColDesc('')
    setNewColIcon('clipboard-list')
  }

  const handleAddTransition = (from: string, to: string) => {
    addTransition({ from, to })
  }

  const handleRemoveTransition = (from: string, to: string) => {
    removeTransition(from, to)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/board')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Настройки доски</h1>
          <p className="text-sm text-muted-foreground">Столбцы и граф переходов</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={resetToDefaults}>
          <RotateCcw className="h-4 w-4" /> Сбросить
        </Button>
      </div>

      {/* Transition Graph — interactive */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Граф переходов ({transitions.length} правил)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Соедините узлы для добавления перехода. Кликните по стрелке, чтобы удалить. Узлы можно перетаскивать.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <ReactFlowProvider>
            <TransitionGraph
              columns={columns}
              transitions={transitions}
              taskCounts={taskCounts}
              className="h-[500px] border-0 rounded-none"
              interactive
              onAddTransition={handleAddTransition}
              onRemoveTransition={handleRemoveTransition}
            />
          </ReactFlowProvider>
        </CardContent>
      </Card>

      {/* Columns */}
      <Card>
        <CardHeader>
          <CardTitle>Столбцы ({columns.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {columns.map((col) => (
            <div key={col.id} className="p-3 rounded-lg border group space-y-2">
              <div className="flex items-center gap-3">
                <IconPicker value={col.icon} onChange={(icon) => updateColumn(col.id, { icon })} />
                <div className="flex-1 space-y-1">
                  <Input
                    value={col.title}
                    onChange={(e) => updateColumn(col.id, { title: e.target.value })}
                    className="h-9 text-sm font-medium"
                  />
                  <Input
                    value={col.description}
                    onChange={(e) => updateColumn(col.id, { description: e.target.value })}
                    className="h-8 text-xs text-muted-foreground"
                    placeholder="Описание столбца..."
                  />
                </div>
                <Input
                  type="number"
                  value={col.limit || ''}
                  onChange={(e) => updateColumn(col.id, { limit: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="WIP"
                  className="h-9 text-sm w-20"
                  min={0}
                />
                <div className="flex gap-1 flex-wrap">
                  {COLUMN_COLORS.slice(0, 5).map((c) => (
                    <button key={c} type="button" onClick={() => updateColumn(col.id, { color: c })}
                      className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-125"
                      style={{ backgroundColor: c, borderColor: col.color === c ? 'var(--foreground)' : 'transparent' }} />
                  ))}
                </div>
                <Button size="icon" variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeColumn(col.id)} disabled={columns.length <= 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium mb-3">Добавить столбец</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <IconPicker value={newColIcon} onChange={setNewColIcon} />
                <Input value={newColTitle} onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="Название" className="h-10 flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColumn())} />
                <Input type="number" value={newColLimit} onChange={(e) => setNewColLimit(e.target.value)}
                  placeholder="WIP" className="h-10 w-20" min={0} />
                <div className="flex gap-1">
                  {COLUMN_COLORS.slice(0, 5).map((c) => (
                    <button key={c} type="button" onClick={() => setNewColColor(c)}
                      className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-125"
                      style={{ backgroundColor: c, borderColor: newColColor === c ? 'var(--foreground)' : 'transparent' }} />
                  ))}
                </div>
                <Button onClick={handleAddColumn} className="gap-2">
                  <Plus className="h-4 w-4" /> Добавить
                </Button>
              </div>
              <Input value={newColDesc} onChange={(e) => setNewColDesc(e.target.value)}
                placeholder="Описание столбца (необязательно)" className="h-9 text-sm ml-[60px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => navigate('/board')} className="gap-2">
          Готово <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
