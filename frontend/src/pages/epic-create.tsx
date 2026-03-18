import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEpicsStore } from '@/stores/epics-store'
import { Stepper } from '@/components/ui/stepper'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EpicStatus } from '@/lib/types'

const EPIC_COLORS = [
  '#3b82f6', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#a855f7',
]

const steps = [
  { title: 'Основное', description: 'Название и эмодзи' },
  { title: 'Описание', description: 'Детали эпика' },
  { title: 'Сроки', description: 'Даты и статус' },
]

export function EpicCreatePage() {
  const navigate = useNavigate()
  const { addEpic } = useEpicsStore()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🚀')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [status, setStatus] = useState<EpicStatus>('planning')
  const [startDate, setStartDate] = useState('')
  const [targetDate, setTargetDate] = useState('')

  const canNext = () => {
    if (step === 0) return name.trim().length > 0
    return true
  }

  const handleSubmit = () => {
    addEpic({
      name,
      emoji,
      description,
      color,
      status,
      startDate: startDate ? new Date(startDate).getTime() : null,
      targetDate: targetDate ? new Date(targetDate).getTime() : null,
    })
    navigate('/epics')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Новый эпик</h1>
          <p className="text-sm text-muted-foreground">Создайте эпик для группировки задач</p>
        </div>
      </div>

      <Stepper steps={steps} currentStep={step} />

      <Card>
        <CardContent className="pt-6">
          {step === 0 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-start gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Эмодзи</label>
                  <EmojiPicker value={emoji} onChange={setEmoji} />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Название эпика</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Название эпика"
                    className="text-lg h-12"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Цвет</label>
                <div className="flex gap-2">
                  {EPIC_COLORS.map((c) => (
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

          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="space-y-2">
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите цели и скоуп этого эпика..."
                  rows={6}
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="space-y-2">
                <label className="text-sm font-medium">Статус</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { v: 'planning', l: 'Планирование', e: '📝' },
                    { v: 'active', l: 'Активный', e: '🔨' },
                    { v: 'completed', l: 'Завершён', e: '✅' },
                    { v: 'archived', l: 'В архиве', e: '📦' },
                  ] as const).map((s) => (
                    <button
                      key={s.v}
                      type="button"
                      onClick={() => setStatus(s.v)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border text-sm transition-all text-left',
                        status === s.v
                          ? 'border-foreground/30 bg-muted font-medium'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <span>{s.e}</span>
                      {s.l}
                    </button>
                  ))}
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
            </div>
          )}
        </CardContent>
      </Card>

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
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-2">
            Далее <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canNext()} className="gap-2">
            <Check className="h-4 w-4" />
            Создать эпик
          </Button>
        )}
      </div>
    </div>
  )
}
