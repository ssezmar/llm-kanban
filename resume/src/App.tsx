import { useEffect, useRef } from 'react'
import {
  Mail, Send, Github, MapPin, Phone,
  Cpu, Code2, Server, Layout, Database, Container, FlaskConical,
  Briefcase, LayoutGrid, Award, BookOpen, Search,
  Calendar, Building2, Flag, KanbanSquare,
  Zap, ShieldCheck, Gauge, Users,
  Receipt, ToggleRight, Trello, Boxes, Bot, Terminal,
  Trophy, GitPullRequest, GraduationCap,
  Wifi, Building, Plane,
} from 'lucide-react'

// ── Animated counter ──────────────────────────────────────────
function StatVal({ count, suffix = '+' }: { count: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const steps = 40
      let i = 0
      const t = setInterval(() => {
        i++
        el.textContent = String(Math.round(count / steps * i)) + suffix
        if (i >= steps) { el.textContent = String(count) + suffix; clearInterval(t) }
      }, 1200 / steps)
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [count, suffix])
  return <div className="stat-val" ref={ref}>0</div>
}

// ── Tag ───────────────────────────────────────────────────────
function Tag({ children, hi }: { children: string; hi?: boolean }) {
  return <span className={`tag${hi ? ' hi' : ''}`}>{children}</span>
}

// ── Skill group ───────────────────────────────────────────────
function Sg({ icon: Icon, title, items, primary = [] }: {
  icon: React.ElementType; title: string; items: string[]; primary?: string[]
}) {
  return (
    <div className="sg">
      <div className="sg-head"><Icon size={13} /><span className="sg-title">{title}</span></div>
      <div className="sg-tags">
        {items.map(t => <Tag key={t} hi={primary.includes(t)}>{t}</Tag>)}
      </div>
    </div>
  )
}

// ── Project card ──────────────────────────────────────────────
function ProjCard({ name, desc, icon: Icon, color, rgb, tags }: {
  name: string; desc: string; icon: React.ElementType
  color: string; rgb: string; tags: string[]
}) {
  return (
    <div className="proj-card">
      <div className="proj-head">
        <span className="proj-name">{name}</span>
        <div className="proj-icon" style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)` }}>
          <Icon size={13} style={{ color }} />
        </div>
      </div>
      <p className="proj-desc">{desc}</p>
      <div className="proj-tags">{tags.map(t => <Tag key={t}>{t}</Tag>)}</div>
    </div>
  )
}

// ── Achievement ───────────────────────────────────────────────
function Ach({ icon: Icon, color, rgb, title, text }: {
  icon: React.ElementType; color: string; rgb: string; title: string; text: string
}) {
  return (
    <div className="ach-item">
      <div className="ach-icon" style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div><span className="ach-title">{title}</span> — {text}</div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────
function SecHead({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="sec-head">
      <div className="sec-icon"><Icon size={13} /></div>
      <span className="sec-lbl">{label}</span>
      <div className="sec-line" />
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────
export function App() {
  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <a href="#" className="logo">
            <span className="logo-name">Никита Мосягин</span>
            <span className="logo-role">full-stack dev</span>
          </a>
          <nav className="nav">
            <a href="#skills">Навыки</a>
            <a href="#experience">Опыт</a>
            <a href="#projects">Проекты</a>
            <a href="#education">Образование</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-badge">
            <div className="badge-dot" />
            Открыт к предложениям · Стажировка / Junior
          </div>
          <h1>Никита Мосягин</h1>
          <div className="hero-role-row">
            <span className="hero-role-text">Full-Stack Developer</span>
            <div className="stack-pills">
              {['Go', 'React', 'TypeScript', 'PostgreSQL'].map(s => (
                <span key={s} className="stack-pill">{s}</span>
              ))}
            </div>
          </div>
          <p className="hero-desc">
            Разрабатываю backend API и SPA с нуля — архитектура, тесты, деплой.
            Работаю с Go 2 года, из них год в production. Самостоятельно закрываю
            задачи от дизайна до CI/CD.
          </p>
          <div className="contacts">
            <a href="mailto:aborigen.nm@gmail.com" className="chip"><Mail size={13} />aborigen.nm@gmail.com</a>
            <a href="https://t.me/dontwritethis" target="_blank" rel="noopener" className="chip"><Send size={13} />@dontwritethis</a>
            <a href="https://github.com/xlurr" target="_blank" rel="noopener" className="chip"><Github size={13} />github.com/xlurr</a>
            <span className="chip"><MapPin size={13} />Великий Новгород</span>
            <span className="chip"><Phone size={13} />+7 911 645-98-85</span>
          </div>
          <div className="stats">
            <div className="stat"><StatVal count={1247} /><div className="stat-lbl">Коммитов</div></div>
            <div className="stat"><StatVal count={89} suffix="" /><div className="stat-lbl">Pull Requests</div></div>
            <div className="stat"><StatVal count={75} /><div className="stat-lbl">API Endpoints</div></div>
            <div className="stat"><div className="stat-val">80%+</div><div className="stat-lbl">Test Coverage</div></div>
            <div className="stat"><StatVal count={12} suffix="" /><div className="stat-lbl">Docker Images</div></div>
            <div className="stat"><StatVal count={5} suffix="" /><div className="stat-lbl">Проектов</div></div>
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section className="section" id="skills">
        <div className="wrap">
          <SecHead icon={Cpu} label="01 / навыки" />
          <div className="skills-grid">
            <Sg icon={Code2}      title="Languages" primary={['Go','TypeScript']}
              items={['Go','TypeScript','JavaScript','SQL','Bash','Python','C++']} />
            <Sg icon={Server}     title="Backend"   primary={['chi']}
              items={['chi','Fiber','Echo','gRPC','REST API','JWT','WebSocket','OAuth2']} />
            <Sg icon={Layout}     title="Frontend"  primary={['React 18/19','Vite']}
              items={['React 18/19','Vite','Next.js','Tailwind','Zustand','TanStack Query','Framer Motion','Zod']} />
            <Sg icon={Database}   title="Databases" primary={['PostgreSQL 16']}
              items={['PostgreSQL 16','Redis','SQLite','MongoDB','Firebird','GORM','Drizzle ORM']} />
            <Sg icon={Container}  title="DevOps"    primary={['Docker']}
              items={['Docker','Docker Compose','GitHub Actions','GitLab CI','Nginx','Traefik','Linux','systemd']} />
            <Sg icon={FlaskConical} title="Testing"
              items={['testify','Vitest','Jest','MSW','Playwright','RTL']} />
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="section" id="experience">
        <div className="wrap">
          <SecHead icon={Briefcase} label="02 / опыт" />
          <div className="exp-list">

            <div className="exp-card">
              <div className="exp-top">
                <div className="exp-title">Full-Stack Developer</div>
                <div className="exp-period"><Calendar size={11} />Февраль 2026 — н.в.</div>
              </div>
              <div className="exp-company"><Building2 size={12} />ISP «Максима» · Freelance / Production, Великий Новгород</div>
              <p className="exp-desc">Биллинговая система личного кабинета для интернет-провайдера. Полный цикл: архитектура → деплой → поддержка.</p>
              <ul className="exp-ul">
                <li>Clean Architecture на Go с DI через интерфейсы</li>
                <li>REST API с JWT авторизацией (access/refresh tokens, HS256) — 45+ endpoints</li>
                <li>Миграции Firebird SQL с rollback</li>
                <li>React SPA с code splitting и lazy loading — Lighthouse 95+</li>
                <li>Mock-first разработка через MSW</li>
                <li>Docker Compose с healthcheck + Nginx reverse proxy: gzip, кэш, SSL</li>
                <li>Unit-тесты критических путей — coverage 80%+</li>
              </ul>
              <div className="exp-metrics">
                <span className="metric"><Zap size={10} />45+ endpoints</span>
                <span className="metric"><ShieldCheck size={10} />80% coverage</span>
                <span className="metric"><Gauge size={10} />Lighthouse 95+</span>
                <span className="metric"><Users size={10} />1000+ клиентов</span>
              </div>
              <div className="exp-stack">
                {['Go 1.26','chi v5','JWT','Firebird SQL','React 18','TypeScript','Vite','Tailwind','Framer Motion','Docker','Nginx','MSW','Zap'].map(t => <Tag key={t}>{t}</Tag>)}
              </div>
            </div>

            <div className="exp-card">
              <div className="exp-top">
                <div className="exp-title">Full-Stack Developer</div>
                <div className="exp-period"><Calendar size={11} />Октябрь 2025 — н.в.</div>
              </div>
              <div className="exp-company"><Flag size={12} />Feature Flags Manager · Pet-проект / Open Source</div>
              <p className="exp-desc">Self-hosted аналог LaunchDarkly/Unleash. Eval API, targeting rules, multi-env, Go SDK.</p>
              <ul className="exp-ul">
                <li>Clean Architecture: domain → ports → adapters</li>
                <li>PostgreSQL с JSONB для гибких targeting rules</li>
                <li>Real-time eval endpoint для клиентских SDK</li>
                <li>Dashboard с CRUD, фильтрами и audit log</li>
                <li>Multi-environment support (dev/staging/prod)</li>
                <li>Go SDK для интеграции в микросервисы</li>
                <li>GitHub Actions CI/CD с автоматическим деплоем</li>
              </ul>
              <div className="exp-stack">
                {['Go 1.22','chi','PostgreSQL 16','JSONB','React','TypeScript','TanStack Query','Drizzle ORM','Shadcn/ui','Docker','GitHub Actions'].map(t => <Tag key={t}>{t}</Tag>)}
              </div>
            </div>

            <div className="exp-card">
              <div className="exp-top">
                <div className="exp-title">Full-Stack Developer</div>
                <div className="exp-period"><Calendar size={11} />Декабрь 2025 — Январь 2026</div>
              </div>
              <div className="exp-company"><KanbanSquare size={12} />LLM Kanban System · Pet-проект</div>
              <p className="exp-desc">Канбан-система для оркестрации задач AI-агентов с интерактивной визуализацией архитектуры и аналитикой.</p>
              <ul className="exp-ul">
                <li>Drag-and-drop доска с @dnd-kit</li>
                <li>Визуализация архитектуры через React Flow</li>
                <li>Dashboard с аналитикой (Recharts)</li>
                <li>Real-time состояние через Zustand</li>
                <li>Деплой на Vercel с preview для PR</li>
              </ul>
              <div className="exp-stack">
                {['React 19','TypeScript','Vite','Tailwind','Zustand','React Flow','@dnd-kit','Recharts','Vercel'].map(t => <Tag key={t}>{t}</Tag>)}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="section" id="projects">
        <div className="wrap">
          <SecHead icon={LayoutGrid} label="03 / проекты" />
          <div className="proj-grid">
            <ProjCard name="Billing Service"        icon={Receipt}     color="#60a5fa" rgb="59,130,246"
              desc="Enterprise биллинг для ISP. Clean Architecture, React SPA. 1000+ клиентов в production."
              tags={['Go','React','Firebird','Docker']} />
            <ProjCard name="Feature Flags Manager"  icon={ToggleRight}  color="#a78bfa" rgb="139,92,246"
              desc="Self-hosted LaunchDarkly. Targeting rules, multi-env, audit log, Go SDK. Open Source."
              tags={['Go','PostgreSQL','React','JSONB']} />
            <ProjCard name="LLM Kanban"             icon={Trello}      color="#4ade80" rgb="34,197,94"
              desc="Канбан для AI-агентов с интерактивной диаграммой БД и аналитическим дашбордом."
              tags={['React 19','Zustand','React Flow','Vercel']} />
            <ProjCard name="Go Microservices Kit"   icon={Boxes}       color="#fb923c" rgb="249,115,22"
              desc="Стартовый кит для микросервисов на Go: DI, migrations, CI, best practices."
              tags={['Go','Docker','GitHub Actions']} />
            <ProjCard name="Telegram Bots"          icon={Bot}         color="#22d3ee" rgb="6,182,212"
              desc="Набор ботов: уведомления, CRUD-операции, интеграции со сторонними API."
              tags={['Go','PostgreSQL','Redis']} />
            <ProjCard name="CLI Tools"              icon={Terminal}    color="#facc15" rgb="234,179,8"
              desc="Коллекция CLI-утилит для автоматизации задач разработки и деплоя."
              tags={['Go','Bash','Linux']} />
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS */}
      <section className="section" id="achievements">
        <div className="wrap">
          <SecHead icon={Award} label="04 / достижения" />
          <div className="ach-list">
            <Ach icon={Trophy}         color="#facc15" rgb="234,179,8"
              title="НорНикель Digital Hack 2024"
              text="финалист федерального хакатона. Прототип по кейсу компании за 48 часов." />
            <Ach icon={ShieldCheck}    color="#4ade80" rgb="34,197,94"
              title="Production с первого дня"
              text="Billing система ISP «Максима» обслуживает 1000+ клиентов." />
            <Ach icon={GitPullRequest} color="#60a5fa" rgb="59,130,246"
              title="Open Source Contributor"
              text="контрибуции в chi, drizzle-orm." />
            <Ach icon={GraduationCap}  color="#a78bfa" rgb="139,92,246"
              title="Coursera: Go Specialization"
              text="University of California, Irvine (2025)." />
          </div>
        </div>
      </section>

      {/* EDUCATION */}
      <section className="section" id="education">
        <div className="wrap">
          <SecHead icon={BookOpen} label="05 / образование" />
          <div className="edu-card">
            <div className="edu-top">
              <div className="edu-uni">НовГУ им. Ярослава Мудрого</div>
              <div className="edu-period">Выпуск 2027</div>
            </div>
            <div className="edu-spec">Информатика и вычислительная техника</div>
            <div className="edu-gpa">GPA: 4.8 / 5.0</div>
            <div className="edu-courses">
              <div className="courses-lbl">Ключевые курсы</div>
              Дискретная математика · Теория алгоритмов · Структуры данных · C/C++ · ООП ·
              PostgreSQL · Компьютерные сети · ОС · Системное программирование · Криптография · Machine Learning
            </div>
          </div>
          <div className="extra-edu">
            {[
              ['Go Specialization',          'Coursera / UC Irvine · 2025'],
              ['System Design',              'Educative.io · 2025'],
              ['PostgreSQL для разработчиков','Postgres Professional · 2024'],
              ['Docker & Kubernetes',        'Слёрм · 2024'],
            ].map(([name, src]) => (
              <div key={name} className="extra-row">
                <span>{name}</span>
                <span className="extra-src">{src}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOOKING FOR */}
      <section className="section" id="looking">
        <div className="wrap">
          <SecHead icon={Search} label="06 / ищу" />
          <div className="looking-card">
            <div className="looking-title">Стажировка / Junior — Go Developer, Backend, Full-Stack</div>
            <p className="looking-desc">
              Хочу работать в команде с code review и понятными процессами.
              Готов разбираться в незнакомых доменах, писать тесты и поддерживать legacy.
              Английский B1–B2: свободно читаю документацию, пишу код и комментарии.
            </p>
            <div className="flags">
              <span className="flag"><Wifi size={11} />Удалённо</span>
              <span className="flag"><Building size={11} />Офис в Великом Новгороде</span>
              <span className="flag"><Plane size={11} />Готов к релокации</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-inner">
            <span>© 2026 Никита Мосягин</span>
            <div className="footer-dot" />
            <a href="mailto:aborigen.nm@gmail.com">aborigen.nm@gmail.com</a>
            <div className="footer-dot" />
            <a href="https://github.com/xlurr" target="_blank" rel="noopener">github.com/xlurr</a>
          </div>
        </div>
      </footer>
    </>
  )
}
