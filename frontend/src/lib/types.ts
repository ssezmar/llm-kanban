export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type AgentType = 'claude-code' | 'codex' | 'gemini-cli' | 'custom'

export interface Agent {
  id: string
  name: string
  type: AgentType
  avatar: string
  status: 'idle' | 'busy' | 'offline'
  tasksCompleted: number
  successRate: number
  description: string
  avgExecutionTime: number // minutes
  config: AgentConfig
  createdAt: number
}

export interface TaskLog {
  timestamp: number
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
}

export interface TaskReview {
  reviewer: string
  score: number // 1-10
  comment: string
  timestamp: number
}

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface TaskComment {
  id: string
  author: string
  text: string
  timestamp: number
}

export interface Task {
  id: string
  title: string
  description: string
  prompt: string
  status: string // now a free-form column id
  priority: TaskPriority
  assignedAgent: string | null
  createdBy: string | null // user id
  epicId: string | null
  createdAt: number
  updatedAt: number
  deadline: number | null
  estimatedTime: number // minutes
  progress: number // 0-100
  logs: TaskLog[]
  review: TaskReview | null
  tags: string[]
  subtasks: Subtask[]
  comments: TaskComment[]
  color: string // hex color for left border accent
}

export type EpicStatus = 'planning' | 'active' | 'completed' | 'archived'

export interface Epic {
  id: string
  name: string
  description: string
  emoji: string
  color: string
  status: EpicStatus
  startDate: number | null
  targetDate: number | null
  createdAt: number
  updatedAt: number
}

export interface Column {
  id: string
  title: string
  emoji: string
  description: string
  color: string // hex color for column header accent
  limit?: number // WIP limit
}

// Transition rule: which column can move to which
export interface TransitionRule {
  from: string // column id
  to: string // column id
}

export interface BoardConfig {
  id: string
  name: string
  columns: Column[]
  transitions: TransitionRule[]
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'developer' | 'viewer'
  avatar: string // 2-letter initials
  bio: string
  position: string
  joinedAt: number
}

export interface AgentConfig {
  model: string
  maxTokens: number
  temperature: number
}

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'backlog', title: 'Бэклог', emoji: '📋', description: 'Задачи ожидают формулировки промпта и назначения агента', color: '#64748b' },
  { id: 'prompt_ready', title: 'Промпт готов', emoji: '✍️', description: 'Промпт написан, задача готова к назначению на агента', color: '#8b5cf6' },
  { id: 'agent_assigned', title: 'Агент назначен', emoji: '🤖', description: 'Агент выбран, ожидание запуска выполнения', color: '#6366f1' },
  { id: 'executing', title: 'Выполняется', emoji: '⚡', description: 'LLM-агент активно работает над задачей', color: '#3b82f6', limit: 3 },
  { id: 'review', title: 'Ревью кода', emoji: '👀', description: 'Результат агента на проверке у разработчика', color: '#eab308' },
  { id: 'rework', title: 'Доработка', emoji: '🔄', description: 'Найдены проблемы, задача возвращена агенту', color: '#f97316' },
  { id: 'done', title: 'Готово', emoji: '✅', description: 'Задача завершена и принята', color: '#22c55e' },
  { id: 'failed', title: 'Провалена', emoji: '❌', description: 'Агент не справился, требуется ручное вмешательство', color: '#ef4444' },
]

export const DEFAULT_TRANSITIONS: TransitionRule[] = [
  // Forward flow
  { from: 'backlog', to: 'prompt_ready' },
  { from: 'prompt_ready', to: 'agent_assigned' },
  { from: 'agent_assigned', to: 'executing' },
  { from: 'executing', to: 'review' },
  { from: 'review', to: 'done' },
  // Rework cycle
  { from: 'review', to: 'rework' },
  { from: 'rework', to: 'agent_assigned' },
  // Failures
  { from: 'executing', to: 'failed' },
  { from: 'failed', to: 'backlog' },
  { from: 'failed', to: 'agent_assigned' },
  // Skip steps
  { from: 'backlog', to: 'agent_assigned' },
  { from: 'prompt_ready', to: 'executing' },
  // Return to backlog
  { from: 'agent_assigned', to: 'backlog' },
  { from: 'review', to: 'executing' },
]
