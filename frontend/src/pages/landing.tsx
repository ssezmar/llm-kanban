import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Bot, Zap, BarChart3, GitBranch, ArrowRight, Layers } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

const features = [
  {
    icon: Bot,
    title: 'LLM-агенты',
    desc: 'Распределяйте задачи между Claude Code, Codex и другими агентами',
  },
  {
    icon: Zap,
    title: 'Real-time мониторинг',
    desc: 'Отслеживайте прогресс выполнения задач в реальном времени',
  },
  {
    icon: BarChart3,
    title: 'Аналитика',
    desc: 'Автоматическая оценка качества результатов и ревью кода',
  },
  {
    icon: GitBranch,
    title: 'Канбан-доска',
    desc: 'Гибкое управление задачами с drag-and-drop интерфейсом',
  },
  {
    icon: Layers,
    title: 'Эпики',
    desc: 'Группируйте задачи в эпики для стратегического планирования',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b glass sticky top-0 z-40">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5 font-bold text-lg">
            <Bot className="h-6 w-6 text-foreground" />
            <span className="tracking-tight">LLM Kanban</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth">
              <Button size="sm">Войти</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="gradient-mesh absolute inset-0" />
        <div className="container relative mx-auto px-4 py-28 sm:py-36 text-center">
          <div className="mx-auto max-w-3xl space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-foreground/40 dark:bg-green-400 animate-pulse-glow" />
              Система оркестрации задач для AI-агентов
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl leading-[1.1]">
              Оркестрация задач
              <br />
              <span className="gradient-text">LLM-агентов</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Канбан-система для управления задачами, выполняемыми AI-агентами.
              Формируйте задачи, распределяйте между агентами, отслеживайте прогресс
              и оценивайте качество результатов.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="gap-2 shadow-lg shadow-foreground/10 dark:shadow-primary/25 hover:shadow-foreground/15 dark:hover:shadow-primary/40 transition-shadow">
                  Начать работу <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="gap-2">
                  Демо-аккаунт
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-28">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border p-6 space-y-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card"
            >
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                <f.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          LLM Kanban — Курсовой проект
        </div>
      </footer>
    </div>
  )
}
