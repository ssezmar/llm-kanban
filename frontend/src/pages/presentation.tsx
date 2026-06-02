import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { SnakeBackdrop } from '@/components/snake-backdrop'
import { CodeStream } from '@/components/code-stream'
import { HeroIllustration } from '@/components/animated-robot'
import {
  ArrowLeft, ArrowRight, X, Maximize2, Minimize2, Bot, ZoomIn, ZoomOut, RotateCcw,
  EyeOff, CircleDollarSign, ShieldAlert, Plug, Server, Radio, Database,
  MonitorSmartphone, Boxes, Activity, Tags, Gauge, Wallet, TrendingUp,
  KanbanSquare, GitPullRequest, BarChart3, Check, Sparkles,
  Layers, Cpu, Network, Github, Circle,
  Workflow, FlaskConical, FileImage, ListChecks, Figma, MessageCircle,
} from 'lucide-react'
import * as D from '@/lib/presentation-data'

const ICONS: Record<string, typeof Bot> = {
  EyeOff, CircleDollarSign, ShieldAlert, Plug, Server, Radio, Database,
  MonitorSmartphone, Boxes, Activity, Tags, Gauge, Wallet, TrendingUp,
  KanbanSquare, GitPullRequest, BarChart3,
}
function Ic({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] || Circle
  return <C className={className} />
}

function Reveal({ show, children, delay = 0, className }: { show: boolean; children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={cn('transition-all duration-500 ease-out', show ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-[2px]', className)}
      style={{ transitionDelay: show ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

function Shell({ section, title, icon: Icon, children }: { section: string; title: string; icon: typeof Bot; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 text-primary flex items-center justify-center shrink-0 ring-1 ring-primary/20">
          <span className="absolute inset-0 rounded-xl bg-primary/20 blur-md animate-pulse-glow" />
          <Icon className="relative h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{section}</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{title}</h2>
        </div>
      </div>
      {children}
    </div>
  )
}

const card = 'rounded-xl border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-foreground/5'

// Animated count-up for numeric stats
function CountUp({ value }: { value: string }) {
  const num = parseInt(value, 10)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (Number.isNaN(num)) return
    let raf = 0, start = 0
    const dur = 900
    const tick = (t: number) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / dur)
      setN(Math.round(num * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [num])
  if (Number.isNaN(num)) return <>{value}</>
  return <>{n}{value.replace(/^\d+/, '')}</>
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

// ── Full image viewer: zoom (wheel/buttons) + pan (drag) ──
function ImageViewer({ src, cap, onClose }: { src: string; cap: string; onClose: () => void }) {
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number } | null>(null)
  // Portal into the active fullscreen element — a portal to document.body is
  // invisible while the presentation is in fullscreen.
  const [target] = useState<HTMLElement>(() => (document.fullscreenElement as HTMLElement) || document.body)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === '+' || e.key === '=') setScale((s) => clamp(s * 1.2, 1, 8))
      else if (e.key === '-') setScale((s) => clamp(s / 1.2, 1, 8))
      else if (e.key === '0') { setScale(1); setPos({ x: 0, y: 0 }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const zoomBy = (f: number) => setScale((s) => { const ns = clamp(s * f, 1, 8); if (ns === 1) setPos({ x: 0, y: 0 }); return ns })
  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }) }

  return createPortal(
    <div
      data-viewer
      className="fixed inset-0 z-[70] bg-black/95 flex flex-col animate-fade-in"
      onWheel={(e) => zoomBy(e.deltaY < 0 ? 1.15 : 0.87)}
      onMouseMove={(e) => { if (drag.current) setPos({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }) }}
      onMouseUp={() => { drag.current = null }}
      onMouseLeave={() => { drag.current = null }}
    >
      {/* Prominent close button */}
      <button
        onClick={onClose}
        onMouseDown={(e) => e.stopPropagation()}
        title="Закрыть (Esc)"
        className="absolute top-3 right-3 z-10 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors ring-1 ring-white/20"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 h-12 pr-20 text-white/80 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
        <span className="mr-auto text-sm truncate">{cap}</span>
        <button onClick={() => zoomBy(0.83)} className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center" title="Уменьшить (−)"><ZoomOut className="h-4 w-4" /></button>
        <span className="text-xs tabular-nums w-12 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={() => zoomBy(1.2)} className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center" title="Увеличить (+)"><ZoomIn className="h-4 w-4" /></button>
        <button onClick={reset} className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center" title="Сброс (0)"><RotateCcw className="h-4 w-4" /></button>
      </div>
      {/* Canvas */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center"
        style={{ cursor: scale > 1 ? (drag.current ? 'grabbing' : 'grab') : 'zoom-in' }}
        onMouseDown={(e) => { if (scale > 1) drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; else zoomBy(2) }}
        onDoubleClick={() => (scale > 1 ? reset() : setScale(2.5))}
      >
        <img
          src={src} alt={cap} draggable={false}
          className="max-w-[94vw] max-h-[80vh] object-contain select-none rounded bg-white"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, transition: drag.current ? 'none' : 'transform 0.15s ease-out' }}
        />
      </div>
      <p className="text-center text-[11px] text-white/40 pb-2 shrink-0">колесо — зум · перетаскивание — панорама · двойной клик — приблизить</p>
    </div>,
    target,
  )
}

// ── Interactive diagram gallery (tabs + open viewer) ──
function DiagramTabs({ items, heightClass = 'max-h-[52vh]' }: { items: D.Diagram[]; heightClass?: string }) {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const it = items[Math.min(active, items.length - 1)]
  return (
    <div className="space-y-2">
      {items.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((d, i) => (
            <button key={d.src} onClick={() => setActive(i)}
              className={cn('text-xs px-3 py-1.5 rounded-full border transition-colors', i === active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground hover:text-foreground')}>
              {d.label}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(true)} className="group relative block w-full rounded-xl border bg-white overflow-hidden transition-all duration-300 hover:ring-2 hover:ring-primary/40 hover:shadow-xl hover:shadow-foreground/10">
        <img src={it.src} alt={it.label} className={cn('w-full object-contain mx-auto', heightClass)} />
        <span className="absolute top-2 right-2 h-8 px-2 gap-1 rounded-lg bg-black/55 text-white flex items-center text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="h-4 w-4" /> Открыть
        </span>
      </button>
      <p className="text-xs text-muted-foreground">{it.cap}</p>
      {open && <ImageViewer src={it.src} cap={it.cap} onClose={() => setOpen(false)} />}
    </div>
  )
}

// ── Slides ──────────────────────────────────────────────────────────────

function SlideTitle() {
  return (
    <div className="w-full max-w-3xl mx-auto text-center space-y-5">
      <p className="text-xs sm:text-sm text-muted-foreground animate-fade-in-up">{D.meta.org}</p>
      <p className="text-xs text-muted-foreground/80 animate-fade-in-up" style={{ animationDelay: '80ms' }}>{D.meta.institute} · {D.meta.department}</p>
      <div className="flex justify-center py-1 animate-scale-in" style={{ animationDelay: '150ms' }}>
        <div className="relative"><Bot className="h-14 w-14 text-foreground dark:text-primary" /><div className="absolute inset-0 blur-2xl bg-foreground/10 dark:bg-primary/30" /></div>
      </div>
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] animate-fade-in-up" style={{ animationDelay: '220ms' }}>
        <span className="gradient-text">{D.meta.title}</span>
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        {D.meta.discipline}<br /><span className="text-xs">{D.meta.direction} · {D.meta.code}</span>
      </p>
      <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto pt-1 stagger-children">
        {D.heroStats.map((s) => (
          <div key={s.label} className={card}><p className="text-2xl font-bold"><CountUp value={s.value} /></p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p></div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-8 pt-3 text-sm animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Студент</p><p className="font-medium">{D.meta.student} · гр. {D.meta.group}</p></div>
        <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Руководитель</p><p className="font-medium">{D.meta.supervisor}</p></div>
      </div>
      <p className="text-xs text-muted-foreground">{D.meta.city} · {D.meta.year}</p>
    </div>
  )
}

function SlideProblem({ step }: { step: number }) {
  return (
    <Shell section="Постановка задачи" title="Оркестрация LLM-агентов как единой команды" icon={Tags}>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Reveal show={step >= 0}><p className="text-sm font-semibold text-muted-foreground">Проблемы ручной работы с LLM:</p></Reveal>
          <div className="grid sm:grid-cols-2 gap-3">
            {D.problems.map((p, i) => (
              <Reveal key={p.title} show={step >= 0} delay={i * 80}>
                <div className={cn(card, 'h-full')}>
                  <div className="flex items-center gap-2 mb-1"><Ic name={p.icon} className="h-4 w-4 text-destructive" /><span className="text-sm font-semibold">{p.title}</span></div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal show={step >= 1}>
            <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-4 space-y-1.5">
              <p className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Решение — платформа LLM Kanban</p>
              {D.solutions.map((s, i) => (
                <Reveal key={i} show={step >= 1} delay={i * 70}><p className="text-xs text-muted-foreground flex items-start gap-2"><Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />{s}</p></Reveal>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal show={step >= 2} className="space-y-3">
          <DiagramTabs items={D.diagrams.usecase} heightClass="max-h-[42vh]" />
          <div className="flex flex-wrap gap-1.5">
            {D.actors.map((a) => <span key={a.name} className="text-[11px] px-2 py-1 rounded-full border bg-card" title={a.desc}>{a.name}</span>)}
          </div>
        </Reveal>
      </div>
    </Shell>
  )
}

function SlideIDEF0() {
  return (
    <Shell section="Функциональное моделирование" title="Модель IDEF0 — контекст и декомпозиции" icon={Workflow}>
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        <DiagramTabs items={D.diagrams.idef0} />
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Функциональная модель построена в нотации IDEF0: от контекстной диаграммы A-0 до декомпозиций.</p>
          {['Контекст A-0 — система как единый блок с ICOM-стрелками', 'Декомпозиция A0 — 5 ключевых функций', '2-й уровень — детализация оркестрации агентов'].map((t, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><span className="h-5 w-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>{t}</div>
          ))}
          <p className="text-[11px] text-muted-foreground rounded-lg bg-muted px-3 py-2">Переключайте вкладки и кликните по схеме для увеличения.</p>
        </div>
      </div>
    </Shell>
  )
}

function SlideDFD() {
  return (
    <Shell section="Потоки данных" title="Диаграммы потоков данных (DFD)" icon={Network}>
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        <DiagramTabs items={D.diagrams.dfd} />
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Три уровня детализации потоков данных:</p>
          {[['Концептуальный', 'система и внешние сущности'], ['Логический', 'процессы и потоки между ними'], ['Физический', 'привязка к конкретным хранилищам']].map(([a, b]) => (
            <div key={a} className={card}><p className="text-sm font-semibold">{a}</p><p className="text-[11px] text-muted-foreground">{b}</p></div>
          ))}
        </div>
      </div>
    </Shell>
  )
}

function SlideTech({ step }: { step: number }) {
  return (
    <Shell section="Технологии" title="Используемый технологический стек" icon={Boxes}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {D.techGroups.map((g, i) => (
          <Reveal key={g.group} show={step >= 0} delay={i * 70}>
            <div className={cn(card, 'h-full')}>
              <div className="flex items-center gap-2 mb-2"><Ic name={g.icon} className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">{g.group}</span></div>
              <div className="flex flex-wrap gap-1.5">{g.items.map((it) => <span key={it} className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-foreground/80">{it}</span>)}</div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal show={step >= 1} className="mt-4">
        <div className={card}>
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> Слой агентов — единый интерфейс к провайдерам LLM</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {D.providers.map((p) => (
              <div key={p.name} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-1"><span className="text-sm font-semibold">{p.name}</span><span className="text-[10px] font-mono text-muted-foreground">{p.sdk}</span></div>
                <div className="space-y-0.5">{p.models.map((m) => <p key={m} className="text-[11px] font-mono text-muted-foreground">{m}</p>)}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">In-house агенты: {D.inHouseAgents.join(' · ')}</p>
        </div>
      </Reveal>
    </Shell>
  )
}

function SlideArch({ step }: { step: number }) {
  return (
    <Shell section="Архитектура" title="Микросервисная событийно-ориентированная архитектура" icon={Network}>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <DiagramTabs items={D.diagrams.arch} heightClass="max-h-[46vh]" />
        <div className="space-y-1.5">
          {D.archLayers.map((l, i) => (
            <Reveal key={l.name} show={step >= 0} delay={i * 60}>
              <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-1.5">
                <span className="text-[10px] font-bold w-16 shrink-0 text-primary uppercase tracking-wider">{l.name}</span>
                <div className="min-w-0"><p className="text-xs font-medium truncate">{l.tech}</p></div>
              </div>
            </Reveal>
          ))}
          <Reveal show={step >= 1} className="flex flex-wrap gap-1.5 pt-1">
            {D.interactions.map((it) => <span key={it.kind} className="text-[11px] px-2 py-1 rounded-full border bg-card" title={it.desc}>{it.kind}: {it.tech}</span>)}
          </Reveal>
        </div>
      </div>
    </Shell>
  )
}

function SlideModules({ step }: { step: number }) {
  return (
    <Shell section="Модули и взаимодействие" title="Компоненты, классы и доменные сервисы" icon={Layers}>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <DiagramTabs items={D.diagrams.modules} heightClass="max-h-[46vh]" />
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {D.services.map((s, i) => (
              <Reveal key={s.name} show={step >= 0} delay={i * 50}>
                <div className="rounded-lg border bg-card px-2.5 py-1.5">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold font-mono truncate">{s.name}</span><span className="text-[9px] px-1 rounded bg-primary/15 text-primary shrink-0">×{s.replicas}</span></div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal show={step >= 1} className="flex flex-wrap gap-1.5">
            {D.patterns.map((p) => <span key={p.name} className="text-[11px] px-2 py-1 rounded-full border bg-card" title={p.use}>{p.name}</span>)}
          </Reveal>
        </div>
      </div>
    </Shell>
  )
}

function SlideData({ step }: { step: number }) {
  return (
    <Shell section="Логическая и физическая структура" title="Модель данных и полиглот-персистентность" icon={Database}>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <DiagramTabs items={D.diagrams.data} heightClass="max-h-[46vh]" />
        <div className="space-y-2">
          <Reveal show={step >= 0}>
            <div className="flex flex-wrap gap-1.5 text-[11px]">{['30 таблиц', '36 связей', '276 полей', '8 доменов', '3НФ', 'UUID PK'].map((b) => <span key={b} className="px-2 py-1 rounded-full border bg-card font-medium">{b}</span>)}</div>
          </Reveal>
          <Reveal show={step >= 0}>
            <div className="grid grid-cols-2 gap-1.5">
              {D.dbDomains.map((d, i) => (
                <Reveal key={d.name} show={step >= 0} delay={i * 40}><div className="rounded-lg border bg-card px-2.5 py-1"><p className="text-xs font-semibold">{d.name}</p></div></Reveal>
              ))}
            </div>
          </Reveal>
          <Reveal show={step >= 1} className="space-y-1">
            {D.polyglot.map((p, i) => (
              <Reveal key={p.store} show={step >= 1} delay={i * 60}>
                <div className="flex items-center gap-2 text-xs"><Database className="h-3.5 w-3.5 text-primary shrink-0" /><span className="font-medium">{p.store}</span><span className="text-muted-foreground truncate">— {p.role}</span></div>
              </Reveal>
            ))}
          </Reveal>
        </div>
      </div>
    </Shell>
  )
}

function SlideMethods({ step }: { step: number }) {
  const samples = [
    { code: D.sqlView, language: 'sql' as const, fileName: 'db/v_epic_budget.sql' },
    { code: D.sqlFunc, language: 'sql' as const, fileName: 'db/transitions.sql' },
    { code: D.goDriver, language: 'go' as const, fileName: 'agent/driver.go' },
  ]
  const s = samples[Math.min(step, samples.length - 1)]
  return (
    <Shell section="Используемые методы" title="Объекты БД и паттерны проектирования" icon={Cpu}>
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <div>
          <div className="flex gap-2 mb-3">
            {['VIEW бюджета', 'Функция + триггер', 'AgentDriver (Strategy)'].map((label, i) => (
              <span key={label} className={cn('text-[11px] px-2.5 py-1 rounded-full border transition-colors', step === i ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground')}>{label}</span>
            ))}
          </div>
          <CodeStream key={step} code={s.code} language={s.language} fileName={s.fileName} streaming loop heightClass="h-80" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Паттерны проектирования</p>
          {D.patterns.map((p, i) => (
            <Reveal key={p.name} show delay={i * 80}><div className={card}><p className="text-sm font-semibold">{p.name}</p><p className="text-[11px] text-muted-foreground">{p.use}</p></div></Reveal>
          ))}
          <p className="text-[11px] text-muted-foreground rounded-lg bg-muted px-3 py-2">VIEW, PL/pgSQL-функции и триггеры инкапсулируют бизнес-логику и event sourcing на уровне БД.</p>
        </div>
      </div>
    </Shell>
  )
}

function SlideAlgorithms({ step }: { step: number }) {
  return (
    <Shell section="Алгоритмы" title="Маршрутизация и выполнение задач агентом" icon={Network}>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <DiagramTabs items={D.diagrams.algo} heightClass="max-h-[48vh]" />
        <div className="space-y-3">
          <Reveal show={step >= 0}><p className="text-sm font-semibold text-muted-foreground">Выбор агента — 4 критерия (agent_svc)</p></Reveal>
          <div className="grid sm:grid-cols-2 gap-2">
            {D.routingCriteria.map((c, i) => (
              <Reveal key={c.title} show={step >= 0} delay={i * 80}>
                <div className={cn(card, 'h-full')}>
                  <div className="flex items-center gap-2 mb-1"><Ic name={c.icon} className="h-4 w-4 text-primary" /><span className="text-xs font-semibold">{c.title}</span></div>
                  <p className="text-[10px] font-mono text-muted-foreground leading-snug">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal show={step >= 1}>
            <div className="rounded-lg border border-primary/30 bg-primary/[0.04] px-3 py-2 text-xs">
              <p className="font-semibold flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-primary" /> Лучшее соотношение производительность / стоимость; иначе — очередь <span className="font-mono">job_queue</span></p>
            </div>
          </Reveal>
          <Reveal show={step >= 2} className="space-y-1">
            {D.execSteps.map((s, i) => (
              <Reveal key={i} show={step >= 2} delay={i * 60}>
                <div className="flex items-start gap-2"><span className="h-4 w-4 rounded-full bg-primary/15 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span><p className="text-[11px] text-muted-foreground leading-snug">{s}</p></div>
              </Reveal>
            ))}
          </Reveal>
        </div>
      </div>
    </Shell>
  )
}

function SlideProcess() {
  return (
    <Shell section="Моделирование процессов" title="BPMN и IDEF3" icon={Workflow}>
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        <DiagramTabs items={D.diagrams.process} />
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Бизнес-процесс обработки задачи описан в нотациях BPMN (с дорожками ответственности) и IDEF3 (поток работ).</p>
          {[['BPMN', 'дорожки: пользователь, система, агент; шлюзы решений'], ['IDEF3', 'последовательность единиц работы и точек ветвления'], ['Конечный автомат', 'статусы задачи и граф разрешённых переходов']].map(([a, b]) => (
            <div key={a} className={card}><p className="text-sm font-semibold">{a}</p><p className="text-[11px] text-muted-foreground">{b}</p></div>
          ))}
        </div>
      </div>
    </Shell>
  )
}

// ── Fake Figma workspace mock ──
function FigmaFrame({ label, style, children }: { label: string; style: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div className="absolute" style={style}>
      <p className="text-[8px] text-[#a259ff] mb-1 font-medium">{label}</p>
      <div className="rounded-md bg-white text-zinc-800 border border-black/40 overflow-hidden shadow-lg ring-1 ring-[#0d99ff]/30">{children}</div>
    </div>
  )
}

function FigmaMock() {
  const avatars = [['АК', '#f24e1e'], ['МС', '#a259ff'], ['РД', '#0d99ff']]
  return (
    <div className="rounded-xl overflow-hidden border border-black/50 shadow-2xl shadow-black/30 bg-[#2c2c2c] text-zinc-300">
      {/* Toolbar */}
      <div className="h-9 flex items-center gap-3 px-3 bg-[#1e1e1e] border-b border-black/50 text-xs">
        <Figma className="h-4 w-4 text-[#a259ff]" />
        <span className="font-medium text-zinc-100">LLM Kanban — UI Kit</span>
        <span className="text-zinc-500 hidden sm:inline">Drafts / Курсовой проект</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {avatars.map(([t, c]) => (
              <span key={t} className="h-5 w-5 rounded-full text-[8px] font-bold text-white flex items-center justify-center ring-2 ring-[#1e1e1e]" style={{ background: c }}>{t}</span>
            ))}
          </div>
          <span className="px-2 py-1 rounded bg-[#0d99ff] text-white text-[10px] font-medium">Share</span>
          <span className="text-zinc-400">▶</span>
          <span className="text-zinc-500 text-[10px]">128%</span>
        </div>
      </div>
      <div className="flex h-72">
        {/* Left: pages + layers */}
        <div className="w-44 shrink-0 bg-[#252525] border-r border-black/50 text-[10px] p-2 space-y-2 hidden md:block">
          <div>
            <p className="text-zinc-500 uppercase tracking-wide text-[8px] mb-1">Pages</p>
            {['Канбан-доска', 'Auth', 'Dashboard', 'Components'].map((p, i) => (
              <p key={p} className={cn('px-1.5 py-0.5 rounded flex items-center gap-1', i === 0 ? 'bg-[#0d99ff]/20 text-zinc-100' : 'text-zinc-400')}>▸ {p}</p>
            ))}
          </div>
          <div>
            <p className="text-zinc-500 uppercase tracking-wide text-[8px] mb-1">Layers</p>
            {[['#', 'Frame: Board'], ['▸', 'Column / Backlog'], ['▸', 'Card / Task'], ['T', 'Title'], ['▢', 'Badge / Agent'], ['#', 'Frame: Login'], ['#', 'Frame: Task Card']].map(([g, n], i) => (
              <p key={i} className="px-1.5 py-0.5 text-zinc-400 truncate" style={{ paddingLeft: g === '▸' || g === 'T' || g === '▢' ? 14 : 6 }}><span className="text-zinc-600 mr-1">{g}</span>{n}</p>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-[#1a1a1a] overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
          {/* Prototype connection arrows */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs><marker id="ah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#0d99ff" /></marker></defs>
            <path d="M26,42 H35" stroke="#0d99ff" strokeWidth="0.6" strokeDasharray="2 1.5" markerEnd="url(#ah)" fill="none" />
            <path d="M70,42 H75" stroke="#0d99ff" strokeWidth="0.6" strokeDasharray="2 1.5" markerEnd="url(#ah)" fill="none" />
          </svg>

          <FigmaFrame label="Login" style={{ left: '3%', top: '24%', width: '22%' }}>
            <div className="p-2 space-y-1.5">
              <div className="h-2 w-1/2 mx-auto rounded bg-zinc-300" />
              <div className="h-3 rounded border border-zinc-200" />
              <div className="h-3 rounded border border-zinc-200" />
              <div className="h-3 rounded bg-zinc-900" />
            </div>
          </FigmaFrame>

          <FigmaFrame label="Board" style={{ left: '34%', top: '12%', width: '36%' }}>
            <div className="p-1.5">
              <div className="h-1.5 w-10 rounded bg-zinc-300 mb-1.5" />
              <div className="flex gap-1">
                {['#64748b', '#3b82f6', '#eab308', '#22c55e'].map((c) => (
                  <div key={c} className="flex-1 rounded bg-zinc-50 border border-zinc-200 p-1 space-y-1">
                    <span className="block h-1 w-3/4 rounded" style={{ background: c }} />
                    <div className="rounded border-l-2 bg-white px-1 py-1 space-y-0.5" style={{ borderColor: c }}>
                      <div className="h-1 w-3/4 rounded bg-zinc-300" />
                      <div className="h-1 w-1/2 rounded bg-zinc-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FigmaFrame>

          <FigmaFrame label="Task Card" style={{ left: '75%', top: '26%', width: '22%' }}>
            <div className="p-2 space-y-1">
              <div className="h-1.5 w-3/4 rounded bg-zinc-300" />
              <div className="h-1 w-full rounded bg-zinc-200" />
              <div className="h-1 w-2/3 rounded bg-zinc-200" />
              <div className="flex gap-1 pt-0.5"><span className="h-2 w-6 rounded-full bg-indigo-200" /><span className="h-2 w-5 rounded-full bg-amber-200" /></div>
              <div className="h-2.5 rounded bg-zinc-900 mt-1" />
            </div>
          </FigmaFrame>

          {/* Comment pin */}
          <div className="absolute" style={{ left: '60%', top: '60%' }}>
            <span className="h-5 w-5 rounded-full rounded-bl-none bg-[#0d99ff] text-white flex items-center justify-center shadow-lg"><MessageCircle className="h-3 w-3" /></span>
          </div>
        </div>

        {/* Right: design panel */}
        <div className="w-44 shrink-0 bg-[#252525] border-l border-black/50 text-[10px] p-2 space-y-2 hidden lg:block">
          <p className="text-zinc-500 uppercase tracking-wide text-[8px]">Design</p>
          <div className="space-y-1">
            <p className="text-zinc-400">Typography</p>
            <p className="text-zinc-300 bg-[#1e1e1e] rounded px-1.5 py-1">Manrope · 16 / 24</p>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-400">Color styles</p>
            <div className="flex gap-1">
              {['#0a0a0a', '#ffffff', '#3b82f6', '#22c55e', '#eab308', '#ef4444'].map((c) => (
                <span key={c} className="h-4 w-4 rounded border border-black/40" style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-400">Components</p>
            {['Button', 'Card / Task', 'Badge', 'Column'].map((c) => (
              <p key={c} className="text-zinc-300 bg-[#1e1e1e] rounded px-1.5 py-0.5 flex items-center gap-1">◇ {c}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SlideFigma({ step }: { step: number }) {
  return (
    <Shell section="Проектирование интерфейса" title="Прототип в Figma" icon={Figma}>
      <FigmaMock />
      <Reveal show={step >= 1} className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {[['Wireframes', 'низкая детализация'], ['UI Kit', 'цвета, типографика, компоненты'], ['Макеты экранов', 'Login · Board · Task · Dashboard'], ['Прототип', 'связи между экранами'], ['Handoff', 'передача в разработку']].map(([t, d], i) => (
            <Reveal key={t} show={step >= 1} delay={i * 70} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <div className="rounded-lg border bg-card px-3 py-1.5"><p className="text-xs font-semibold">{t}</p><p className="text-[10px] text-muted-foreground">{d}</p></div>
            </Reveal>
          ))}
        </div>
      </Reveal>
    </Shell>
  )
}

function SlidePrototype() {
  return (
    <Shell section="Проектирование интерфейса" title="Интерактивный прототип" icon={MonitorSmartphone}>
      <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6 items-start">
        <DiagramTabs items={D.diagrams.prototype} />
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">SPA на React: канбан-доска с drag-and-drop, обновления в реальном времени через веб-сокеты.</p>
          {['Карта экранов и навигация', 'Экран входа', 'Главный экран — доска', 'Карточка задачи с историей промпта'].map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground"><FileImage className="h-3.5 w-3.5 text-primary shrink-0" />{t}</div>
          ))}
        </div>
      </div>
    </Shell>
  )
}

function SlideDemo({ step }: { step: number }) {
  return (
    <Shell section="Демонстрация" title="Работа программы" icon={KanbanSquare}>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Reveal show={step >= 0}><DiagramTabs items={D.diagrams.demo} heightClass="max-h-[46vh]" /></Reveal>
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-2">
            {D.demoFeatures.map((f, i) => (
              <Reveal key={f.title} show={step >= 0} delay={i * 80}>
                <div className={cn(card, 'h-full')}><Ic name={f.icon} className="h-5 w-5 text-primary mb-1" /><p className="text-sm font-semibold">{f.title}</p><p className="text-[11px] text-muted-foreground">{f.text}</p></div>
              </Reveal>
            ))}
          </div>
          <Reveal show={step >= 1} className="space-y-1.5">
            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Radio className="h-4 w-4 text-primary" /> Живая генерация кода агентом</p>
            <CodeStream
              code={`func (d *AnthropicDriver) Execute(ctx context.Context, t Task) (<-chan ExecChunk, error) {\n\tout := make(chan ExecChunk)\n\tgo func() {\n\t\tdefer close(out)\n\t\tstream := d.client.Messages.NewStreaming(ctx, buildReq(t))\n\t\tfor stream.Next() {\n\t\t\tout <- ExecChunk{Text: stream.Current().Delta.Text}\n\t\t}\n\t}()\n\treturn out, nil\n}`}
              language="go" fileName="agent/anthropic.go" agentName="Claude Code" streaming loop heightClass="h-56"
            />
          </Reveal>
        </div>
      </div>
    </Shell>
  )
}

// ── Mock product previews for the "works" slide ──
function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden border shadow-lg shadow-foreground/5">
      <div className="h-7 flex items-center gap-1.5 px-3 bg-muted/70 border-b">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-2 text-[10px] text-muted-foreground font-mono truncate">{url}</span>
      </div>
      <div className="relative h-48 overflow-hidden">{children}</div>
    </div>
  )
}

function ResumePreview() {
  return (
    <div className="absolute inset-0 bg-white text-zinc-900 p-4 flex flex-col"
      style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '22px 22px' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-5 rounded bg-zinc-900 text-white text-[7px] font-bold flex items-center justify-center">РД</div>
        <span className="text-[10px] font-semibold">Романов Дмитрий</span>
        <div className="ml-auto flex gap-2 text-[8px] text-zinc-400">Обо мне · Опыт · Проекты · Стек</div>
      </div>
      <span className="text-[8px] text-blue-600 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Открыт к предложениям</span>
      <p className="text-xl font-extrabold leading-none mt-1.5 tracking-tight">Романов Дмитрий</p>
      <p className="text-[9px] text-zinc-500 mt-1">Senior Full-stack Engineer · Frontend / Backend / ML</p>
      <div className="flex gap-2 mt-auto">
        <span className="text-[8px] bg-zinc-900 text-white px-2.5 py-1.5 rounded-md">Написать в Telegram →</span>
        <span className="text-[8px] border border-zinc-300 px-2.5 py-1.5 rounded-md">Смотреть опыт</span>
      </div>
    </div>
  )
}

function MtsgptPreview() {
  return (
    <div className="absolute inset-0 bg-[#0a0a14] overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(227,6,17,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(227,6,17,0.06) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 192" preserveAspectRatio="none">
        <path d="M40,150 C90,70 150,180 200,110 S290,80 300,150" fill="none" stroke="rgba(227,6,17,0.25)" strokeWidth="6" strokeLinecap="round" />
        <path d="M40,150 C90,70 150,180 200,110 S290,80 300,150" fill="none" stroke="rgba(255,70,80,0.65)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="300" cy="150" r="3.5" fill="#ff5f6e" />
        <circle cx="150" cy="70" r="3" fill="rgba(255,180,80,0.9)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-[#e30611] text-white text-[11px] font-bold flex items-center justify-center">m</span>
          <span className="text-zinc-200 text-sm font-medium">mTSGPT Auto Router</span>
        </div>
        <div className="w-3/4 h-8 rounded-full border border-white/10 bg-white/5 flex items-center px-3 text-[9px] text-zinc-500">Чем я могу помочь вам сегодня?</div>
      </div>
    </div>
  )
}

function AnalyticsPreview() {
  const pts = [12, 18, 14, 22, 19, 28, 24, 33, 30, 38, 35, 44]
  const max = Math.max(...pts)
  const w = 300, h = 70
  const line = pts.map((p, i) => `${(i / (pts.length - 1)) * w},${h - (p / max) * h}`).join(' ')
  const area = `0,${h} ${line} ${w},${h}`
  return (
    <div className="absolute inset-0 bg-white text-zinc-900 p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> LLM Cost Analytics</span>
        <span className="text-[8px] text-zinc-400">за 30 дней</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {[['$1 240', 'Стоимость'], ['4.8M', 'Токены'], ['312', 'Задач']].map(([v, l]) => (
          <div key={l} className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5">
            <p className="text-[11px] font-bold leading-none">{v}</p>
            <p className="text-[7px] text-zinc-400 uppercase tracking-wide mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="flex-1 relative">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
          <polygon points={area} fill="rgba(16,185,129,0.12)" />
          <polyline points={line} fill="none" stroke="#10b981" strokeWidth="2" />
        </svg>
      </div>
      <div className="flex gap-2 mt-1">
        {['Claude', 'GPT-5', 'Gemini'].map((a, i) => (
          <span key={a} className="text-[7px] flex items-center gap-1 text-zinc-500"><span className="h-1.5 w-1.5 rounded-full" style={{ background: ['#10b981', '#6366f1', '#f59e0b'][i] }} />{a}</span>
        ))}
      </div>
    </div>
  )
}

function KanbanPreview() {
  const cols: { t: string; c: string; cards: number; active?: boolean }[] = [
    { t: 'Бэклог', c: '#64748b', cards: 2 },
    { t: 'Выполняется', c: '#3b82f6', cards: 1, active: true },
    { t: 'Ревью', c: '#eab308', cards: 1 },
    { t: 'Готово', c: '#22c55e', cards: 2 },
  ]
  return (
    <div className="absolute inset-0 bg-zinc-50 dark:bg-zinc-950 p-2.5"
      style={{ backgroundImage: 'linear-gradient(hsl(var(--foreground)/0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)/0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <div className="h-4 w-4 rounded bg-foreground/80 text-background text-[6px] font-bold flex items-center justify-center">LK</div>
        <span className="text-[9px] font-semibold">LLM Kanban</span>
        <span className="ml-auto text-[7px] text-primary flex items-center gap-1"><RotateCcw className="h-2.5 w-2.5" /> самоулучшение</span>
      </div>
      <div className="flex gap-1.5">
        {cols.map((col) => (
          <div key={col.t} className="flex-1 rounded-md bg-white dark:bg-zinc-900 border p-1.5 space-y-1">
            <div className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: col.c }} /><span className="text-[6px] font-semibold text-foreground/70 truncate">{col.t}</span></div>
            {Array.from({ length: col.cards }).map((_, k) => (
              <div key={k} className={cn('rounded border-l-2 bg-zinc-50 dark:bg-zinc-800 px-1 py-1 space-y-0.5', col.active && k === 0 && 'ring-1 ring-primary/40')} style={{ borderColor: col.c }}>
                <div className="h-1 w-3/4 rounded bg-zinc-300 dark:bg-zinc-700" />
                <div className="h-1 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideWorks({ step }: { step: number }) {
  const works = [
    { url: 'llm-kanban (self)', preview: <KanbanPreview />, title: 'LLM Kanban — сама платформа', desc: 'Дорабатывается с помощью себя же: GitHub-интеграция, живая генерация и эта презентация ставились задачами LLM-агентам на этой же доске.', tags: ['React 19', 'TypeScript', 'dogfooding'], featured: true },
    { url: 'romanov.dev', preview: <ResumePreview />, title: 'Сайт-резюме', desc: 'Персональный портфолио-сайт: опыт, проекты, стек, контакты.', tags: ['React', 'Svelte', 'Vue'] },
    { url: 'mtsgpt.local', preview: <MtsgptPreview />, title: 'mTSGPT Auto Router', desc: 'Авто-роутер запросов между LLM поверх Open WebUI.', tags: ['Open WebUI', 'Python', 'Pipelines'] },
    { url: 'analytics.llm-kanban', preview: <AnalyticsPreview />, title: 'LLM Cost Analytics', desc: 'Дашборд стоимости, токенов и throughput агентов.', tags: ['ClickHouse', 'Go', 'Recharts'] },
  ]
  return (
    <Shell section="Сделано на платформе" title="Проекты, выпущенные с помощью LLM Kanban" icon={Sparkles}>
      <p className="text-sm text-muted-foreground mb-4">Платформа применяется на реальных продуктах — включая саму себя: задачи ставились и выполнялись LLM-агентами на этой канбан-доске.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {works.map((w, i) => (
          <Reveal key={w.title} show={step >= i} delay={60}>
            <div className={cn('space-y-2 rounded-xl p-2 -m-2', w.featured && 'ring-1 ring-primary/30 bg-primary/[0.03]')}>
              <BrowserFrame url={w.url}>{w.preview}</BrowserFrame>
              <p className="text-sm font-semibold flex items-center gap-1.5">{w.title}{w.featured && <Sparkles className="h-3.5 w-3.5 text-primary" />}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{w.desc}</p>
              <div className="flex flex-wrap gap-1.5">{w.tags.map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-foreground/80">{t}</span>)}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Shell>
  )
}

function SlideTesting({ step }: { step: number }) {
  return (
    <Shell section="Тестирование" title="Пирамида тестирования — 105 тестов" icon={FlaskConical}>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-2">
          {D.testKinds.map((k, i) => (
            <Reveal key={k.t} show={step >= 0} delay={i * 60}>
              <div className={cn(card, 'py-2.5')}><div className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">{k.t}</span></div><p className="text-[11px] text-muted-foreground mt-0.5">{k.d}</p></div>
            </Reveal>
          ))}
          <Reveal show={step >= 0} delay={360}>
            <div className="rounded-lg border border-green-500/30 bg-green-500/[0.06] px-3 py-2 text-sm font-semibold flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> {D.testTotal}</div>
          </Reveal>
        </div>
        <div className="space-y-3">
          <Reveal show={step >= 0}>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  {D.testSummary.map((row) => (
                    <tr key={row[0]} className="border-b last:border-0">
                      <td className="px-3 py-1.5 font-medium">{row[0]}</td>
                      <td className="px-2 py-1.5 font-mono text-[10px] text-muted-foreground">{row[1]}</td>
                      <td className="px-2 py-1.5 text-center font-bold">{row[2]}</td>
                      <td className="px-3 py-1.5 text-[10px] text-muted-foreground">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          <Reveal show={step >= 1}>
            <CodeStream code={D.goTestCode} language="go" fileName="task/service_test.go" streaming loop heightClass="h-56" />
          </Reveal>
        </div>
      </div>
    </Shell>
  )
}

function SlideConclusion({ step }: { step: number }) {
  return (
    <Shell section="Выводы" title="Результаты курсового проекта" icon={Check}>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Reveal show={step >= 0}><p className="text-sm font-semibold text-muted-foreground">Изучено и применено</p></Reveal>
          {D.studied.map((s, i) => (
            <Reveal key={i} show={step >= 0} delay={i * 60}><p className="text-xs text-muted-foreground flex items-start gap-2"><Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />{s}</p></Reveal>
          ))}
        </div>
        <div className="space-y-3 relative">
          {/* Animated network / robot illustration */}
          <div className="relative flex justify-center">
            <div className={cn('transition-all duration-700 ease-out', step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90')}>
              <HeroIllustration size={240} />
            </div>
          </div>
          <Reveal show={step >= 1}>
            <div className="rounded-xl border border-primary/30 bg-primary/[0.05] p-5 text-center">
              <p className="text-lg font-bold">Цель достигнута, задачи решены</p>
              <p className="text-xs text-muted-foreground mt-1">Разработана пререлизная версия платформы оркестрации LLM-агентов</p>
              <a href={D.meta.repo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-primary hover:underline"><Github className="h-4 w-4" /> {D.meta.repo.replace('https://', '')}</a>
            </div>
          </Reveal>
          <Reveal show={step >= 2}>
            <div className="flex flex-wrap gap-1.5">
              {D.futureWork.map((f) => <span key={f} className="text-[11px] px-2 py-1 rounded-full border bg-card text-muted-foreground">{f}</span>)}
            </div>
          </Reveal>
          <Reveal show={step >= 2} delay={200}><p className="text-center text-base font-semibold flex items-center justify-center gap-2 pt-1"><Sparkles className="h-4 w-4 text-primary" /> Спасибо за внимание!</p></Reveal>
        </div>
      </div>
    </Shell>
  )
}

// ── Slide registry ──
interface SlideDef { id: string; section: string; steps: number; render: (step: number) => React.ReactNode }
const SLIDES: SlideDef[] = [
  { id: 'title', section: 'Титул', steps: 1, render: () => <SlideTitle /> },
  { id: 'problem', section: 'Постановка задачи', steps: 3, render: (s) => <SlideProblem step={s} /> },
  { id: 'idef0', section: 'IDEF0', steps: 1, render: () => <SlideIDEF0 /> },
  { id: 'dfd', section: 'DFD', steps: 1, render: () => <SlideDFD /> },
  { id: 'tech', section: 'Технологии', steps: 2, render: (s) => <SlideTech step={s} /> },
  { id: 'arch', section: 'Архитектура', steps: 2, render: (s) => <SlideArch step={s} /> },
  { id: 'modules', section: 'Модули', steps: 2, render: (s) => <SlideModules step={s} /> },
  { id: 'data', section: 'Структура данных', steps: 2, render: (s) => <SlideData step={s} /> },
  { id: 'methods', section: 'Методы', steps: 3, render: (s) => <SlideMethods step={s} /> },
  { id: 'algo', section: 'Алгоритмы', steps: 3, render: (s) => <SlideAlgorithms step={s} /> },
  { id: 'process', section: 'Процессы', steps: 1, render: () => <SlideProcess /> },
  { id: 'figma', section: 'Figma', steps: 2, render: (s) => <SlideFigma step={s} /> },
  { id: 'prototype', section: 'Прототип', steps: 1, render: () => <SlidePrototype /> },
  { id: 'demo', section: 'Демонстрация', steps: 2, render: (s) => <SlideDemo step={s} /> },
  { id: 'works', section: 'Проекты', steps: 4, render: (s) => <SlideWorks step={s} /> },
  { id: 'testing', section: 'Тестирование', steps: 2, render: (s) => <SlideTesting step={s} /> },
  { id: 'conclusion', section: 'Выводы', steps: 3, render: (s) => <SlideConclusion step={s} /> },
]

// ── Player ──────────────────────────────────────────────────────────────

export function PresentationPage() {
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)
  const [step, setStep] = useState(0)
  const [isFs, setIsFs] = useState(false)
  const [scale, setScale] = useState(1)
  const rootRef = useRef<HTMLDivElement>(null)

  // Scale slide content up on larger screens / fullscreen so it fills the slide.
  useEffect(() => {
    const calc = () => setScale(clamp(window.innerWidth / 1180, 1, 1.7))
    calc()
    window.addEventListener('resize', calc)
    const onFsResize = () => setTimeout(calc, 80)
    document.addEventListener('fullscreenchange', onFsResize)
    return () => { window.removeEventListener('resize', calc); document.removeEventListener('fullscreenchange', onFsResize) }
  }, [])

  const slide = SLIDES[idx]
  const stateRef = useRef({ idx, step })
  stateRef.current = { idx, step }

  const next = useCallback(() => {
    const { idx: i, step: s } = stateRef.current
    if (s < SLIDES[i].steps - 1) setStep(s + 1)
    else if (i < SLIDES.length - 1) { setIdx(i + 1); setStep(0) }
  }, [])
  const prev = useCallback(() => {
    const { idx: i, step: s } = stateRef.current
    if (s > 0) setStep(s - 1)
    else if (i > 0) { const p = i - 1; setIdx(p); setStep(SLIDES[p].steps - 1) }
  }, [])
  const goSlide = useCallback((i: number) => { setIdx(i); setStep(0) }, [])
  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else rootRef.current?.requestFullscreen?.()
  }, [])

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.querySelector('[data-viewer]')) return // image viewer owns the keys
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev() }
      else if (e.key === 'Home') goSlide(0)
      else if (e.key === 'End') goSlide(SLIDES.length - 1)
      else if (e.key.toLowerCase() === 'f') toggleFs()
      else if (e.key === 'Escape' && !document.fullscreenElement) navigate('/dashboard')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev, goSlide, toggleFs, navigate])

  const overall = ((idx + (step + 1) / slide.steps) / SLIDES.length) * 100

  return (
    <div ref={rootRef} className="fixed inset-0 z-50 bg-background text-foreground overflow-hidden flex flex-col">
      <SnakeBackdrop className="fixed inset-0 z-0" grid />

      <header className="relative z-10 flex items-center justify-between px-5 h-12 border-b glass shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Bot className="h-5 w-5 text-foreground dark:text-primary shrink-0" />
          <span className="text-sm font-semibold truncate">LLM Kanban — защита курсового проекта</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">{idx + 1} / {SLIDES.length}</span>
          <button onClick={toggleFs} className="text-muted-foreground hover:text-foreground transition-colors" title="Полный экран (F)">{isFs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
          <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground transition-colors" title="Выход (Esc)"><X className="h-4 w-4" /></button>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 overflow-hidden flex items-center justify-center px-6 sm:px-10 py-8">
        <div
          key={idx}
          className="w-full max-h-full overflow-y-auto overflow-x-hidden animate-slide-3d"
          style={{ zoom: scale } as React.CSSProperties}
        >
          {slide.render(step)}
        </div>
        {/* light sweep on each slide change */}
        <div
          key={'sweep-' + idx}
          className="pointer-events-none absolute inset-0 z-20 animate-slide-sweep"
          style={{ background: 'linear-gradient(100deg, transparent 35%, hsl(var(--foreground) / 0.10) 50%, transparent 65%)' }}
        />
      </main>

      <footer className="relative z-10 shrink-0 border-t glass">
        <div className="h-1 bg-muted"><div className="h-full bg-primary/60 transition-all duration-500" style={{ width: `${overall}%` }} /></div>
        <div className="flex items-center justify-between px-5 h-12">
          <button onClick={prev} disabled={idx === 0 && step === 0} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"><ArrowLeft className="h-4 w-4" /> Назад</button>
          <div className="flex items-center gap-1.5">
            {SLIDES.map((s, i) => (
              <button key={s.id} onClick={() => goSlide(i)} title={s.section} className={cn('h-1.5 rounded-full transition-all', i === idx ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60')} />
            ))}
          </div>
          <button onClick={next} disabled={idx === SLIDES.length - 1 && step === slide.steps - 1} className="flex items-center gap-1.5 text-sm font-medium hover:text-primary disabled:opacity-30 transition-colors">Далее <ArrowRight className="h-4 w-4" /></button>
        </div>
      </footer>
    </div>
  )
}
