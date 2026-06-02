// Content for the course-project presentation. Sourced from the explanatory
// note (ПЗ) and reformulated into concise slide copy.

export const meta = {
  org: 'Новгородский государственный университет имени Ярослава Мудрого',
  institute: 'Политехнический институт',
  department: 'Кафедра информационных технологий и систем',
  title: 'Платформа оркестрации LLM-агентов в виде канбан-доски',
  discipline: 'Курсовой проект по дисциплине «Проектирование информационных систем»',
  direction: '09.03.01 — Информатика и вычислительная техника',
  code: 'ПТИ.КП 3092.ПЗ',
  student: 'Д. А. Романов',
  group: '3092',
  supervisor: 'Л. Н. Цымбалюк',
  city: 'Великий Новгород',
  year: '2026',
  repo: 'https://github.com/ssezmar/llm-kanban',
}

export const heroStats = [
  { value: '33', label: 'микросервиса' },
  { value: '30', label: 'таблиц БД' },
  { value: '38', label: 'прецедентов' },
  { value: '6', label: 'акторов' },
]

export const problems = [
  { icon: 'EyeOff', title: 'Нет наблюдаемости', text: 'Отдельные чаты и копирование результатов не дают отследить жизненный цикл задачи.' },
  { icon: 'CircleDollarSign', title: 'Нет учёта затрат', text: 'Отсутствует единая точка учёта стоимости в токенах — невозможно контролировать бюджет.' },
  { icon: 'ShieldAlert', title: 'Нет контроля качества', text: 'Нет механизма ревью результатов и правил перехода задач по этапам.' },
  { icon: 'Plug', title: 'Разнородность интерфейсов', text: 'У каждого провайдера свой SDK — сложно переключать и комбинировать модели.' },
]

export const solutions = [
  'Полная наблюдаемость: логирование действий агента, учёт стоимости, агрегация метрик',
  'Единый интерфейс к моделям разных провайдеров с fallback-цепочками',
  'Контроль качества: ручное и AI-ревью, граф переходов, WIP-лимиты',
  'Двусторонняя интеграция с GitHub и GitHub Actions',
]

export const actors = [
  { name: 'Администратор', desc: 'пользователи, команды, агенты, конфигурация' },
  { name: 'Менеджер', desc: 'эпики, задачи, приоритеты, ревью, SLA, бюджеты' },
  { name: 'Разработчик', desc: 'задачи, промпты, ревью результатов' },
  { name: 'Наблюдатель', desc: 'доступ только для чтения' },
  { name: 'LLM-агент', desc: 'программный исполнитель задач через API' },
  { name: 'Система', desc: 'автоматические действия' },
]

export interface TechGroup { group: string; icon: string; items: string[] }
export const techGroups: TechGroup[] = [
  { group: 'Серверная часть', icon: 'Server', items: ['Go', 'gRPC + Protobuf', '33 микросервиса'] },
  { group: 'Асинхронное ядро', icon: 'Radio', items: ['Apache Kafka', 'Debezium (CDC)', 'Transactional Outbox'] },
  { group: 'Хранилища (polyglot)', icon: 'Database', items: ['PostgreSQL 16', 'ClickHouse 24', 'Redis 7', 'Elasticsearch 8', 'MinIO'] },
  { group: 'Клиент', icon: 'MonitorSmartphone', items: ['React 19', 'TypeScript', 'Zustand', '@dnd-kit', 'React Flow'] },
  { group: 'Инфраструктура', icon: 'Boxes', items: ['Docker', 'Kubernetes', 'HashiCorp Vault'] },
  { group: 'Наблюдаемость', icon: 'Activity', items: ['Prometheus', 'Grafana', 'Loki', 'Jaeger / OTel'] },
]

export const providers = [
  { name: 'Anthropic', sdk: 'anthropic-sdk-go', models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'] },
  { name: 'OpenAI', sdk: 'openai-go', models: ['gpt-5', 'gpt-5-mini', 'o3'] },
  { name: 'Google', sdk: 'Vertex AI', models: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
]

export const inHouseAgents = ['code_reviewer_v2', 'docs_writer', 'security_scanner', 'migrator']

export const archLayers = [
  { name: 'Edge', tech: 'Nginx', desc: 'TLS, rate limit, WS-upgrade' },
  { name: 'Gateway', tech: 'API Gateway · WS Gateway', desc: 'REST и веб-сокеты' },
  { name: 'Domain', tech: 'gRPC-сервисы', desc: 'бизнес-логика предметной области' },
  { name: 'Async', tech: 'Apache Kafka · Kafka Connect', desc: 'события + CDC (Debezium)' },
  { name: 'Workers', tech: 'agent_worker · indexer · scheduler', desc: 'исполнение и фоновые задачи' },
  { name: 'Data', tech: 'PostgreSQL · ClickHouse · Redis · ES · MinIO', desc: 'полиглот-персистентность' },
  { name: 'Platform', tech: 'Kubernetes · Vault', desc: 'оркестрация и секреты' },
]

export const interactions = [
  { kind: 'Синхронное', tech: 'gRPC + Protobuf', desc: 'строгие контракты, низкая задержка' },
  { kind: 'Асинхронное', tech: 'Apache Kafka', desc: 'топики task.events, agent.cmd, review.events' },
  { kind: 'CDC', tech: 'Debezium', desc: 'связь транзакционного и аналитического контуров' },
]

export const services = [
  { name: 'api_gateway', replicas: 3, purpose: 'REST API, JWT, rate limit' },
  { name: 'ws_gateway', replicas: 2, purpose: 'веб-сокеты, рассылка через Redis Pub/Sub' },
  { name: 'task_svc', replicas: 3, purpose: 'CRUD задач, валидация переходов, события' },
  { name: 'board_svc', replicas: 2, purpose: 'колонки, WIP-лимиты, переходы' },
  { name: 'agent_svc', replicas: 3, purpose: 'реестр агентов, блокировки, команды' },
  { name: 'agent_worker', replicas: 5, purpose: 'исполнение: вызов SDK, повтор, стриминг' },
  { name: 'review_svc', replicas: 2, purpose: 'ручные и AI-ревью, агрегация оценок' },
  { name: 'analytics_svc', replicas: 2, purpose: 'агрегации в ClickHouse: throughput, lead time' },
]

export const dbDomains = [
  { name: 'Core', tables: 'tasks, epics, task_dependencies', purpose: 'задачи, эпики, граф зависимостей' },
  { name: 'Actors', tables: 'users, agents, teams, team_members', purpose: 'пользователи, агенты, команды' },
  { name: 'Configuration', tables: 'columns, transitions, automation_rules, prompt_templates', purpose: 'конфигурация доски' },
  { name: 'Related', tables: 'task_logs, subtasks, comments, reviews, tags, attachments', purpose: 'данные задач' },
  { name: 'Analytics', tables: 'agent_metrics, task_events, cost_ledger, dashboard_snapshots', purpose: 'аналитика и расходы' },
  { name: 'Security', tables: 'api_keys, sessions, audit_log', purpose: 'ключи, сессии, аудит' },
  { name: 'Integration', tables: 'webhooks, webhook_deliveries, notifications', purpose: 'внешние интеграции' },
  { name: 'Queue/Cache', tables: 'kafka_outbox, job_queue, cache_entries', purpose: 'outbox, очередь, кэш' },
]

export const polyglot = [
  { store: 'PostgreSQL 16', role: 'OLTP — транзакции, JSONB, pgvector' },
  { store: 'ClickHouse 24', role: 'OLAP — аналитические агрегации' },
  { store: 'Redis 7', role: 'кэш, Pub/Sub, блокировки, сессии' },
  { store: 'Elasticsearch 8', role: 'полнотекстовый поиск' },
  { store: 'MinIO', role: 'S3-совместимое хранилище файлов' },
]

export const patterns = [
  { name: 'Strategy', use: 'драйверы агентов через единый AgentDriver' },
  { name: 'Observer', use: 'рассылка обновлений доски (Pub/Sub)' },
  { name: 'Factory', use: 'создание драйвера по типу агента' },
  { name: 'Repository', use: 'доступ к данным' },
]

// ── Code samples for the "methods" and "algorithms" slides ──

export const sqlView = `-- Представление: остаток бюджета эпика
CREATE VIEW v_epic_budget AS
SELECT e.id, e.name, e.budget_cents,
       COALESCE(SUM(c.cost_cents), 0) AS spent_cents,
       e.budget_cents - COALESCE(SUM(c.cost_cents), 0) AS remaining
FROM epics e
LEFT JOIN cost_ledger c ON c.epic_id = e.id
GROUP BY e.id, e.name, e.budget_cents;`

export const sqlFunc = `-- Функция: проверка допустимости перехода задачи
CREATE OR REPLACE FUNCTION fn_check_transition(
    p_from TEXT, p_to TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM transitions
    WHERE from_column = p_from AND to_column = p_to);
END;
$$ LANGUAGE plpgsql STABLE;

-- Триггер: прерывает недопустимый переход статуса
CREATE TRIGGER trg_validate_transition
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION trg_validate_transition_fn();`

export const goDriver = `// Паттерн «Стратегия»: единый интерфейс для всех провайдеров
type AgentDriver interface {
    EstimateCost(ctx context.Context, t Task) (Cost, error)
    Execute(ctx context.Context, t Task) (<-chan ExecChunk, error)
    Capabilities() []string
}

// Паттерн «Фабрика»: драйвер по типу агента
func NewDriver(kind string) (AgentDriver, error) {
    switch kind {
    case "anthropic": return &AnthropicDriver{}, nil
    case "openai":    return &OpenAIDriver{}, nil
    case "google":    return &VertexDriver{}, nil
    default:          return nil, ErrUnknownAgent
    }
}`

export const routingCriteria = [
  { icon: 'Tags', title: 'Совпадение компетенций', text: 'теги задачи ↔ массив capabilities агентов' },
  { icon: 'Gauge', title: 'Текущая загрузка', text: 'активные задачи (Redis) < max_concurrent' },
  { icon: 'Wallet', title: 'Бюджет', text: 'budget_cents − Σ cost_ledger > оценки стоимости' },
  { icon: 'TrendingUp', title: 'Производительность', text: 'avg_score и error_rate из agent_metrics' },
]

export const execSteps = [
  'EstimateCost — оценка стоимости через драйвер агента',
  'Проверка бюджета эпика; при недостатке — приостановка',
  'Execute — потоковая передача результата (ExecChunk)',
  'Запись фрагментов в task_logs + трансляция через Redis Pub/Sub',
  'При ошибке (rate-limit, 5xx) — fallback-цепочка или retry',
  'По завершении — фиксация расхода в cost_ledger, переход в ревью',
]

export const demoFeatures = [
  { icon: 'KanbanSquare', title: 'Канбан-доска', text: 'drag-and-drop, WIP-лимиты, граф переходов' },
  { icon: 'Radio', title: 'Живая генерация', text: 'несколько агентов пишут код в реальном времени' },
  { icon: 'GitPullRequest', title: 'GitHub-интеграция', text: 'Issues, PR, дифф-редактор, ревью кода' },
  { icon: 'BarChart3', title: 'Дашборд', text: 'throughput, lead time, стоимость, успешность' },
]

export const studied = [
  'Проектирование ИС: функциональное (IDEF0, DFD) и объектное (UML) моделирование',
  'Микросервисные и событийно-ориентированные архитектуры на Apache Kafka',
  'Полиглот-персистентность (PostgreSQL, ClickHouse, Redis, Elasticsearch)',
  'Работа с LLM через API (Anthropic, OpenAI, Google)',
  'Интеграция с GitHub и GitHub Actions',
  'Разработка на Go, TypeScript и SQL; рабочая документация',
]

export const futureWork = [
  'Нагрузочное тестирование в полном объёме',
  'Интеграция дополнительных провайдеров LLM',
  'Развитие аналитики и прогнозирования стоимости',
  'Усиление мер информационной безопасности',
]

// ── Diagrams from the explanatory note (ПЗ) ──
export interface Diagram { src: string; label: string; cap: string }
const P = (n: number) => `/presentation/image${n}.png`

export const diagrams: Record<string, Diagram[]> = {
  idef0: [
    { src: P(5), label: 'Контекст A-0', cap: 'IDEF0: контекстная диаграмма «Управлять системой LLM Kanban»' },
    { src: P(1), label: 'Декомпозиция A0', cap: 'IDEF0: декомпозиция 1-го уровня — 5 функций системы' },
    { src: P(3), label: '2-й уровень', cap: 'IDEF0: декомпозиция функции «Оркестрировать LLM-агентов»' },
  ],
  dfd: [
    { src: P(6), label: 'Концептуальный', cap: 'DFD: контекстный (концептуальный) уровень' },
    { src: P(7), label: 'Логический', cap: 'DFD: логический уровень — процессы и потоки данных' },
    { src: P(8), label: 'Физический', cap: 'DFD: физический уровень — привязка к хранилищам' },
  ],
  usecase: [
    { src: P(9), label: 'Use Case', cap: 'UML: диаграмма вариантов использования (6 акторов, 38 прецедентов)' },
  ],
  data: [
    { src: P(10), label: 'ER / IDEF1x', cap: 'Концептуальная ER-модель БД в нотации IDEF1x (30 таблиц, 8 доменов)' },
  ],
  arch: [
    { src: P(11), label: 'Архитектура', cap: 'Схема микросервисной архитектуры и взаимодействия с окружением' },
    { src: P(26), label: 'Развёртывание', cap: 'UML: диаграмма развёртывания (Kubernetes-кластер)' },
  ],
  modules: [
    { src: P(14), label: 'Компоненты', cap: 'UML: диаграмма компонентов верхнего уровня' },
    { src: P(15), label: 'Классы', cap: 'UML: диаграмма классов с паттернами Strategy/Factory/Observer/Repository' },
  ],
  algo: [
    { src: P(21), label: 'Блок-схема: маршрутизация', cap: 'Блок-схема алгоритма маршрутизации задачи на агента' },
    { src: P(22), label: 'Блок-схема: выполнение', cap: 'Блок-схема алгоритма выполнения задачи агентом' },
    { src: P(23), label: 'Последовательность', cap: 'UML: диаграмма последовательности маршрутизации задачи' },
  ],
  process: [
    { src: P(24), label: 'BPMN', cap: 'BPMN: процесс обработки задачи с дорожками' },
    { src: P(25), label: 'IDEF3', cap: 'IDEF3: поток выполнения процесса' },
  ],
  prototype: [
    { src: P(12), label: 'Карта экранов', cap: 'Схема навигации по экранам интерфейса' },
    { src: P(17), label: 'Вход', cap: 'Экран входа в систему' },
    { src: P(13), label: 'Канбан-доска', cap: 'Главный экран — канбан-доска' },
    { src: P(16), label: 'Карточка задачи', cap: 'Форма редактирования задачи' },
  ],
  demo: [
    { src: P(13), label: 'Доска', cap: 'Канбан-доска с drag-and-drop' },
    { src: P(18), label: 'Задачи', cap: 'Список задач — мониторинг' },
    { src: P(19), label: 'Агенты', cap: 'Производительность LLM-агентов' },
    { src: P(20), label: 'Дашборд', cap: 'Дашборд аналитики' },
  ],
}

// ── Testing slide ──
export const testKinds = [
  { t: 'Тест-кейсы', d: 'TU01–TU06: авторизация, создание задачи, запрет перехода, ревью, RBAC' },
  { t: 'Модульные (unit)', d: 'Go (testify) + Jest/RTL, принцип AAA, моки и MSW' },
  { t: 'Сквозные (e2e)', d: 'Playwright в Chrome/Firefox/WebKit + visual regression' },
  { t: 'Интеграционные', d: 'testcontainers-go: PostgreSQL, Redis, Kafka' },
  { t: 'Нагрузочное', d: '10/50/100/500 задач; p50/p95/p99; HPA 5→20 реплик' },
]

export const testSummary: [string, string, string, string][] = [
  ['Модульные Go', 'go test', '47', '84% покрытие, 0 гонок'],
  ['Модульные React', 'Jest + RTL', '32', '78% покрытие'],
  ['Сквозные', 'Playwright', '12', '3 браузера · 4:12'],
  ['Скриншот-тесты', 'Playwright', '6', 'порог 0.1%'],
  ['Интеграционные', 'testcontainers-go', '8', 'реальная PostgreSQL'],
  ['Линтеры', 'golangci-lint · ESLint', '—', '0 ошибок'],
]
export const testTotal = '105 тестов — все проходят'

export const goTestCode = `func TestTaskService_Create_Success(t *testing.T) {
    repo := new(mockRepo)                 // Arrange
    svc := NewTaskService(repo, nil, zap.NewNop())
    expected := &Task{ID: "task-1", Status: StatusBacklog}
    repo.On("Insert", mock.Anything, mock.Anything).
        Return(expected, nil)

    task, err := svc.Create(ctx,          // Act
        CreateTaskDTO{Prompt: "Write a REST API", AgentID: "claude-code"})

    assert.NoError(t, err)                // Assert
    assert.Equal(t, "task-1", task.ID)
    repo.AssertExpectations(t)
}`
