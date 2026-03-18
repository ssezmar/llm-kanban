import {
  ClipboardList, PenTool, Bot, Zap, Eye, RefreshCw, CheckCircle, XCircle,
  Lock, Rocket, Bolt, Smartphone, Bell, BookOpen, Shield, Database,
  Code, FileCode, GitBranch, GitPullRequest, Terminal, Server,
  Globe, Cloud, Cpu, HardDrive, Layers, Package, Settings,
  Search, Filter, BarChart3, PieChart, TrendingUp, Activity,
  Users, UserCheck, Mail, MessageSquare, Send, Inbox,
  Flag, Bookmark, Star, Heart, AlertTriangle, Info,
  Folder, FolderOpen, FileText, Image, Video, Music,
  Calendar, Clock, Timer, Hourglass, Play, Pause, Archive,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Curated icon map for the project
export const ICON_MAP: Record<string, LucideIcon> = {
  'clipboard-list': ClipboardList,
  'pen-tool': PenTool,
  bot: Bot,
  zap: Zap,
  eye: Eye,
  'refresh-cw': RefreshCw,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  lock: Lock,
  rocket: Rocket,
  bolt: Bolt,
  smartphone: Smartphone,
  bell: Bell,
  'book-open': BookOpen,
  shield: Shield,
  database: Database,
  code: Code,
  'file-code': FileCode,
  'git-branch': GitBranch,
  'git-pull-request': GitPullRequest,
  terminal: Terminal,
  server: Server,
  globe: Globe,
  cloud: Cloud,
  cpu: Cpu,
  'hard-drive': HardDrive,
  layers: Layers,
  package: Package,
  settings: Settings,
  search: Search,
  filter: Filter,
  'bar-chart': BarChart3,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  activity: Activity,
  users: Users,
  'user-check': UserCheck,
  mail: Mail,
  'message-square': MessageSquare,
  send: Send,
  inbox: Inbox,
  flag: Flag,
  bookmark: Bookmark,
  star: Star,
  heart: Heart,
  'alert-triangle': AlertTriangle,
  info: Info,
  folder: Folder,
  'folder-open': FolderOpen,
  'file-text': FileText,
  image: Image,
  video: Video,
  music: Music,
  calendar: Calendar,
  clock: Clock,
  timer: Timer,
  hourglass: Hourglass,
  play: Play,
  pause: Pause,
  archive: Archive,
}

export const ICON_NAMES = Object.keys(ICON_MAP)

// Grouped icons for the picker
export const ICON_GROUPS: { label: string; icons: string[] }[] = [
  {
    label: 'Статусы',
    icons: ['clipboard-list', 'pen-tool', 'check-circle', 'x-circle', 'refresh-cw', 'eye', 'play', 'pause', 'flag', 'bookmark'],
  },
  {
    label: 'Разработка',
    icons: ['code', 'file-code', 'terminal', 'git-branch', 'git-pull-request', 'bot', 'cpu', 'database', 'server', 'hard-drive'],
  },
  {
    label: 'Проекты',
    icons: ['rocket', 'zap', 'bolt', 'layers', 'package', 'settings', 'globe', 'cloud', 'shield', 'lock'],
  },
  {
    label: 'Аналитика',
    icons: ['bar-chart', 'pie-chart', 'trending-up', 'activity', 'search', 'filter'],
  },
  {
    label: 'Общение',
    icons: ['users', 'user-check', 'mail', 'message-square', 'send', 'inbox', 'bell', 'smartphone'],
  },
  {
    label: 'Прочее',
    icons: ['star', 'heart', 'alert-triangle', 'info', 'folder', 'folder-open', 'file-text', 'book-open', 'calendar', 'clock', 'timer', 'hourglass'],
  },
]

interface DynamicIconProps {
  name: string
  className?: string
  size?: number
}

export function DynamicIcon({ name, className, size }: DynamicIconProps) {
  const Icon = ICON_MAP[name]
  if (!Icon) return <Code className={cn('h-4 w-4', className)} />
  return <Icon className={className} size={size} />
}
