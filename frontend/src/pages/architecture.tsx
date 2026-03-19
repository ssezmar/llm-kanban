import { useMemo, useCallback, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { cn } from '@/lib/utils'
import {
  Server, Globe, Database, Shield, Cpu, Radio,
  HardDrive, Layers, Container, Network, Eye, EyeOff,
  MonitorSpeaker, Workflow, ArrowRightLeft,
} from 'lucide-react'

// ── Architecture Node Types ──────────────────────────

type ServiceGroup =
  | 'client'
  | 'gateway'
  | 'service'
  | 'worker'
  | 'messaging'
  | 'database'
  | 'cache'
  | 'monitoring'
  | 'infrastructure'

interface ServiceDef {
  id: string
  name: string
  subtitle: string
  group: ServiceGroup
  color: string
  icon: string
  tech: string[]
  ports?: string[]
  replicas?: number
  description?: string
}

const SERVICES: ServiceDef[] = [
  // ── Client ──
  {
    id: 'spa', name: 'SPA Frontend', subtitle: 'React 19 + Vite 6', group: 'client', color: '#3b82f6',
    icon: 'globe', tech: ['React 19', 'TypeScript', 'Tailwind CSS', 'Zustand', '@dnd-kit', 'React Flow'],
    description: 'Single Page Application, канбан-доска, дашборд, аналитика',
  },
  {
    id: 'mobile', name: 'Mobile PWA', subtitle: 'Progressive Web App', group: 'client', color: '#3b82f6',
    icon: 'monitor', tech: ['Service Worker', 'Push API', 'IndexedDB'],
    description: 'Мобильное приложение через PWA',
  },

  // ── Gateway / Infra ──
  {
    id: 'nginx', name: 'Nginx', subtitle: 'Reverse Proxy + LB', group: 'gateway', color: '#22c55e',
    icon: 'shield', tech: ['Nginx 1.25', 'SSL/TLS', 'Rate Limiting', 'gzip'],
    ports: ['80', '443'], replicas: 2,
    description: 'Load balancer, TLS termination, статика, rate limiting',
  },
  {
    id: 'api_gateway', name: 'API Gateway', subtitle: 'Go + Chi Router', group: 'gateway', color: '#22c55e',
    icon: 'server', tech: ['Go 1.22', 'Chi', 'JWT', 'OpenTelemetry', 'Prometheus'],
    ports: ['8080'], replicas: 3,
    description: 'Auth, routing, rate limiting, request validation, tracing',
  },
  {
    id: 'ws_gateway', name: 'WebSocket Gateway', subtitle: 'Go + Gorilla WS', group: 'gateway', color: '#22c55e',
    icon: 'radio', tech: ['Go 1.22', 'Gorilla WebSocket', 'Redis PubSub'],
    ports: ['8081'], replicas: 2,
    description: 'Real-time уведомления, live-обновления доски',
  },

  // ── Core Services ──
  {
    id: 'task_svc', name: 'Task Service', subtitle: 'Go Microservice', group: 'service', color: '#8b5cf6',
    icon: 'server', tech: ['Go 1.22', 'GORM', 'gRPC', 'Protobuf'],
    ports: ['9001'], replicas: 3,
    description: 'CRUD задач, prompt management, task lifecycle, dependencies DAG',
  },
  {
    id: 'board_svc', name: 'Board Service', subtitle: 'Go Microservice', group: 'service', color: '#8b5cf6',
    icon: 'server', tech: ['Go 1.22', 'GORM', 'gRPC'],
    ports: ['9002'], replicas: 2,
    description: 'Колонки, переходы, WIP-лимиты, автоматизация',
  },
  {
    id: 'agent_svc', name: 'Agent Orchestrator', subtitle: 'Go Microservice', group: 'service', color: '#8b5cf6',
    icon: 'cpu', tech: ['Go 1.22', 'gRPC', 'Circuit Breaker', 'Retry'],
    ports: ['9003'], replicas: 3,
    description: 'Оркестрация LLM-агентов, распределение задач, retry logic',
  },
  {
    id: 'user_svc', name: 'User Service', subtitle: 'Go Microservice', group: 'service', color: '#8b5cf6',
    icon: 'server', tech: ['Go 1.22', 'GORM', 'bcrypt', 'JWT'],
    ports: ['9004'], replicas: 2,
    description: 'Auth, профили, команды, роли, сессии',
  },
  {
    id: 'epic_svc', name: 'Epic Service', subtitle: 'Go Microservice', group: 'service', color: '#8b5cf6',
    icon: 'layers', tech: ['Go 1.22', 'GORM', 'gRPC'],
    ports: ['9005'], replicas: 2,
    description: 'Эпики, бюджеты, прогресс, сроки',
  },
  {
    id: 'review_svc', name: 'Review Service', subtitle: 'Go Microservice', group: 'service', color: '#8b5cf6',
    icon: 'server', tech: ['Go 1.22', 'gRPC', 'Claude API'],
    ports: ['9006'], replicas: 2,
    description: 'Code review, scoring, AI-assisted анализ качества',
  },
  {
    id: 'notification_svc', name: 'Notification Service', subtitle: 'Go Microservice', group: 'service', color: '#8b5cf6',
    icon: 'server', tech: ['Go 1.22', 'SMTP', 'FCM', 'WebSocket'],
    ports: ['9007'], replicas: 2,
    description: 'Email, push, in-app, webhook уведомления',
  },
  {
    id: 'analytics_svc', name: 'Analytics Service', subtitle: 'Go Microservice', group: 'service', color: '#8b5cf6',
    icon: 'server', tech: ['Go 1.22', 'ClickHouse client', 'gRPC'],
    ports: ['9008'], replicas: 2,
    description: 'Метрики, дашборд-снимки, cost tracking, отчёты',
  },
  {
    id: 'search_svc', name: 'Search Service', subtitle: 'Go Microservice', group: 'service', color: '#8b5cf6',
    icon: 'server', tech: ['Go 1.22', 'Elasticsearch client', 'gRPC'],
    ports: ['9009'],
    description: 'Полнотекстовый поиск по задачам, логам, комментариям',
  },

  // ── Workers ──
  {
    id: 'agent_worker', name: 'Agent Worker', subtitle: 'Go Worker Pool', group: 'worker', color: '#f97316',
    icon: 'cpu', tech: ['Go 1.22', 'Claude API', 'OpenAI API', 'Gemini API', 'Kafka Consumer'],
    replicas: 5,
    description: 'Выполнение LLM-задач, streaming, token counting',
  },
  {
    id: 'webhook_worker', name: 'Webhook Worker', subtitle: 'Go Worker', group: 'worker', color: '#f97316',
    icon: 'workflow', tech: ['Go 1.22', 'Kafka Consumer', 'HTTP client', 'Retry'],
    replicas: 2,
    description: 'Доставка webhook-ов с ретраями и dead letter queue',
  },
  {
    id: 'scheduler', name: 'Scheduler', subtitle: 'Go Cron', group: 'worker', color: '#f97316',
    icon: 'workflow', tech: ['Go 1.22', 'robfig/cron', 'distributed lock'],
    replicas: 1,
    description: 'Deadline checker, cleanup, snapshot generation, SLA alerts',
  },
  {
    id: 'indexer', name: 'Search Indexer', subtitle: 'Go Worker', group: 'worker', color: '#f97316',
    icon: 'workflow', tech: ['Go 1.22', 'Kafka Consumer', 'ES Bulk API'],
    replicas: 2,
    description: 'CDC → Elasticsearch индексация в реальном времени',
  },

  // ── Messaging ──
  {
    id: 'kafka', name: 'Apache Kafka', subtitle: 'Event Streaming', group: 'messaging', color: '#ef4444',
    icon: 'radio', tech: ['Kafka 3.7', 'KRaft', 'Schema Registry', 'Protobuf'],
    replicas: 3,
    description: 'task.events, agent.commands, notifications, webhooks, cdc',
  },
  {
    id: 'kafka_connect', name: 'Kafka Connect', subtitle: 'CDC Pipeline', group: 'messaging', color: '#ef4444',
    icon: 'workflow', tech: ['Debezium', 'PostgreSQL CDC', 'Elasticsearch Sink'],
    replicas: 2,
    description: 'Change Data Capture из PostgreSQL в Kafka и далее',
  },

  // ── Databases ──
  {
    id: 'pg_primary', name: 'PostgreSQL Primary', subtitle: 'Primary (Write)', group: 'database', color: '#06b6d4',
    icon: 'database', tech: ['PostgreSQL 16', 'pgvector', 'pg_partman', 'pg_stat_statements'],
    ports: ['5432'],
    description: 'Основная БД — tasks, users, agents, epics + vector embeddings',
  },
  {
    id: 'pg_replica', name: 'PostgreSQL Replica', subtitle: 'Read Replicas', group: 'database', color: '#06b6d4',
    icon: 'database', tech: ['PostgreSQL 16', 'Streaming Replication', 'pgpool-II'],
    replicas: 2,
    description: 'Реплики для чтения — аналитика, поиск, дашборды',
  },
  {
    id: 'clickhouse', name: 'ClickHouse', subtitle: 'Analytics OLAP', group: 'database', color: '#06b6d4',
    icon: 'database', tech: ['ClickHouse 24', 'MergeTree', 'Materialized Views'],
    ports: ['8123'],
    description: 'OLAP для метрик, event store, cost ledger, time-series',
  },
  {
    id: 'elasticsearch', name: 'Elasticsearch', subtitle: 'Full-text Search', group: 'database', color: '#06b6d4',
    icon: 'database', tech: ['Elasticsearch 8', 'ILM', 'Cross-cluster'],
    ports: ['9200'], replicas: 3,
    description: 'Полнотекстовый поиск задач, логов, документации',
  },

  // ── Cache ──
  {
    id: 'redis_primary', name: 'Redis Primary', subtitle: 'Cache + PubSub', group: 'cache', color: '#eab308',
    icon: 'harddrive', tech: ['Redis 7', 'Redis Cluster', 'Streams', 'PubSub'],
    ports: ['6379'],
    description: 'Кэш, сессии, rate limiter, distributed locks, WS pub/sub',
  },
  {
    id: 'redis_sentinel', name: 'Redis Sentinel', subtitle: 'HA Failover', group: 'cache', color: '#eab308',
    icon: 'harddrive', tech: ['Redis Sentinel', 'Auto-failover'],
    replicas: 3,
    description: 'Мониторинг и автоматический failover Redis',
  },

  // ── Monitoring ──
  {
    id: 'prometheus', name: 'Prometheus', subtitle: 'Metrics', group: 'monitoring', color: '#a855f7',
    icon: 'monitor', tech: ['Prometheus', 'AlertManager', 'Recording Rules'],
    ports: ['9090'],
    description: 'Сбор метрик со всех сервисов, алерты',
  },
  {
    id: 'grafana', name: 'Grafana', subtitle: 'Dashboards', group: 'monitoring', color: '#a855f7',
    icon: 'monitor', tech: ['Grafana 11', 'Loki', 'Tempo'],
    ports: ['3000'],
    description: 'Визуализация метрик, логов, трейсов',
  },
  {
    id: 'jaeger', name: 'Jaeger', subtitle: 'Distributed Tracing', group: 'monitoring', color: '#a855f7',
    icon: 'network', tech: ['Jaeger', 'OpenTelemetry Collector', 'OTLP'],
    ports: ['16686'],
    description: 'Распределённый трейсинг между микросервисами',
  },
  {
    id: 'loki', name: 'Loki', subtitle: 'Log Aggregation', group: 'monitoring', color: '#a855f7',
    icon: 'monitor', tech: ['Grafana Loki', 'Promtail', 'LogQL'],
    description: 'Агрегация логов со всех контейнеров',
  },

  // ── Infrastructure ──
  {
    id: 'k8s', name: 'Kubernetes', subtitle: 'Container Orchestration', group: 'infrastructure', color: '#64748b',
    icon: 'container', tech: ['K8s 1.30', 'Helm', 'ArgoCD', 'HPA', 'PDB'],
    description: 'Оркестрация контейнеров, auto-scaling, rolling updates',
  },
  {
    id: 'vault', name: 'HashiCorp Vault', subtitle: 'Secrets Management', group: 'infrastructure', color: '#64748b',
    icon: 'shield', tech: ['Vault', 'Transit', 'PKI', 'K8s Auth'],
    description: 'API ключи, сертификаты, шифрование, ротация секретов',
  },
  {
    id: 'minio', name: 'MinIO', subtitle: 'Object Storage (S3)', group: 'infrastructure', color: '#64748b',
    icon: 'harddrive', tech: ['MinIO', 'S3 API', 'Versioning'],
    description: 'Хранение вложений, логов, артефактов',
  },
]

interface ConnectionDef {
  from: string
  to: string
  label?: string
  type: 'sync' | 'async' | 'data' | 'monitor'
  protocol?: string
  bidirectional?: boolean
}

const CONNECTIONS: ConnectionDef[] = [
  // Client → Gateway
  { from: 'spa', to: 'nginx', label: 'HTTPS', type: 'sync', protocol: 'HTTP/2' },
  { from: 'mobile', to: 'nginx', label: 'HTTPS', type: 'sync' },
  { from: 'nginx', to: 'api_gateway', label: 'HTTP', type: 'sync', protocol: 'proxy_pass' },
  { from: 'nginx', to: 'ws_gateway', label: 'WS', type: 'sync', protocol: 'upgrade' },
  { from: 'nginx', to: 'spa', label: 'static', type: 'sync' },
  { from: 'nginx', to: 'grafana', label: '/grafana', type: 'sync' },

  // API Gateway → Services (gRPC)
  { from: 'api_gateway', to: 'task_svc', label: 'gRPC', type: 'sync' },
  { from: 'api_gateway', to: 'board_svc', label: 'gRPC', type: 'sync' },
  { from: 'api_gateway', to: 'agent_svc', label: 'gRPC', type: 'sync' },
  { from: 'api_gateway', to: 'user_svc', label: 'gRPC', type: 'sync' },
  { from: 'api_gateway', to: 'epic_svc', label: 'gRPC', type: 'sync' },
  { from: 'api_gateway', to: 'review_svc', label: 'gRPC', type: 'sync' },
  { from: 'api_gateway', to: 'analytics_svc', label: 'gRPC', type: 'sync' },
  { from: 'api_gateway', to: 'search_svc', label: 'gRPC', type: 'sync' },
  { from: 'api_gateway', to: 'redis_primary', label: 'rate limit', type: 'data' },

  // WS Gateway
  { from: 'ws_gateway', to: 'redis_primary', label: 'PubSub', type: 'async' },
  { from: 'ws_gateway', to: 'user_svc', label: 'auth', type: 'sync' },

  // Service → DB
  { from: 'task_svc', to: 'pg_primary', label: 'write', type: 'data' },
  { from: 'task_svc', to: 'pg_replica', label: 'read', type: 'data' },
  { from: 'task_svc', to: 'redis_primary', label: 'cache', type: 'data' },
  { from: 'board_svc', to: 'pg_primary', label: 'write', type: 'data' },
  { from: 'board_svc', to: 'redis_primary', label: 'cache', type: 'data' },
  { from: 'agent_svc', to: 'pg_primary', label: 'write', type: 'data' },
  { from: 'agent_svc', to: 'redis_primary', label: 'locks', type: 'data' },
  { from: 'user_svc', to: 'pg_primary', label: 'write', type: 'data' },
  { from: 'user_svc', to: 'redis_primary', label: 'sessions', type: 'data' },
  { from: 'epic_svc', to: 'pg_primary', label: 'write', type: 'data' },
  { from: 'review_svc', to: 'pg_primary', label: 'write', type: 'data' },
  { from: 'analytics_svc', to: 'clickhouse', label: 'OLAP', type: 'data' },
  { from: 'analytics_svc', to: 'pg_replica', label: 'read', type: 'data' },
  { from: 'search_svc', to: 'elasticsearch', label: 'search', type: 'data' },
  { from: 'notification_svc', to: 'pg_primary', label: 'write', type: 'data' },

  // Service → Kafka (publish)
  { from: 'task_svc', to: 'kafka', label: 'task.events', type: 'async' },
  { from: 'agent_svc', to: 'kafka', label: 'agent.commands', type: 'async' },
  { from: 'review_svc', to: 'kafka', label: 'review.events', type: 'async' },
  { from: 'board_svc', to: 'kafka', label: 'board.events', type: 'async' },
  { from: 'notification_svc', to: 'kafka', label: 'notify.events', type: 'async' },

  // Kafka → Workers (consume)
  { from: 'kafka', to: 'agent_worker', label: 'agent.commands', type: 'async' },
  { from: 'kafka', to: 'webhook_worker', label: 'webhook.events', type: 'async' },
  { from: 'kafka', to: 'notification_svc', label: 'notify.events', type: 'async' },
  { from: 'kafka', to: 'indexer', label: 'cdc.events', type: 'async' },

  // Kafka Connect / CDC
  { from: 'pg_primary', to: 'kafka_connect', label: 'WAL/CDC', type: 'async' },
  { from: 'kafka_connect', to: 'kafka', label: 'cdc.topics', type: 'async' },
  { from: 'pg_primary', to: 'pg_replica', label: 'streaming', type: 'data', protocol: 'WAL' },

  // Workers → external
  { from: 'agent_worker', to: 'kafka', label: 'task.results', type: 'async' },
  { from: 'agent_worker', to: 'redis_primary', label: 'progress', type: 'data' },
  { from: 'indexer', to: 'elasticsearch', label: 'bulk index', type: 'data' },
  { from: 'scheduler', to: 'pg_primary', label: 'cron jobs', type: 'data' },
  { from: 'scheduler', to: 'redis_primary', label: 'dist lock', type: 'data' },
  { from: 'scheduler', to: 'kafka', label: 'scheduled', type: 'async' },

  // Redis HA
  { from: 'redis_sentinel', to: 'redis_primary', label: 'monitor', type: 'monitor' },

  // Monitoring
  { from: 'prometheus', to: 'api_gateway', label: '/metrics', type: 'monitor' },
  { from: 'prometheus', to: 'task_svc', label: '/metrics', type: 'monitor' },
  { from: 'prometheus', to: 'agent_svc', label: '/metrics', type: 'monitor' },
  { from: 'prometheus', to: 'kafka', label: 'JMX', type: 'monitor' },
  { from: 'prometheus', to: 'pg_primary', label: 'exporter', type: 'monitor' },
  { from: 'prometheus', to: 'redis_primary', label: 'exporter', type: 'monitor' },
  { from: 'grafana', to: 'prometheus', label: 'query', type: 'monitor' },
  { from: 'grafana', to: 'loki', label: 'logs', type: 'monitor' },
  { from: 'grafana', to: 'jaeger', label: 'traces', type: 'monitor' },
  { from: 'jaeger', to: 'api_gateway', label: 'OTLP', type: 'monitor' },
  { from: 'jaeger', to: 'task_svc', label: 'OTLP', type: 'monitor' },

  // Infra
  { from: 'k8s', to: 'vault', label: 'secrets', type: 'data' },
  { from: 'api_gateway', to: 'vault', label: 'secrets', type: 'data' },
  { from: 'agent_worker', to: 'vault', label: 'API keys', type: 'data' },
  { from: 'task_svc', to: 'minio', label: 'attachments', type: 'data' },
]

// ── Node Rendering ───────────────────────────────────

const ICON_MAP: Record<string, typeof Server> = {
  server: Server, globe: Globe, database: Database, shield: Shield,
  cpu: Cpu, radio: Radio, harddrive: HardDrive, layers: Layers,
  container: Container, network: Network, monitor: MonitorSpeaker,
  workflow: Workflow,
}

interface ServiceNodeData {
  service: ServiceDef
  highlighted: boolean
  dimmed: boolean
  [key: string]: unknown
}

function ServiceNode({ data }: { data: ServiceNodeData }) {
  const { service: svc, highlighted, dimmed } = data
  const Icon = ICON_MAP[svc.icon] || Server
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        'rounded-xl border-2 overflow-hidden transition-all duration-200 min-w-[220px] max-w-[260px]',
        highlighted ? 'shadow-2xl scale-[1.03]' : 'shadow-md',
        dimmed && 'opacity-15',
      )}
      style={{ borderColor: highlighted ? svc.color : 'hsl(var(--border))' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !w-full !h-2 !min-h-0 !border-0 !rounded-none !top-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !w-full !h-2 !min-h-0 !border-0 !rounded-none !bottom-0" />
      <Handle type="target" position={Position.Left} className="!bg-transparent !h-full !w-2 !min-w-0 !border-0 !rounded-none !left-0" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !h-full !w-2 !min-w-0 !border-0 !rounded-none !right-0" />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing"
        style={{ background: `${svc.color}15` }}
      >
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${svc.color}25` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: svc.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs truncate">{svc.name}</div>
          <div className="text-[9px] text-muted-foreground truncate">{svc.subtitle}</div>
        </div>
        {svc.replicas && svc.replicas > 1 && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: `${svc.color}20`, color: svc.color }}
          >
            ×{svc.replicas}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="bg-card px-3 py-2 space-y-1.5">
        {/* Ports */}
        {svc.ports && (
          <div className="flex items-center gap-1 flex-wrap">
            {svc.ports.map(p => (
              <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-muted font-mono">
                :{p}
              </span>
            ))}
          </div>
        )}

        {/* Tech tags */}
        <div className="flex flex-wrap gap-1">
          {(expanded ? svc.tech : svc.tech.slice(0, 3)).map(t => (
            <span
              key={t}
              className="text-[9px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: `${svc.color}10`, color: svc.color }}
            >
              {t}
            </span>
          ))}
          {!expanded && svc.tech.length > 3 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
              className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              +{svc.tech.length - 3}
            </button>
          )}
        </div>

        {/* Description */}
        {svc.description && highlighted && (
          <p className="text-[10px] text-muted-foreground leading-tight border-t border-border/50 pt-1.5">
            {svc.description}
          </p>
        )}
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  service: ServiceNode as any,
}

// ── Positions ────────────────────────────────────────

function getPositions(): Record<string, { x: number; y: number }> {
  return {
    // Clients (top)
    spa:                 { x: 300,  y: 0 },
    mobile:              { x: 600,  y: 0 },
    // Gateway (layer 1)
    nginx:               { x: 450,  y: 200 },
    api_gateway:         { x: 250,  y: 420 },
    ws_gateway:          { x: 700,  y: 420 },
    // Services (layer 2) — spread wide
    task_svc:            { x: -100, y: 680 },
    board_svc:           { x: 200,  y: 680 },
    agent_svc:           { x: 500,  y: 680 },
    user_svc:            { x: 800,  y: 680 },
    epic_svc:            { x: 1100, y: 680 },
    review_svc:          { x: -100, y: 920 },
    notification_svc:    { x: 200,  y: 920 },
    analytics_svc:       { x: 500,  y: 920 },
    search_svc:          { x: 800,  y: 920 },
    // Messaging (layer 3)
    kafka:               { x: 400,  y: 1180 },
    kafka_connect:       { x: 750,  y: 1180 },
    // Workers (layer 3 sides)
    agent_worker:        { x: -100, y: 1180 },
    webhook_worker:      { x: 100,  y: 1380 },
    scheduler:           { x: -100, y: 1380 },
    indexer:             { x: 750,  y: 1380 },
    // Databases (layer 4)
    pg_primary:          { x: 200,  y: 1600 },
    pg_replica:          { x: 500,  y: 1600 },
    clickhouse:          { x: 800,  y: 1600 },
    elasticsearch:       { x: 1100, y: 1600 },
    // Cache (right side)
    redis_primary:       { x: 1200, y: 420 },
    redis_sentinel:      { x: 1200, y: 200 },
    // Monitoring (far right)
    prometheus:          { x: 1500, y: 680 },
    grafana:             { x: 1500, y: 200 },
    jaeger:              { x: 1500, y: 920 },
    loki:                { x: 1750, y: 680 },
    // Infrastructure (far left)
    k8s:                 { x: -450, y: 200 },
    vault:               { x: -450, y: 420 },
    minio:               { x: -450, y: 680 },
  }
}

// ── Group Meta ───────────────────────────────────────

const GROUP_META: Record<ServiceGroup, { bg: string; label: string }> = {
  client:         { bg: '#3b82f6', label: 'Clients' },
  gateway:        { bg: '#22c55e', label: 'Gateway' },
  service:        { bg: '#8b5cf6', label: 'Services' },
  worker:         { bg: '#f97316', label: 'Workers' },
  messaging:      { bg: '#ef4444', label: 'Messaging' },
  database:       { bg: '#06b6d4', label: 'Databases' },
  cache:          { bg: '#eab308', label: 'Cache' },
  monitoring:     { bg: '#a855f7', label: 'Monitoring' },
  infrastructure: { bg: '#64748b', label: 'Infrastructure' },
}

const CONNECTION_STYLES: Record<ConnectionDef['type'], { color: string; dash?: string; width: number }> = {
  sync:    { color: '#3b82f6', width: 2 },
  async:   { color: '#ef4444', dash: '8 4', width: 2 },
  data:    { color: '#06b6d4', dash: '4 3', width: 1.5 },
  monitor: { color: '#a855f7', dash: '3 6', width: 1 },
}

// ── Main Component ───────────────────────────────────

function ArchitectureInner() {
  const [hovered, setHovered] = useState<string | null>(null)
  const [activeGroups, setActiveGroups] = useState<Set<ServiceGroup>>(new Set(Object.keys(GROUP_META) as ServiceGroup[]))
  const [showLabels, setShowLabels] = useState(true)
  const [connType, setConnType] = useState<ConnectionDef['type'] | 'all'>('all')

  const filteredIds = useMemo(() => (
    new Set(SERVICES.filter(s => activeGroups.has(s.group)).map(s => s.id))
  ), [activeGroups])

  const connected = useMemo(() => {
    if (!hovered) return new Set<string>()
    const set = new Set<string>([hovered])
    CONNECTIONS.forEach(c => {
      if (c.from === hovered) set.add(c.to)
      if (c.to === hovered) set.add(c.from)
    })
    return set
  }, [hovered])

  const nodes: Node[] = useMemo(() => {
    const pos = getPositions()
    return SERVICES.filter(s => filteredIds.has(s.id)).map(svc => ({
      id: svc.id,
      type: 'service',
      position: pos[svc.id] || { x: 0, y: 0 },
      data: {
        service: svc,
        highlighted: hovered === svc.id,
        dimmed: hovered !== null && !connected.has(svc.id),
      } satisfies ServiceNodeData,
    }))
  }, [hovered, connected, filteredIds])

  const edges: Edge[] = useMemo(() => {
    return CONNECTIONS
      .filter(c => filteredIds.has(c.from) && filteredIds.has(c.to))
      .filter(c => connType === 'all' || c.type === connType)
      .map((c, i) => {
        const isHl = hovered && (c.from === hovered || c.to === hovered)
        const isDim = hovered && !isHl
        const style = CONNECTION_STYLES[c.type]

        return {
          id: `c-${i}`,
          source: c.from,
          target: c.to,
          type: 'smoothstep',
          animated: !!isHl,
          label: showLabels ? c.label : undefined,
          labelStyle: {
            fontSize: 8,
            fontFamily: 'ui-monospace, monospace',
            fill: isHl ? '#fafafa' : '#52525b',
            fontWeight: isHl ? 600 : 400,
          },
          labelBgStyle: {
            fill: isHl ? style.color : 'hsl(var(--background))',
            fillOpacity: isHl ? 0.9 : 0.7,
            rx: 3, ry: 3,
          },
          labelBgPadding: [2, 4] as [number, number],
          style: {
            stroke: isHl ? style.color : isDim ? '#1a1a1e' : `${style.color}50`,
            strokeWidth: isHl ? style.width + 1 : isDim ? 0.5 : style.width,
            strokeDasharray: style.dash,
            opacity: isDim ? 0.08 : 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 10, height: 10,
            color: isHl ? style.color : isDim ? '#1a1a1e' : `${style.color}80`,
          },
        }
      })
  }, [hovered, filteredIds, connType, showLabels])

  const [ns, setNs, onNC] = useNodesState(nodes)
  const [es, setEs, onEC] = useEdgesState(edges)

  useMemo(() => {
    setNs(prev => {
      const pm = new Map(prev.map(n => [n.id, n.position]))
      return nodes.map(n => ({ ...n, position: pm.get(n.id) || n.position }))
    })
  }, [nodes])
  useMemo(() => { setEs(edges) }, [edges])

  const onEnter = useCallback((_: React.MouseEvent, node: Node) => setHovered(node.id), [])
  const onLeave = useCallback(() => setHovered(null), [])

  const toggleGroup = (g: ServiceGroup) => {
    setActiveGroups(prev => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g); else next.add(g)
      return next
    })
  }

  const totalReplicas = SERVICES.filter(s => filteredIds.has(s.id)).reduce((s, svc) => s + (svc.replicas || 1), 0)

  return (
    <div className="h-[calc(100vh-7.5rem)]" data-tour="architecture-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Network className="h-6 w-6 text-muted-foreground" />
            Архитектура системы
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Микросервисная архитектура · Go + Kafka + Redis + PostgreSQL + Nginx
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card border">
            <Server className="h-3 w-3 text-muted-foreground" />
            <span className="font-bold">{filteredIds.size}</span>
            <span className="text-muted-foreground">сервисов</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card border">
            <Container className="h-3 w-3 text-muted-foreground" />
            <span className="font-bold">{totalReplicas}</span>
            <span className="text-muted-foreground">реплик</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card border">
            <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
            <span className="font-bold">{CONNECTIONS.filter(c => filteredIds.has(c.from) && filteredIds.has(c.to)).length}</span>
            <span className="text-muted-foreground">связей</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Group filters */}
        {(Object.entries(GROUP_META) as [ServiceGroup, { bg: string; label: string }][]).map(([key, { bg, label }]) => {
          const active = activeGroups.has(key)
          const count = SERVICES.filter(s => s.group === key).length
          return (
            <button
              key={key}
              onClick={() => toggleGroup(key)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all border',
                active ? 'border-transparent' : 'border-transparent opacity-35 hover:opacity-60',
              )}
              style={active ? { background: `${bg}15`, color: bg, borderColor: `${bg}30` } : {}}
            >
              <div className="h-2 w-2 rounded-sm" style={{ background: bg, opacity: active ? 1 : 0.3 }} />
              {label}
              <span className="text-[9px] opacity-60">{count}</span>
            </button>
          )
        })}

        <div className="w-px h-6 bg-border" />

        {/* Connection type filter */}
        {(['all', 'sync', 'async', 'data', 'monitor'] as const).map(t => (
          <button
            key={t}
            onClick={() => setConnType(t)}
            className={cn(
              'px-2 py-1 rounded-md text-[11px] font-medium border transition-all',
              connType === t ? 'bg-card border-border' : 'border-transparent opacity-50 hover:opacity-75',
            )}
          >
            {t === 'all' ? 'Все' : t === 'sync' ? 'Sync' : t === 'async' ? 'Async' : t === 'data' ? 'Data' : 'Monitor'}
          </button>
        ))}

        <div className="w-px h-6 bg-border" />

        <button
          onClick={() => setShowLabels(!showLabels)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-all',
            showLabels ? 'border-border bg-card' : 'border-transparent opacity-50',
          )}
        >
          {showLabels ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Подписи
        </button>
      </div>

      {/* Diagram */}
      <div className="rounded-xl border bg-card overflow-hidden h-[calc(100%-6.5rem)]">
        <ReactFlow
          nodes={ns}
          edges={es}
          nodeTypes={nodeTypes}
          onNodesChange={onNC}
          onEdgesChange={onEC}
          onNodeMouseEnter={onEnter}
          onNodeMouseLeave={onLeave}
          fitView
          fitViewOptions={{ padding: 0.08 }}
          nodesDraggable
          panOnDrag
          zoomOnScroll
          minZoom={0.1}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background gap={30} size={1} className="!bg-background" />
          <Controls
            showInteractive={false}
            className="!bg-card !border-border !shadow-sm [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted"
          />
          <MiniMap
            nodeColor={(node) => {
              const svc = SERVICES.find(s => s.id === node.id)
              return svc?.color || '#3f3f46'
            }}
            maskColor="hsl(var(--background) / 0.85)"
            className="!bg-card !border-border"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="absolute bottom-20 left-8 bg-card/90 backdrop-blur-sm border rounded-lg p-3 text-[10px] space-y-1.5 z-10">
        <div className="font-semibold text-xs mb-2">Типы связей</div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0 border-t-2" style={{ borderColor: '#3b82f6' }} />
          <span className="text-muted-foreground">Sync (gRPC / HTTP)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0 border-t-2 border-dashed" style={{ borderColor: '#ef4444' }} />
          <span className="text-muted-foreground">Async (Kafka)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0 border-t-[1.5px] border-dashed" style={{ borderColor: '#06b6d4' }} />
          <span className="text-muted-foreground">Data (DB / Cache)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0 border-t border-dotted" style={{ borderColor: '#a855f7' }} />
          <span className="text-muted-foreground">Monitor (Metrics)</span>
        </div>
      </div>
    </div>
  )
}

export function ArchitecturePage() {
  return (
    <ReactFlowProvider>
      <ArchitectureInner />
    </ReactFlowProvider>
  )
}
