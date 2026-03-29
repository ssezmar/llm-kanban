import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ProductTour, StartTourButton } from '@/components/product-tour'
import {
  LayoutDashboard, KanbanSquare, ListChecks, LogOut, Bot, Layers,
  Database, Network, Users, Cpu, Github, CircleDot, GitPullRequest,
  Play, Settings, Menu, X, ChevronRight,
} from 'lucide-react'
import { useGitHubStore } from '@/stores/github-store'
import { cn } from '@/lib/utils'

// ── Nav structure ──

interface NavItem {
  to: string
  icon: typeof LayoutDashboard
  label: string
}

interface NavGroup {
  title: string
  items: NavItem[]
  indicator?: 'github'
}

const navGroups: NavGroup[] = [
  {
    title: 'Основное',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
      { to: '/board', icon: KanbanSquare, label: 'Канбан' },
      { to: '/tasks', icon: ListChecks, label: 'Задачи' },
      { to: '/epics', icon: Layers, label: 'Эпики' },
    ],
  },
  {
    title: 'GitHub',
    indicator: 'github',
    items: [
      { to: '/github/issues', icon: CircleDot, label: 'Issues' },
      { to: '/github/prs', icon: GitPullRequest, label: 'Pull Requests' },
      { to: '/github/actions', icon: Play, label: 'Actions' },
      { to: '/github/settings', icon: Settings, label: 'Настройки' },
    ],
  },
  {
    title: 'Документация',
    items: [
      { to: '/diagrams', icon: Database, label: 'Схема БД' },
      { to: '/architecture', icon: Network, label: 'Архитектура' },
      { to: '/use-cases', icon: Users, label: 'Прецеденты' },
      { to: '/tech-stack', icon: Cpu, label: 'Технологии' },
    ],
  },
]

const allNavItems = navGroups.flatMap(g => g.items)

// ── Sidebar ──

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { isConnected } = useGitHubStore()

  return (
    <div className="flex flex-col gap-6 py-4">
      {navGroups.map((group) => (
        <div key={group.title}>
          <div className="flex items-center gap-2 px-3 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {group.title}
            </span>
            {group.indicator === 'github' && isConnected && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
            )}
          </div>
          <nav className="space-y-0.5">
            {group.items.map(({ to, icon: Icon, label }) => {
              const isActive = pathname === to || pathname.startsWith(to + '/')
              return (
                <Link key={to} to={to} onClick={onNavigate}>
                  <div className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                    isActive
                      ? 'bg-foreground/[0.06] dark:bg-foreground/[0.08] font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03]'
                  )}>
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground/70')} />
                    {label}
                    {isActive && <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground/50" />}
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
      ))}
    </div>
  )
}

// ── Layout ──

export function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b glass">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>

            <Link to="/dashboard" className="flex items-center gap-2.5 font-bold text-lg group">
              <div className="relative">
                <Bot className="h-6 w-6 text-foreground dark:text-primary transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 blur-lg bg-foreground/5 dark:bg-primary/20 group-hover:bg-foreground/10 dark:group-hover:bg-primary/30 transition-colors" />
              </div>
              <span className="tracking-tight">LLM Kanban</span>
            </Link>
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

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 border-r sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <Sidebar pathname={location.pathname} />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
            <aside className="fixed left-0 top-14 bottom-0 w-64 bg-background border-r z-40 lg:hidden overflow-y-auto animate-slide-in-left">
              <Sidebar pathname={location.pathname} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </>
        )}

        {/* Main content */}
        <main key={location.pathname} className="flex-1 min-w-0 px-4 lg:px-8 py-6 animate-fade-in-up">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Product tour overlay */}
      <ProductTour />
    </div>
  )
}
