import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { useGitHubStore } from '@/stores/github-store'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ProductTour, StartTourButton } from '@/components/product-tour'
import { SnakeBackdrop } from '@/components/snake-backdrop'
import {
  LayoutDashboard, KanbanSquare, ListChecks, LogOut, Bot, Layers,
  Database, Network, Users, Cpu, FileText, ChevronDown,
  Github, CircleDot, GitPullRequest, Play, Settings, Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Nav structure ──

interface NavItem {
  to: string
  icon: typeof LayoutDashboard
  label: string
}

const mainNavItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/board', icon: KanbanSquare, label: 'Канбан' },
  { to: '/tasks', icon: ListChecks, label: 'Задачи' },
  { to: '/live', icon: Radio, label: 'Генерация' },
  { to: '/epics', icon: Layers, label: 'Эпики' },
]

const githubNavItems: NavItem[] = [
  { to: '/github/issues', icon: CircleDot, label: 'Issues' },
  { to: '/github/prs', icon: GitPullRequest, label: 'Pull Requests' },
  { to: '/github/actions', icon: Play, label: 'Actions' },
  { to: '/github/settings', icon: Settings, label: 'Настройки' },
]

const schemaNavItems: NavItem[] = [
  { to: '/diagrams', icon: Database, label: 'Схема БД' },
  { to: '/architecture', icon: Network, label: 'Архитектура' },
  { to: '/use-cases', icon: Users, label: 'Прецеденты' },
  { to: '/tech-stack', icon: Cpu, label: 'Технологии' },
]

const allNavItems = [...mainNavItems, ...githubNavItems, ...schemaNavItems]

// ── Generic nav dropdown (reused for GitHub + Документация) ──

function NavDropdown({
  pathname, items, fallbackLabel, fallbackIcon: FallbackIcon, dot,
}: {
  pathname: string
  items: NavItem[]
  fallbackLabel: string
  fallbackIcon: typeof LayoutDashboard
  dot?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = items.some((i) => pathname === i.to || pathname.startsWith(i.to + '/'))
  const activeItem = items.find((i) => pathname === i.to || pathname.startsWith(i.to + '/'))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        size="sm"
        className={cn('gap-2 transition-all', isActive && 'shadow-sm')}
        onClick={() => setOpen(!open)}
      >
        <span className="relative">
          <FallbackIcon className="h-4 w-4" />
          {dot && (
            <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
          )}
        </span>
        {activeItem ? activeItem.label : fallbackLabel}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </Button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-52 rounded-xl border bg-popover shadow-xl shadow-foreground/5 p-1.5 animate-scale-in z-50">
          {items.map(({ to, icon: Icon, label }) => {
            const itemActive = pathname === to || pathname.startsWith(to + '/')
            return (
              <Link key={to} to={to} onClick={() => setOpen(false)}>
                <div className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  itemActive ? 'bg-secondary font-medium' : 'hover:bg-muted'
                )}>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Layout ──

export function Layout() {
  const { user, logout } = useAuthStore()
  const { isConnected } = useGitHubStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Global decorative snake backdrop */}
      <SnakeBackdrop className="fixed inset-0 z-0" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b glass">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5 font-bold text-lg group">
              <div className="relative">
                <Bot className="h-6 w-6 text-foreground dark:text-primary transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 blur-lg bg-foreground/5 dark:bg-primary/20 group-hover:bg-foreground/10 dark:group-hover:bg-primary/30 transition-colors" />
              </div>
              <span className="hidden sm:inline tracking-tight">LLM Kanban</span>
            </Link>
            <nav data-tour="main-nav" className="hidden md:flex items-center gap-0.5">
              {mainNavItems.map(({ to, icon: Icon, label }) => {
                const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
                return (
                  <Link key={to} to={to}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn('gap-2 transition-all', isActive && 'shadow-sm')}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  </Link>
                )
              })}
              <NavDropdown
                pathname={location.pathname}
                items={githubNavItems}
                fallbackLabel="GitHub"
                fallbackIcon={Github}
                dot={isConnected}
              />
              <NavDropdown
                pathname={location.pathname}
                items={schemaNavItems}
                fallbackLabel="Документация"
                fallbackIcon={FileText}
              />
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <StartTourButton />
            <ThemeToggle />
            <button
              className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
              onClick={() => navigate('/profile')}
            >
              <div className="h-7 w-7 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">
                {user?.avatar || user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm text-muted-foreground">{user?.name}</span>
            </button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Выйти">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden sticky top-14 z-30 border-b glass">
        <div className="container mx-auto flex gap-1 px-4 py-1.5 overflow-x-auto">
          {allNavItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
            return (
              <Link key={to} to={to}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-1.5 shrink-0 text-xs"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main content with page animation */}
      <main key={location.pathname} className="relative z-10 container mx-auto px-4 py-6 animate-fade-in-up">
        <Outlet />
      </main>

      {/* Product tour overlay */}
      <ProductTour />
    </div>
  )
}
