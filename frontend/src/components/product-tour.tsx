import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, X, Presentation } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGitHubStore } from '@/stores/github-store'
import { MOCK_TOKEN, MOCK_OWNER, MOCK_REPO } from '@/lib/github-mock'

// Connect the GitHub mock dataset so the GitHub tour steps render live data.
function ensureMockGitHub() {
  const s = useGitHubStore.getState()
  if (!s.isConnected) s.connect(MOCK_TOKEN, MOCK_OWNER, MOCK_REPO)
}

// ── Tour step definition ──

interface TourStep {
  /** Route to navigate to before showing this step */
  route: string
  /** CSS selector for the element to highlight. null = full-screen overlay (no spotlight) */
  selector: string | null
  /** Title of the step */
  title: string
  /** Description (supports line breaks via \n) */
  description: string
  /** Tooltip placement relative to highlighted element */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  /** Optional: section label shown as a small badge */
  section?: string
}

// ── All tour steps ──

const TOUR_STEPS: TourStep[] = [
  // ── Введение ──
  {
    route: '/dashboard',
    selector: '[data-tour="dashboard-page"]',
    title: 'Добро пожаловать в LLM Kanban!',
    description: 'Это система оркестрации задач для LLM-агентов. Здесь вы можете создавать задачи с промптами, назначать их AI-агентам (Claude Code, Codex, Gemini), отслеживать выполнение и оценивать результаты.\n\nДавайте познакомимся с основными возможностями!',
    placement: 'bottom',
    section: 'Введение',
  },

  // ── Навигация ──
  {
    route: '/dashboard',
    selector: '[data-tour="main-nav"]',
    title: 'Навигация',
    description: 'Основное меню приложения: Дашборд, Канбан, Задачи, Генерация (живая генерация кода), Эпики, выпадающее меню GitHub (Issues, PR, Actions, настройки) и Документация.\n\nЗелёная точка у GitHub означает, что подключены демо-данные.',
    placement: 'bottom',
    section: 'Навигация',
  },

  // ── Дашборд ──
  {
    route: '/dashboard',
    selector: '[data-tour="dashboard-stats"]',
    title: 'Сводная статистика',
    description: 'Ключевые метрики проекта: общее количество задач со спарклайном за 14 дней, процент завершения, средняя оценка качества из ревью агентов, количество просроченных задач.',
    placement: 'bottom',
    section: 'Дашборд',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="dashboard-charts"]',
    title: 'Графики и диаграммы',
    description: 'Горизонтальная гистограмма показывает распределение задач по столбцам канбан-доски. Кольцевая диаграмма — разбивку по приоритетам (низкий, средний, высокий, критический).',
    placement: 'bottom',
    section: 'Дашборд',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="dashboard-active"]',
    title: 'Задачи и дедлайны',
    description: 'Задачи в работе — прогресс активных задач в реальном времени с привязанным агентом.\n\nБлижайшие дедлайны — с подсветкой просроченных и срочных задач.',
    placement: 'bottom',
    section: 'Дашборд',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="dashboard-performance"]',
    title: 'Производительность',
    description: 'Производительность агентов — успешность, оценки, статус каждого AI-агента. Кликабельно — ведёт на профиль.\n\nПрогресс эпиков — выполнение по каждому эпику с дедлайнами.',
    placement: 'top',
    section: 'Дашборд',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="dashboard-users"]',
    title: 'Пользователи и оценки',
    description: 'Самые активные пользователи — рейтинг по количеству задач и комментариев.\n\nРаспределение оценок — гистограмма оценок ревью от 1 до 10.',
    placement: 'top',
    section: 'Дашборд',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="dashboard-extras"]',
    title: 'Облако тегов и события',
    description: 'Популярные теги — частотность тегов по задачам.\n\nСводка — общая оценка времени, комментарии, подзадачи, логи, агенты.\n\nПоследние события — лента из логов агентов и комментариев команды.',
    placement: 'top',
    section: 'Дашборд',
  },

  // ── Канбан ──
  {
    route: '/board',
    selector: '[data-tour="board-columns"]',
    title: 'Канбан-доска',
    description: 'Основное рабочее пространство. Задачи организованы в колонки по статусу: Бэклог → Промпт готов → Агент назначен → Выполняется → Ревью → Доработка → Готово / Отклонено.\n\nКаждая карточка показывает приоритет, теги, прогресс и назначенного агента.',
    placement: 'bottom',
    section: 'Канбан',
  },
  {
    route: '/board',
    selector: '[data-tour="board-page"]',
    title: 'Drag & Drop',
    description: 'Задачи можно перетаскивать между колонками. При перетаскивании система подсвечивает разрешённые целевые колонки зелёным и блокированные — красным, согласно графу переходов.',
    placement: 'bottom',
    section: 'Канбан',
  },

  // ── Настройки ──
  {
    route: '/board/settings',
    selector: '[data-tour="transition-graph"]',
    title: 'Граф переходов',
    description: 'Интерактивный граф — визуально управляйте разрешёнными переходами между статусами задач. Соедините узлы для добавления перехода, кликните по стрелке для удаления. Узлы можно перетаскивать.',
    placement: 'bottom',
    section: 'Настройки',
  },
  {
    route: '/board/settings',
    selector: '[data-tour="columns-config"]',
    title: 'Настройка колонок',
    description: 'Управление столбцами канбан-доски: добавление новых, удаление существующих, настройка иконок, цветов, описаний и лимитов WIP (Work In Progress).',
    placement: 'top',
    section: 'Настройки',
  },

  // ── Мониторинг ──
  {
    route: '/tasks',
    selector: '[data-tour="tasks-filters"]',
    title: 'Поиск и фильтры',
    description: 'Поиск задач по названию или тегам. Фильтрация по статусу — кнопки соответствуют колонкам канбан-доски.',
    placement: 'bottom',
    section: 'Мониторинг',
  },
  {
    route: '/tasks',
    selector: '[data-tour="tasks-page"]',
    title: 'Мониторинг задач',
    description: 'Полный список всех задач. Для каждой видны: приоритет, статус, агент, дедлайн, прогресс, оценка ревью, подзадачи.\n\nОтсюда можно запускать выполнение задачи агентом и удалять задачи.',
    placement: 'bottom',
    section: 'Мониторинг',
  },

  // ── Задачи ──
  {
    route: '/tasks/task-3',
    selector: '[data-tour="task-detail-page"]',
    title: 'Детальная страница задачи',
    description: 'Полная информация о задаче:\n\n• Промпт — текст задания для AI-агента\n• Подзадачи — чеклист подзадач\n• Логи выполнения — таймлайн действий агента\n• Ревью — оценка результата (1–10 баллов)\n• Комментарии — обсуждение команды\n• Метаданные — создатель, агент, эпик, приоритет, дедлайн',
    placement: 'right',
    section: 'Задачи',
  },
  {
    route: '/tasks/new',
    selector: '[data-tour="task-create-page"]',
    title: 'Создание задачи',
    description: 'Пошаговый мастер создания задачи (4 шага):\n\n1. Основное — название, описание, начальный столбец\n2. Промпт — текст задания для LLM-агента\n3. Параметры — приоритет, назначение агента, привязка к эпику\n4. Детали — дедлайн, теги, оценка времени, цвет карточки',
    placement: 'right',
    section: 'Задачи',
  },

  // ── Генерация кода ──
  {
    route: '/tasks/task-6',
    selector: '[data-tour="task-codegen"]',
    title: 'Встроенный редактор кода',
    description: 'Прямо в карточке задачи — встроенный редактор кода в стиле VS Code / Zed: подсветка синтаксиса, нумерация строк, оконные элементы.\n\nКогда агент выполняет задачу (статус «Выполняется»), код печатается посимвольно в реальном времени с мигающим курсором. После завершения здесь виден готовый результат.',
    placement: 'top',
    section: 'Генерация',
  },
  {
    route: '/live',
    selector: '[data-tour="live-grid"]',
    title: 'Живая генерация по нескольким задачам',
    description: 'Страница «Генерация» показывает, как несколько LLM-агентов одновременно пишут код по разным задачам в реальном времени.\n\nКаждая панель — отдельный агент со своей моделью, файлом и скоростью печати. Кликните по заголовку, чтобы открыть задачу.',
    placement: 'top',
    section: 'Генерация',
  },

  // ── GitHub ──
  {
    route: '/github/settings',
    selector: '[data-tour="github-demo"]',
    title: 'GitHub-интеграция',
    description: 'Полноценная интеграция с GitHub: Issues, Pull Requests, ревью кода и Actions.\n\nКнопка «Подключить демо» загружает красивый набор моков без токена — он уже подключён для этого тура (зелёная точка в меню GitHub).',
    placement: 'right',
    section: 'GitHub',
  },
  {
    route: '/github/issues',
    selector: '[data-tour="github-issues-page"]',
    title: 'Issues = задачи',
    description: 'Issues из GitHub отображаются со статусами, метками и авторами. Их можно синхронизировать с канбан-доской и связывать с задачами проекта.\n\nКнопкой «Open / Closed / All» фильтруются по состоянию.',
    placement: 'bottom',
    section: 'GitHub',
  },
  {
    route: '/github/issues/2',
    selector: '[data-tour="issue-body"]',
    title: 'Код прямо в Issue',
    description: 'В описании issue блоки кода рендерятся встроенным редактором с подсветкой синтаксиса.\n\nВыше, в блоке «Связи», показано, какой LLM-агент работает над issue и с какой задачей канбана он связан — видно «где какой агент что сделал».',
    placement: 'top',
    section: 'GitHub',
  },
  {
    route: '/github/prs',
    selector: '[data-tour="github-prs-page"]',
    title: 'Pull Requests',
    description: 'Список PR с состоянием (Open / Merged / Draft), ветками, количеством файлов и строк (+/−), числом комментариев и ревью.',
    placement: 'bottom',
    section: 'GitHub',
  },
  {
    route: '/github/prs/3',
    selector: '[data-tour="pr-diff"]',
    title: 'Просмотр кода и ревью в PR',
    description: 'В каждом PR — встроенный дифф-редактор в стиле VS Code / Zed: слева список изменённых файлов, справа дифф с нумерацией строк и подсветкой добавлений (зелёный) и удалений (красный).\n\nНиже — ревью кода (Approved / Changes requested) и связь PR с агентом-автором и задачей канбана.',
    placement: 'top',
    section: 'GitHub',
  },

  // ── Оформление ──
  {
    route: '/dashboard',
    selector: null,
    title: 'Живой фон со змейкой',
    description: 'По всему приложению — декоративный анимированный фон: клеточная сетка и плавная «змейка» на canvas, которая ползает и «ест» точки на узлах сетки.\n\nФон адаптируется к теме, уважает prefers-reduced-motion и не мешает работе (не перехватывает клики).',
    placement: 'center',
    section: 'Оформление',
  },

  // ── Эпики ──
  {
    route: '/epics',
    selector: '[data-tour="epics-list"]',
    title: 'Эпики',
    description: 'Эпики — группы связанных задач для стратегического планирования.\n\nДля каждого эпика: прогресс выполнения, распределение задач по колонкам (цветная полоса), дедлайн, количество задач.\n\nКликните на эпик для детальной статистики.',
    placement: 'bottom',
    section: 'Эпики',
  },

  // ── Агенты ──
  {
    route: '/agents/agent-1',
    selector: '[data-tour="agent-profile-page"]',
    title: 'Профиль LLM-агента',
    description: 'Каждый AI-агент имеет свой профиль:\n\n• Статус (свободен / занят / офлайн)\n• Метрики — завершённые задачи, успешность, среднее время, средняя оценка\n• Конфигурация — модель, max tokens, temperature\n• Назначенные задачи и последние логи\n\nПоддерживаются Claude Code, Codex CLI, Gemini CLI и кастомные агенты.',
    placement: 'left',
    section: 'Агенты',
  },

  // ── Пользователи ──
  {
    route: '/profile',
    selector: '[data-tour="user-profile-page"]',
    title: 'Профиль пользователя',
    description: 'Профиль с информацией о роли, статистикой (задачи созданные / завершённые / просроченные), списком задач и последними комментариями.\n\nСвой профиль можно редактировать — изменить имя, должность, описание.',
    placement: 'left',
    section: 'Пользователи',
  },

  // ── Схема БД ──
  {
    route: '/diagrams',
    selector: '[data-tour="db-diagram-page"]',
    title: 'Схема базы данных',
    description: 'Интерактивная ER-диаграмма всей базы данных системы — 28 таблиц, 36 связей, 8 групп.\n\nТри уровня детализации: группы → таблицы (PK/FK) → полная схема с типами и ограничениями. Поддержка поиска, фильтров по группам и подсветки связей при наведении.',
    placement: 'bottom',
    section: 'Диаграммы',
  },

  // ── Архитектура ──
  {
    route: '/architecture',
    selector: '[data-tour="architecture-page"]',
    title: 'Архитектура микросервисов',
    description: 'Схема распределённой архитектуры: 33 сервиса в 9 слоях — от клиента и API Gateway до Kafka, PostgreSQL, Redis и Kubernetes.\n\nТри уровня погружения, фильтрация по типу соединений (sync/async/data/monitor), иконки технологий на каждом узле.',
    placement: 'bottom',
    section: 'Диаграммы',
  },

  // ── Прецеденты ──
  {
    route: '/use-cases',
    selector: '[data-tour="use-cases-page"]',
    title: 'Диаграмма прецедентов',
    description: 'UML Use Case диаграмма с 6 акторами и 38 прецедентами в 6 группах.\n\nТри уровня детализации: от обзора групп до полных описаний. Фигурки человечков, робота (LLM-агент) и шестерёнки (Система) для разных типов акторов.',
    placement: 'bottom',
    section: 'Диаграммы',
  },

  // ── Технологии ──
  {
    route: '/tech-stack',
    selector: '[data-tour="tech-stack-page"]',
    title: 'Выбор технологий',
    description: 'Обоснование выбора каждой технологии в проекте — 19 инструментов в 7 категориях.\n\nДля каждой технологии: версия, роль, причина выбора, ключевые фичи, сравнение с альтернативами и метрики производительности.',
    placement: 'bottom',
    section: 'Диаграммы',
  },

  // ── Завершение ──
  {
    route: '/dashboard',
    selector: '[data-tour="dashboard-page"]',
    title: 'Спасибо за внимание!',
    description: 'Это были основные возможности LLM Kanban — системы оркестрации задач для AI-агентов.\n\nКлючевые технологии: React 19, TypeScript, Zustand, @dnd-kit, React Flow, Tailwind CSS.\n\nПопробуйте сами — создайте задачу, назначьте агента и посмотрите как работает система!',
    placement: 'bottom',
    section: 'Завершение',
  },
]

// ── Tour context / state ──

let globalStartTour: (() => void) | null = null

export function startTour() {
  globalStartTour?.()
}

// ── Spotlight + Tooltip overlay ──

function TourOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
}: {
  step: TourStep
  stepIndex: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState<React.CSSProperties>({})
  const tooltipRef = useRef<HTMLDivElement>(null)
  const padding = 8
  const gap = 12
  const margin = 16

  // Find the target element
  useEffect(() => {
    if (!step.selector) {
      setRect(null)
      return
    }

    const find = () => {
      const el = document.querySelector(step.selector!)
      if (el) {
        setRect(el.getBoundingClientRect())
        return true
      }
      return false
    }

    if (find()) return

    // Retry a few times for elements that render after route change
    let attempts = 0
    const interval = setInterval(() => {
      if (find() || ++attempts > 15) clearInterval(interval)
    }, 200)

    return () => clearInterval(interval)
  }, [step.selector])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'Enter') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNext, onPrev, onClose])

  // Scroll target into view
  useEffect(() => {
    if (rect) {
      const el = document.querySelector(step.selector!)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Re-measure after scroll
      setTimeout(() => {
        const el2 = document.querySelector(step.selector!)
        if (el2) setRect(el2.getBoundingClientRect())
      }, 400)
    }
  }, [step.selector])

  // Compute tooltip position AFTER render so we can measure tooltip size
  useEffect(() => {
    const tooltip = tooltipRef.current
    if (!tooltip) return

    const vw = window.innerWidth
    const vh = window.innerHeight
    const tw = tooltip.offsetWidth
    const th = tooltip.offsetHeight

    // No rect or no selector → center on screen
    if (!rect || !step.selector) {
      setTooltipPos({
        position: 'fixed',
        top: Math.max(margin, (vh - th) / 2),
        left: Math.max(margin, (vw - tw) / 2),
      })
      return
    }

    // Spotlight rect (with padding)
    const sr = {
      top: rect.top - padding,
      bottom: rect.bottom + padding,
      left: rect.left - padding,
      right: rect.right + padding,
    }

    // Available space in each direction
    const spaceBottom = vh - sr.bottom - gap
    const spaceTop = sr.top - gap
    const spaceRight = vw - sr.right - gap
    const spaceLeft = sr.left - gap

    // Try preferred placement first, then fall back
    type Dir = 'bottom' | 'top' | 'right' | 'left'
    const preferred = step.placement || 'bottom'
    const all: Dir[] = ['bottom', 'top', 'right', 'left']
    const placements: Dir[] =
      preferred === 'center'
        ? all
        : [preferred as Dir, ...all].filter((v, i, a) => a.indexOf(v) === i)

    let top = 0
    let left = 0
    let placed = false

    for (const p of placements) {
      if (p === 'bottom' && spaceBottom >= th) {
        top = sr.bottom + gap
        left = clampH(sr.left, tw, vw)
        placed = true
        break
      }
      if (p === 'top' && spaceTop >= th) {
        top = sr.top - gap - th
        left = clampH(sr.left, tw, vw)
        placed = true
        break
      }
      if (p === 'right' && spaceRight >= tw) {
        top = clampV(sr.top, th, vh)
        left = sr.right + gap
        placed = true
        break
      }
      if (p === 'left' && spaceLeft >= tw) {
        top = clampV(sr.top, th, vh)
        left = sr.left - gap - tw
        placed = true
        break
      }
    }

    // If nothing fits perfectly, pick the side with most space and clamp
    if (!placed) {
      const best = Math.max(spaceBottom, spaceTop, spaceRight, spaceLeft)
      if (best === spaceBottom || best === spaceTop) {
        top = best === spaceBottom ? sr.bottom + gap : sr.top - gap - th
        left = clampH(sr.left, tw, vw)
      } else {
        top = clampV(sr.top, th, vh)
        left = best === spaceRight ? sr.right + gap : sr.left - gap - tw
      }
    }

    // Final safety clamp
    top = Math.max(margin, Math.min(top, vh - th - margin))
    left = Math.max(margin, Math.min(left, vw - tw - margin))

    setTooltipPos({ position: 'fixed', top, left })
  }, [rect, step.selector, step.placement, stepIndex])

  // Helpers to center-align and clamp within viewport
  function clampH(targetLeft: number, tooltipW: number, viewW: number) {
    return Math.max(margin, Math.min(targetLeft, viewW - tooltipW - margin))
  }
  function clampV(targetTop: number, tooltipH: number, viewH: number) {
    return Math.max(margin, Math.min(targetTop, viewH - tooltipH - margin))
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999]" onClick={onClose}>
      {/* Background overlay — no blur so spotlighted content stays sharp */}
      {(!rect || !step.selector) && (
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />
      )}

      {/* Spotlight: dark overlay with a clear hole via box-shadow */}
      {rect && step.selector && (
        <div
          className="absolute rounded-xl transition-all duration-300 ring-2 ring-white/20"
          style={{
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            zIndex: 1,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={cn(
          'z-10 w-[400px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] flex flex-col rounded-2xl border bg-card text-card-foreground shadow-2xl',
          'animate-fade-in-up'
        )}
        style={tooltipPos}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1 rounded-t-2xl bg-gradient-to-r from-foreground/20 via-foreground/40 to-foreground/20" />

        <div className="p-5 space-y-3 overflow-y-auto flex-1 min-h-0">
          {/* Section badge + step counter */}
          <div className="flex items-center justify-between">
            {step.section && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {step.section}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto">
              {stepIndex + 1} / {totalSteps}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold leading-tight">{step.title}</h3>

          {/* Description */}
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {step.description}
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground/30 rounded-full transition-all duration-500"
              style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Закрыть
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrev}
                disabled={stepIndex === 0}
                className="gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Назад
              </Button>

              {stepIndex < totalSteps - 1 ? (
                <Button size="sm" onClick={onNext} className="gap-1">
                  Далее
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={onClose} className="gap-1">
                  Завершить
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="border-t px-5 py-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">←</kbd>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">→</kbd>
            навигация
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">Esc</kbd>
            закрыть
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Main ProductTour component ──

export function ProductTour() {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  // Register global start function
  useEffect(() => {
    globalStartTour = () => {
      ensureMockGitHub()
      setStepIndex(0)
      setActive(true)
    }
    return () => { globalStartTour = null }
  }, [])

  // Auto-start from URL param ?tour=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tour') === 'true') {
      // Small delay to let the page render
      setTimeout(() => {
        ensureMockGitHub()
        setStepIndex(0)
        setActive(true)
      }, 500)
    }
  }, [])

  const step = TOUR_STEPS[stepIndex]

  // Navigate to the step's route if needed
  useEffect(() => {
    if (active && step && location.pathname !== step.route) {
      navigate(step.route)
    }
  }, [active, stepIndex, step, location.pathname, navigate])

  const handleNext = useCallback(() => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      setActive(false)
    }
  }, [stepIndex])

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1)
    }
  }, [stepIndex])

  const handleClose = useCallback(() => {
    setActive(false)
  }, [])

  if (!active || !step) return null

  return (
    <TourOverlay
      step={step}
      stepIndex={stepIndex}
      totalSteps={TOUR_STEPS.length}
      onNext={handleNext}
      onPrev={handlePrev}
      onClose={handleClose}
    />
  )
}

// ── Start Tour button (for header/anywhere) ──

export function StartTourButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 text-xs"
      onClick={() => startTour()}
      title="Запустить демо-тур"
    >
      <Presentation className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Демо</span>
    </Button>
  )
}
