# LLM Kanban

Kanban-доска для оркестрации задач между LLM-агентами. Интерфейс позволяет распределять задачи между Claude Code, Codex, Gemini и кастомными AI-агентами, отслеживать прогресс в реальном времени, управлять CI/CD-пайплайнами и проводить ревью результатов.

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Vite](https://img.shields.io/badge/Vite-6-purple)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-blue)
![Zustand](https://img.shields.io/badge/Zustand-5-orange)

---

## Содержание

- [Обзор](#обзор)
- [Возможности](#возможности)
- [Технологии](#технологии)
- [Архитектура](#архитектура)
- [Структура проекта](#структура-проекта)
- [Быстрый старт](#быстрый-старт)
- [Скрипты](#скрипты)
- [Маршрутизация](#маршрутизация)
- [State Management](#state-management)
- [Компоненты](#компоненты)
- [Тема и стили](#тема-и-стили)
- [Анимации](#анимации)
- [Система типов](#система-типов)
- [Визуализации](#визуализации)
- [Конфигурация](#конфигурация)

---

## Обзор

LLM Kanban — фронтенд-приложение для управления задачами, выполняемыми AI-агентами. Концепция: задачи проходят через настраиваемый воркфлоу (Бэклог → Промпт готов → Агент назначен → Выполняется → Ревью → Готово), а система следит за переходами, WIP-лимитами и результатами.

Приложение полностью автономно — работает на mock-данных без бэкенда. Все состояние персистится в `localStorage`. Архитектура готова к подключению реального API: достаточно заменить экшены в Zustand-сторах на HTTP-вызовы.

**~12 000 строк TypeScript/TSX/CSS** — 17 страниц, 6 сторов, 20+ компонентов.

---

## Возможности

### Канбан-доска
- Drag-and-drop перетаскивание задач между колонками (через `@dnd-kit`)
- Настраиваемые колонки с иконками, цветами и описаниями
- **WIP-лимиты** — визуальное предупреждение при превышении лимита на колонке
- **Правила переходов** — система разрешает только определённые переходы между колонками
- Визуальная подсветка разрешённых/запрещённых зон при перетаскивании
- Граф переходов — интерактивная React Flow диаграмма всех возможных переходов

### Задачи
- Создание задач с промптом, приоритетом, дедлайном и тегами
- Назначение AI-агента на задачу
- **Симуляция выполнения** — агент "работает" с прогрессом 0-100% и реалтайм-логами
- Подзадачи с чекбоксами
- Комментарии от пользователей
- Ревью результата с оценкой 1-10 и комментарием
- Прикрепление файлов, изображений и ссылок
- Цветовая маркировка задач (левая граница)
- Привязка к эпикам

### CI/CD Pipeline
- Визуализация пайплайнов как **DAG-графов** (directed acyclic graph)
- Топологическая сортировка стадий по зависимостям (`needs`)
- Анимация выполнения стадий: pending → running → success/failed
- Информация о бранче и коммите
- SVG-отрисовка связей между стадиями

### Эпики
- Создание и управление эпиками (стратегические инициативы)
- Статусы: Planning → Active → Completed → Archived
- Иконки с emoji-пикером
- Прикрепление файлов к эпикам
- Связь эпиков с задачами — отображение на канбан-доске

### Дашборд
- Общая статистика: задачи по статусам, приоритетам, агентам
- **Графики**: Area Chart (тренды), Bar Chart (по колонкам), Radial Bar (нагрузка агентов), Pie Chart (приоритеты)
- Топ задачи по прогрессу
- Последняя активность
- Live-анимация сетевого графа

### AI-агенты
- Профили агентов: Claude Code, Codex, Gemini CLI, Custom
- Метрики: success rate, среднее время выполнения, задачи выполнены
- Конфигурация: модель, max tokens, temperature
- Статусы: idle / busy / offline

### Аутентификация
- Форма входа / регистрации
- Mock-авторизация (логин: `admin@llm.dev`, пароль: `admin`)
- Защищённые маршруты через `ProtectedRoute`
- Роли: admin, manager, developer, viewer
- Профили пользователей

### Документация (встроенные страницы)
- **Схема БД** — интерактивная диаграмма 28 таблиц через React Flow
- **Архитектура системы** — 33 микросервиса на React Flow с группировкой по доменам
- **Прецеденты использования** — 38 use cases, сгруппированных по акторам
- **Стек технологий** — 19 технологий с логотипами и описаниями

### UX
- Тёмная и светлая темы с плавным переключением
- Продуктовый тур (онбординг) для новых пользователей
- Адаптивная навигация: сайдбар + мобильный гамбургер
- Glassmorphism, stagger-анимации, shimmer-лоадеры
- Кастомный скроллбар

---

## Технологии

| Категория | Технология | Версия | Назначение |
|-----------|-----------|--------|------------|
| **Фреймворк** | React | 19.0 | UI-библиотека |
| **Язык** | TypeScript | 5.7 | Строгая типизация |
| **Сборщик** | Vite | 6.0 | Бандлинг и HMR |
| **Роутинг** | React Router | 7.1 | SPA-навигация |
| **Состояние** | Zustand | 5.0 | Глобальное состояние |
| **Стили** | Tailwind CSS | 3.4 | Utility-first CSS |
| **Анимации** | tailwindcss-animate | 1.0 | CSS-анимации |
| **Варианты** | CVA | 0.7 | Варианты компонентов |
| **Классы** | clsx + tailwind-merge | 2.1 / 3.0 | Условные классы |
| **Иконки** | Lucide React | 0.469 | 400+ SVG-иконок |
| **DnD** | @dnd-kit | 6.3 | Drag-and-drop |
| **Графики** | Recharts | 3.8 | Area, Bar, Pie, Radial |
| **Диаграммы** | @xyflow/react | 12.10 | Интерактивные node/edge графы |
| **PostCSS** | PostCSS + Autoprefixer | 8.4 / 10.4 | Обработка CSS |

---

## Архитектура

```
┌────────────────────────────────────────────────────────────┐
│                        React 19 App                        │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Pages (17)   │  │ Components   │  │   Stores (6)     │  │
│  │              │  │  (20+)       │  │                  │  │
│  │  Dashboard   │  │  UI Base     │  │  auth-store      │  │
│  │  Board       │  │  KanbanCol   │  │  tasks-store     │  │
│  │  Tasks       │  │  TaskCard    │  │  board-store     │  │
│  │  Epics       │  │  Pipeline    │  │  epics-store     │  │
│  │  Profiles    │  │  Layout      │  │  agents-store    │  │
│  │  Docs (4)    │  │  ThemeToggle │  │  users-store     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │            │
│         └─────────────────┼────────────────────┘            │
│                           │                                 │
│                    ┌──────┴───────┐                         │
│                    │  lib/        │                         │
│                    │  types.ts    │                         │
│                    │  mock-data.ts│                         │
│                    │  utils.ts    │                         │
│                    └──────┬───────┘                         │
│                           │                                 │
│                    ┌──────┴───────┐                         │
│                    │ localStorage │                         │
│                    │  (persist)   │                         │
│                    └──────────────┘                         │
└────────────────────────────────────────────────────────────┘
```

### Паттерны

- **Atomic Design** — базовые UI-компоненты (`ui/`) → фича-компоненты → страницы
- **Store per domain** — каждый домен (задачи, доска, эпики, агенты, пользователи, авторизация) имеет свой Zustand-стор
- **Persist middleware** — все сторы автоматически сериализуются в `localStorage`
- **Protected routes** — `ProtectedRoute` HOC проверяет `isAuthenticated` из `auth-store`
- **Compound components** — Card = CardHeader + CardContent + CardTitle + CardFooter
- **CVA variants** — кнопки и бейджи через `cva()` с вариантами (default, destructive, outline, ghost...)
- **Path aliases** — `@/` маппится на `./src/` через Vite + TypeScript

---

## Структура проекта

```
frontend/
├── public/                     # Статические ассеты
├── src/
│   ├── components/
│   │   ├── ui/                 # Базовые UI-компоненты
│   │   │   ├── button.tsx      # Кнопка с CVA-вариантами
│   │   │   ├── card.tsx        # Карточка (Header/Content/Footer)
│   │   │   ├── badge.tsx       # Бейдж-индикатор
│   │   │   ├── input.tsx       # Текстовое поле
│   │   │   ├── textarea.tsx    # Многострочное поле
│   │   │   ├── select.tsx      # Выпадающий список
│   │   │   ├── progress.tsx    # Прогресс-бар
│   │   │   ├── dialog.tsx      # Модальное окно
│   │   │   ├── stepper.tsx     # Индикатор шагов
│   │   │   ├── dynamic-icon.tsx # Рендер lucide-иконки по имени
│   │   │   ├── icon-picker.tsx # Выбор иконки
│   │   │   └── emoji-picker.tsx # Выбор emoji
│   │   ├── kanban-column.tsx   # Droppable-колонка канбана
│   │   ├── task-card.tsx       # Draggable-карточка задачи
│   │   ├── pipeline-stages.tsx # DAG-визуализация CI/CD
│   │   ├── layout.tsx          # Обёртка: хедер + навигация + Outlet
│   │   ├── transition-graph.tsx # React Flow граф переходов
│   │   ├── animated-robot.tsx  # SVG-анимация сетевого графа
│   │   ├── page-hero.tsx       # Hero-секция страницы
│   │   ├── product-tour.tsx    # Онбординг-тур
│   │   ├── theme-toggle.tsx    # Переключатель тёмной/светлой темы
│   │   └── attachments-panel.tsx # Управление вложениями
│   ├── pages/
│   │   ├── landing.tsx         # Лендинг (публичный)
│   │   ├── auth.tsx            # Вход / Регистрация
│   │   ├── dashboard.tsx       # Аналитический дашборд
│   │   ├── board.tsx           # Канбан-доска с DnD
│   │   ├── board-settings.tsx  # Настройки колонок и переходов
│   │   ├── tasks.tsx           # Мониторинг задач (таблица)
│   │   ├── task-detail.tsx     # Детальная страница задачи
│   │   ├── task-create.tsx     # Создание задачи (stepper)
│   │   ├── epics.tsx           # Список эпиков
│   │   ├── epic-detail.tsx     # Детальная страница эпика
│   │   ├── epic-create.tsx     # Создание эпика
│   │   ├── user-profile.tsx    # Профиль пользователя
│   │   ├── agent-profile.tsx   # Профиль AI-агента
│   │   ├── db-diagram.tsx      # Схема БД (React Flow)
│   │   ├── architecture.tsx    # Архитектура микросервисов (React Flow)
│   │   ├── use-cases.tsx       # Диаграмма прецедентов
│   │   └── tech-stack.tsx      # Стек технологий
│   ├── stores/
│   │   ├── auth-store.ts       # Авторизация, профиль, роли
│   │   ├── tasks-store.ts      # CRUD задач, подзадачи, пайплайны, логи
│   │   ├── board-store.ts      # Колонки, переходы, WIP-лимиты
│   │   ├── epics-store.ts      # CRUD эпиков
│   │   ├── agents-store.ts     # Список AI-агентов
│   │   └── users-store.ts      # Директория пользователей
│   ├── hooks/
│   │   └── use-theme.ts        # Хук для dark/light темы
│   ├── lib/
│   │   ├── types.ts            # Все TypeScript-интерфейсы и типы
│   │   ├── mock-data.ts        # Mock-данные для демо
│   │   └── utils.ts            # cn() и утилиты
│   ├── app.tsx                 # Корневой компонент + маршрутизация
│   ├── main.tsx                # Точка входа React
│   └── index.css               # Глобальные стили + CSS-переменные тем
├── index.html                  # HTML-шаблон
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## Быстрый старт

### Требования
- **Node.js** 18+
- **npm** 9+ (или pnpm / yarn)

### Установка

```bash
# Клонирование репозитория
git clone <repo-url>
cd frontend

# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev
```

Приложение доступно на `http://localhost:5173`

### Демо-аккаунт

| Поле | Значение |
|------|----------|
| Email | `admin@llm.dev` |
| Пароль | `admin` |

---

## Скрипты

| Скрипт | Команда | Описание |
|--------|---------|----------|
| **dev** | `npm run dev` | Запуск Vite dev-сервера с HMR |
| **build** | `npm run build` | Проверка типов (`tsc -b`) + сборка в `dist/` |
| **preview** | `npm run preview` | Превью production-сборки |

---

## Маршрутизация

React Router v7 с защищёнными маршрутами:

```
/                   → LandingPage          (публичный)
/auth               → AuthPage             (публичный)

/dashboard          → DashboardPage        (защищённый)
/board              → BoardPage            (защищённый)
/board/settings     → BoardSettingsPage    (защищённый)
/tasks              → TasksPage            (защищённый)
/tasks/new          → TaskCreatePage       (защищённый)
/tasks/:id          → TaskDetailPage       (защищённый)
/epics              → EpicsPage            (защищённый)
/epics/new          → EpicCreatePage       (защищённый)
/epics/:id          → EpicDetailPage       (защищённый)
/profile            → UserProfilePage      (защищённый)
/users/:id          → UserProfilePage      (защищённый)
/agents/:id         → AgentProfilePage     (защищённый)
/diagrams           → DbDiagramPage        (защищённый)
/architecture       → ArchitecturePage     (защищённый)
/use-cases          → UseCasesPage         (защищённый)
/tech-stack         → TechStackPage        (защищённый)

*                   → Redirect to /
```

Все защищённые маршруты обёрнуты в `<Layout />` (хедер + навигация + `<Outlet />`).

---

## State Management

6 независимых Zustand-сторов с persist-middleware:

### auth-store

```typescript
interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login(email: string, password: string): boolean
  register(name: string, email: string, password: string): boolean
  logout(): void
  updateProfile(updates: Partial<User>): void
}
```

Ключ localStorage: `auth-storage`

### tasks-store

```typescript
interface TasksState {
  tasks: Task[]
  addTask(task): void
  updateTask(id, updates): void
  moveTask(id, status): void
  deleteTask(id): void
  addLog(id, log): void
  assignAgent(taskId, agentId): void
  startExecution(taskId): void         // Симуляция AI-выполнения
  addSubtask(taskId, title): void
  toggleSubtask(taskId, subtaskId): void
  addComment(taskId, author, text): void
  addAttachment(taskId, attachment): void
  triggerPipeline(taskId, branch, commit): void  // Запуск CI/CD
}
```

Ключ localStorage: `tasks-storage`

`startExecution()` — запускает симуляцию: агент "работает" 5-15 секунд, прогресс обновляется каждые 500мс, в логи пишутся этапы выполнения. По завершении — автоматический ревью-скор.

`triggerPipeline()` — симулирует CI/CD: стадии выполняются последовательно с учётом DAG-зависимостей (`needs`), каждая стадия длится 1-3 секунды.

### board-store

```typescript
interface BoardState {
  columns: Column[]
  transitions: TransitionRule[]
  canTransition(from, to): boolean
  getAllowedTargets(from): string[]
  addColumn(column): void
  removeColumn(id): void
  reorderColumns(ids): void
  addTransition(from, to): void
  removeTransition(from, to): void
}
```

Ключ localStorage: `board-storage`

Дефолтный воркфлоу: 8 колонок, 14 правил переходов. Полностью настраиваемый через `/board/settings`.

### epics-store

```typescript
interface EpicsState {
  epics: Epic[]
  addEpic(epic): void
  updateEpic(id, updates): void
  deleteEpic(id): void
  addAttachment(epicId, attachment): void
  removeAttachment(epicId, attachmentId): void
}
```

Ключ localStorage: `epics-storage`

### agents-store & users-store

Хранят списки AI-агентов и пользователей соответственно. Инициализируются mock-данными.

---

## Компоненты

### UI Base (`components/ui/`)

Все базовые компоненты следуют паттерну:

```tsx
// CVA для вариантов
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", destructive: "...", outline: "...", ghost: "..." },
    size: { default: "...", sm: "...", lg: "...", icon: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
})

// forwardRef + className merge
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
```

### Канбан-доска

```
BoardPage
  └── DndContext (closestCorners)
        ├── KanbanColumn (droppable)
        │     └── TaskCard (sortable, draggable)
        └── DragOverlay
              └── TaskCard (визуальная копия при перетаскивании)
```

- `PointerSensor` с `activationConstraint: { distance: 8 }` — предотвращает случайный DnD при клике
- `columnHighlights` — мемоизированная карта подсветки: `allowed` (зелёная), `current` (нейтральная), `blocked` (красная)
- При дропе проверяется `canTransition(from, to)` — если запрещено, задача возвращается

### Pipeline DAG

```
PipelineStages
  └── SVG Canvas
        ├── Edges (стрелки зависимостей)
        └── Stage Nodes (карточки стадий)
```

Алгоритм:
1. Топологическая сортировка стадий по `needs[]`
2. Разбивка на уровни (BFS-like)
3. Позиционирование нод по уровням
4. Отрисовка SVG-стрелок между зависимыми стадиями

### Transition Graph

Интерактивный React Flow граф:
- Ноды = колонки канбана (с иконкой, цветом, счётчиком задач)
- Рёбра = правила переходов (анимированные)
- Можно добавлять/удалять переходы прямо на графе

---

## Тема и стили

### CSS-переменные

Все цвета определены как HSL-значения в `index.css`:

```css
:root {
  --background: 0 0% 100%;     /* Белый */
  --foreground: 0 0% 0%;       /* Чёрный */
  --card: 0 0% 100%;
  --border: 0 0% 90%;
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;
  /* ... */
}

.dark {
  --background: 0 0% 4%;       /* Почти чёрный */
  --foreground: 0 0% 95%;      /* Почти белый */
  --card: 0 0% 6.5%;
  --border: 0 0% 14%;
  --muted: 0 0% 12%;
  --muted-foreground: 0 0% 55%;
  /* ... */
}
```

### Tailwind Config

```js
darkMode: ["class"]     // Тема через класс .dark на <html>
```

Расширение стандартных цветов Tailwind:

```
background / foreground
primary / primary-foreground
secondary / secondary-foreground
muted / muted-foreground
accent / accent-foreground
destructive / destructive-foreground
card / card-foreground
popover / popover-foreground
border / input / ring
```

### Переключение темы

`useTheme()` хук:
- Читает/записывает `theme` в `localStorage`
- Устанавливает класс `.dark` на `<html>` element
- `ThemeToggle` компонент: Sun/Moon иконка

---

## Анимации

### CSS-анимации (`index.css`)

| Анимация | Назначение | Длительность |
|----------|-----------|-------------|
| `fade-in-up` | Появление страниц и карточек | 0.4s |
| `fade-in` | Общее появление | 0.3s |
| `scale-in` | Диалоги и поповеры | 0.2s |
| `slide-in-bottom` | Мобильные меню | 0.3s |
| `slide-in-left` | Боковые панели | 0.3s |
| `shimmer` | Состояния загрузки | 2s infinite |
| `progress-shine` | Блеск прогресс-бара | 2s infinite |
| `pulse-glow` | Активные индикаторы | 2s infinite |
| `glow-ring` | Привлечение внимания | 2s infinite |
| `bounce-subtle` | Подпрыгивание | 2s infinite |
| `float` | Плавающие элементы | 3s infinite |
| `marquee` | Бегущая строка | customizable |

### Утилитарные классы

```css
.glass            /* Glassmorphism: blur + полупрозрачность */
.gradient-text    /* Градиентный текст (монохром light, градиент dark) */
.gradient-mesh    /* Фоновый радиальный градиент */
.stagger-children /* Каскадное появление дочерних элементов (50ms шаг) */
```

### Stagger-анимации

Дочерние элементы `.stagger-children` появляются с нарастающей задержкой:

```
1-й элемент: 0ms
2-й элемент: 50ms
3-й элемент: 100ms
...
8-й элемент: 350ms
```

---

## Система типов

### Основные интерфейсы

```typescript
// Задача
interface Task {
  id: string
  title: string
  description: string
  prompt: string                    // Промпт для AI-агента
  status: string                    // ID колонки
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedAgent: string | null      // ID агента
  epicId: string | null             // Связь с эпиком
  progress: number                  // 0-100
  logs: TaskLog[]                   // Логи выполнения
  review: TaskReview | null         // Ревью результата
  tags: string[]
  subtasks: Subtask[]
  comments: TaskComment[]
  color: string                     // Цвет левой границы
  pipelines?: Pipeline[]            // CI/CD пайплайны
  attachments?: Attachment[]
  deadline: number | null
  estimatedTime: number             // Минуты
}

// AI-агент
interface Agent {
  id: string
  name: string
  type: 'claude-code' | 'codex' | 'gemini-cli' | 'custom'
  status: 'idle' | 'busy' | 'offline'
  successRate: number
  tasksCompleted: number
  avgExecutionTime: number
  config: { model: string; maxTokens: number; temperature: number }
}

// Колонка канбана
interface Column {
  id: string
  title: string
  icon: string                      // Имя lucide-иконки
  description: string
  color: string                     // HEX-цвет
  limit?: number                    // WIP-лимит
}

// Правило перехода
interface TransitionRule {
  from: string                      // ID колонки-источника
  to: string                        // ID колонки-назначения
}

// CI/CD стадия (DAG)
interface PipelineStage {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  needs?: string[]                  // Зависимости (DAG-рёбра)
  log: string
}

// Эпик
interface Epic {
  id: string
  name: string
  description: string
  icon: string
  color: string
  status: 'planning' | 'active' | 'completed' | 'archived'
}
```

### Дефолтный воркфлоу

8 колонок с 14 правилами переходов:

```
Бэклог → Промпт готов → Агент назначен → Выполняется → Ревью → Готово
                                    ↑                      │
                                    └── Доработка ←────────┘
                                                    Выполняется → Провалена → Бэклог
```

---

## Визуализации

### Recharts (Дашборд)

| Тип графика | Данные | Компонент |
|------------|--------|-----------|
| **AreaChart** | Тренд создания задач за 7 дней | `ResponsiveContainer + Area` |
| **BarChart** | Задачи по колонкам | `ResponsiveContainer + Bar` |
| **RadialBarChart** | Нагрузка агентов | `ResponsiveContainer + RadialBar` |
| **PieChart** | Распределение по приоритетам | `ResponsiveContainer + Pie + Cell` |

### React Flow (@xyflow/react)

| Страница | Содержимое | Кол-во нод |
|----------|-----------|------------|
| **Схема БД** | 28 таблиц PostgreSQL + связи FK | ~28 |
| **Архитектура** | 33 микросервиса + инфраструктура | ~40+ |
| **Настройки доски** | Граф переходов между колонками | 8 |

Все диаграммы интерактивные: зум, перетаскивание, MiniMap, фильтрация.

### Pipeline DAG (SVG)

Кастомная SVG-отрисовка пайплайнов:
- Топологическая сортировка (Kahn's algorithm)
- Многоуровневый layout
- Анимированные стрелки зависимостей
- Цветовая индикация статусов

---

## Конфигурация

### TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Vite (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
})
```

### Tailwind (`tailwind.config.js`)

```javascript
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { /* HSL CSS variables */ } } },
  plugins: [require("tailwindcss-animate")]
}
```

### PostCSS (`postcss.config.js`)

```javascript
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} }
}
```

---

## Лицензия

MIT
