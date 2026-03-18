import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, TaskLog, Subtask, TaskComment } from '@/lib/types'
import { mockTasks } from '@/lib/mock-data'

interface TasksState {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'logs' | 'review' | 'createdBy'> & { createdBy?: string | null }) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  moveTask: (id: string, status: string) => void
  deleteTask: (id: string) => void
  addLog: (id: string, log: Omit<TaskLog, 'timestamp'>) => void
  assignAgent: (taskId: string, agentId: string) => void
  startExecution: (taskId: string) => void
  addSubtask: (taskId: string, title: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  removeSubtask: (taskId: string, subtaskId: string) => void
  addComment: (taskId: string, author: string, text: string) => void
  removeComment: (taskId: string, commentId: string) => void
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: mockTasks,

      addTask: (taskData) => {
        const task: Task = {
          ...taskData,
          id: `task-${Date.now()}`,
          createdBy: taskData.createdBy ?? null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          progress: 0,
          logs: [],
          review: null,
        }
        set((state) => ({ tasks: [...state.tasks, task] }))
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
        }))
      },

      moveTask: (id, status) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status, updatedAt: Date.now() } : t
          ),
        }))
      },

      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
      },

      addLog: (id, log) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, logs: [...t.logs, { ...log, timestamp: Date.now() }], updatedAt: Date.now() }
              : t
          ),
        }))
      },

      assignAgent: (taskId, agentId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, assignedAgent: agentId, updatedAt: Date.now() } : t
          ),
        }))
      },

      startExecution: (taskId) => {
        const { moveTask, addLog, updateTask } = get()
        moveTask(taskId, 'executing')
        addLog(taskId, { message: 'Агент начал выполнение задачи...', type: 'info' })

        const messages = [
          { message: 'Анализ требований...', type: 'info' as const, progress: 15 },
          { message: 'Генерация кода...', type: 'info' as const, progress: 35 },
          { message: 'Компиляция и проверка типов...', type: 'info' as const, progress: 55 },
          { message: 'Запуск тестов...', type: 'warning' as const, progress: 70 },
          { message: 'Все тесты пройдены', type: 'success' as const, progress: 85 },
          { message: 'Форматирование и финализация...', type: 'info' as const, progress: 95 },
          { message: 'Задача выполнена успешно!', type: 'success' as const, progress: 100 },
        ]

        messages.forEach((msg, i) => {
          setTimeout(() => {
            addLog(taskId, { message: msg.message, type: msg.type })
            updateTask(taskId, { progress: msg.progress })
            if (i === messages.length - 1) {
              moveTask(taskId, 'review')
              updateTask(taskId, {
                review: {
                  reviewer: 'Авто-ревью',
                  score: Math.floor(Math.random() * 3) + 7,
                  comment: 'Код соответствует требованиям. Рекомендуется ручная проверка.',
                  timestamp: Date.now(),
                },
              })
            }
          }, (i + 1) * 2000)
        })
      },

      addSubtask: (taskId, title) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: [...t.subtasks, { id: `st-${Date.now()}`, title, done: false }],
                  updatedAt: Date.now(),
                }
              : t
          ),
        }))
      },

      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, done: !s.done } : s
                  ),
                  updatedAt: Date.now(),
                }
              : t
          ),
        }))
      },

      removeSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId), updatedAt: Date.now() }
              : t
          ),
        }))
      },

      addComment: (taskId, author, text) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  comments: [
                    ...t.comments,
                    { id: `c-${Date.now()}`, author, text, timestamp: Date.now() },
                  ],
                  updatedAt: Date.now(),
                }
              : t
          ),
        }))
      },

      removeComment: (taskId, commentId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, comments: t.comments.filter((c) => c.id !== commentId), updatedAt: Date.now() }
              : t
          ),
        }))
      },
    }),
    { name: 'tasks-storage' }
  )
)
