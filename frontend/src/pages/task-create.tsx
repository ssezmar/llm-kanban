import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTasksStore } from '@/stores/tasks-store'
import { useAgentsStore } from '@/stores/agents-store'
import { useBoardStore } from '@/stores/board-store'
import { useEpicsStore } from '@/stores/epics-store'
import { Stepper } from '@/components/ui/stepper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { TaskPriority } from '@/lib/types'
import { cn } from '@/lib/utils'

const TASK_COLORS = [
  '#3b82f6', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#8b5cf6', '#ec4899', '#14b8a6', '#64748b', '#a855f7',
]

const steps = [
  { title: 'Основное', description: 'Название и описание' },
  { title: 'Промпт', description: 'Задание для агента' },
  { title: 'Параметры', description: 'Приоритет, агент, эпик' },
  { title: 'Детали', description: 'Дедлайн, теги, цвет' },
]

export function TaskCreatePage() {
  const navigate = useNavigate()
  const { addTask } = useTasksStore()
  const { agents } = useAgentsStore()
  const { columns } = useBoardStore()
  const { epics } = useEpicsStore()

  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [agentId, setAgentId] = useState('')
  const [epicId, setEpicId] = useState('')
  const [status, setStatus] = useState(columns[0]?.id || 'backlog')
  const [tags, setTags] = useState('')
  const [estimatedTime, setEstimatedTime] = useState(30)
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState('#3b82f6')

  const canNext = () => {
    if (step === 0) return title.trim().length > 0
    if (step === 1) return prompt.trim().length > 0
    return true
  }

  const handleSubmit = () => {
    addTask({
      title,
      description,
      prompt,
      status,
      priority,
      assignedAgent: agentId || null,
      epicId: epicId || null,
      estimatedTime,
      deadline: deadline ? new Date(deadline).getTime() : null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      subtasks: [],
      comments: [],
      color,
    })
    navigate('/board')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Новая задача</h1>
          <p className="text-sm text-muted-foreground">Заполните информацию по шагам</p>
        </div>
      </div>

      <Stepper steps={steps} currentStep={step} />

      <Card>
        <CardContent className="pt-6">
          {/* Step 0: Basic info */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="space-y-2">
                <label className="text-sm font-medium">Название задачи</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Что нужно сделать?"
                  className="text-lg h-12"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Подробное описание задачи..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Столбец</label>
                <div className="flex gap-2 flex-wrap">
                  {columns.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setStatus(col.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
                        status === col.id
                          ? 'border-foreground/30 bg-muted font-medium'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <span>{col.emoji}</span>
                      {col.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Prompt */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="space-y-2">
                <label className="text-sm font-medium">Промпт для LLM-агента</label>
                <p className="text-xs text-muted-foreground">
                  Опишите задачу так, как её должен получить агент
                </p>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Реализуй..."
                  rows={8}
                  className="font-mono text-sm"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Step 2: Parameters */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="space-y-2">
                <label className="text-sm font-medium">Приоритет</label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { v: 'low', l: 'Низкий', e: '🟢' },
                    { v: 'medium', l: 'Средний', e: '🔵' },
                    { v: 'high', l: 'Высокий', e: '🟠' },
                    { v: 'critical', l: 'Критический', e: '🔴' },
                  ] as const).map((p) => (
                    <button
                      key={p.v}
                      type="button"
                      onClick={() => setPriority(p.v)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border text-sm transition-all',
                        priority === p.v
                          ? 'border-foreground/30 bg-muted font-medium'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <span>{p.e}</span>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Агент</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAgentId('')}
                    className={cn(
                      'p-3 rounded-lg border text-sm text-left transition-all',
                      !agentId ? 'border-foreground/30 bg-muted' : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <p className="font-medium">Не назначен</p>
                    <p className="text-xs text-muted-foreground">Назначить позже</p>
                  </button>
                  {agents.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAgentId(a.id)}
                      className={cn(
                        'p-3 rounded-lg border text-sm text-left transition-all',
                        agentId === a.id ? 'border-foreground/30 bg-muted' : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <p className="font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.successRate}% успеха · {a.status === 'idle' ? 'Свободен' : a.status === 'busy' ? 'Занят' : 'Оффлайн'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Эпик</label>
                <Select
                  value={epicId}
                  onChange={(e) => setEpicId(e.target.value)}
                  options={[
                    { value: '', label: 'Без эпика' },
                    ...epics.filter((e) => e.status !== 'archived').map((e) => ({ value: e.id, label: `${e.emoji} ${e.name}` })),
                  ]}
                />
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Дедлайн</label>
                  <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Оценка времени (мин)</label>
                  <Input type="number" value={estimatedTime} onChange={(e) => setEstimatedTime(+e.target.value)} min={5} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Теги (через запятую)</label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="backend, api, auth" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Цвет карточки</label>
                <div className="flex gap-2">
                  {TASK_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: color === c ? 'var(--foreground)' : 'transparent',
                        boxShadow: color === c ? `0 0 0 2px ${c}40` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {step > 0 ? 'Назад' : 'Отмена'}
        </Button>
        {step < steps.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="gap-2"
          >
            Далее
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canNext()} className="gap-2">
            <Check className="h-4 w-4" />
            Создать задачу
          </Button>
        )}
      </div>
    </div>
  )
}
