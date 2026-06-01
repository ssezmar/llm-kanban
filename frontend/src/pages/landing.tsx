import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Bot, Zap, BarChart3, GitBranch, ArrowRight, Layers, Shield, Globe, Cpu, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { HeroIllustration } from '@/components/animated-robot'
import { SnakeBackdrop } from '@/components/snake-backdrop'

const features = [
  { icon: Bot, title: 'LLM-агенты', desc: 'Распределяйте задачи между Claude Code, Codex и другими AI-агентами' },
  { icon: Zap, title: 'Real-time мониторинг', desc: 'Отслеживайте прогресс выполнения задач в реальном времени с логами' },
  { icon: BarChart3, title: 'Аналитика и ревью', desc: 'Автоматическая оценка качества результатов и код-ревью от AI' },
  { icon: GitBranch, title: 'Канбан-доска', desc: 'Гибкое управление задачами с drag-and-drop и настраиваемыми колонками' },
  { icon: Layers, title: 'Эпики', desc: 'Группируйте задачи в эпики для стратегического планирования' },
  { icon: Shield, title: 'Микросервисы', desc: 'Масштабируемая архитектура: Go, Kafka, PostgreSQL, Redis, Kubernetes' },
]

const stats = [
  { label: 'Микросервисов', value: '33' },
  { label: 'Таблиц БД', value: '28' },
  { label: 'Технологий', value: '19' },
  { label: 'Прецедентов', value: '38' },
]

// ── Orbit rings decoration ──

function OrbitRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.12]">
      <div className="absolute w-[500px] h-[500px] border border-foreground/20 rounded-full animate-[spin_60s_linear_infinite]" />
      <div className="absolute w-[400px] h-[400px] border border-foreground/15 rounded-full animate-[spin_45s_linear_infinite_reverse]" />
      <div className="absolute w-[300px] h-[300px] border border-foreground/10 rounded-full animate-[spin_30s_linear_infinite]" />
    </div>
  )
}

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
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-100/80 via-background to-background dark:from-zinc-900/30 dark:via-background dark:to-background" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
        <SnakeBackdrop />
        <div className="absolute top-20 left-20 w-96 h-96 bg-zinc-300/20 dark:bg-white/[0.03] rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-40 right-20 w-80 h-80 bg-zinc-200/20 dark:bg-white/[0.02] rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="container relative mx-auto px-4 py-20 sm:py-28">
          <div className="flex items-center gap-12 lg:gap-16">
            {/* Text */}
            <div className="flex-1 space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/50 dark:bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-foreground/40 dark:bg-foreground/50 animate-pulse-glow" />
                Система оркестрации задач для AI-агентов
              </div>
              <h1 className="text-5xl font-bold tracking-tight sm:text-7xl leading-[1.1]">
                Оркестрация
                <br />
                <span className="gradient-text">LLM-агентов</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Канбан-система для управления задачами, выполняемыми AI-агентами.
                Формируйте промпты, распределяйте между агентами, отслеживайте прогресс
                и оценивайте качество результатов.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <Link to="/auth">
                  <Button size="lg" className="gap-2 shadow-lg shadow-foreground/10 hover:shadow-foreground/15 transition-shadow">
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

            {/* Robot with orbits */}
            <div className="relative hidden lg:flex items-center justify-center shrink-0" style={{ width: 400, height: 400 }}>
              <OrbitRings />
              <HeroIllustration size={340} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y bg-card/50 dark:bg-muted/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Возможности платформы</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Полный набор инструментов для управления AI-агентами и анализа результатов</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border p-6 space-y-3 transition-all duration-300 hover:shadow-lg hover:shadow-foreground/5 hover:-translate-y-1 bg-card"
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

      {/* Tech stack preview */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-20">
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-zinc-100/60 via-background to-zinc-50/30 dark:from-zinc-900/30 dark:via-background dark:to-zinc-950/20 p-8 sm:p-12">
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }} />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>Технологический стек</span>
                </div>
                <h2 className="text-3xl font-bold">Современная архитектура</h2>
                <p className="text-muted-foreground leading-relaxed max-w-lg">
                  33 микросервиса на Go, React 19 фронтенд, Kafka для async-коммуникации,
                  PostgreSQL + ClickHouse для данных, Redis кэш, Kubernetes оркестрация.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {['React 19', 'Go', 'Kafka', 'PostgreSQL', 'Redis', 'Kubernetes', 'gRPC', 'Nginx', 'Prometheus'].map((t) => (
                    <span key={t} className="px-3 py-1 text-xs rounded-full border bg-background/80 dark:bg-card/80 text-muted-foreground backdrop-blur-sm">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 shrink-0">
                {[
                  { icon: Globe, label: 'API Gateway' },
                  { icon: Cpu, label: 'Go Services' },
                  { icon: Zap, label: 'Kafka' },
                  { icon: BarChart3, label: 'ClickHouse' },
                  { icon: Shield, label: 'K8s' },
                  { icon: Bot, label: 'LLM Agents' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-background/60 dark:bg-card/60 backdrop-blur-sm hover:scale-105 transition-transform">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-muted">
                      <item.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <span className="text-[10px] text-muted-foreground text-center">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
