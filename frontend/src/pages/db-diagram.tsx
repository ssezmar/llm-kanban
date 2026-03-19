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
  Database, Key, Link2, Fingerprint, ChevronDown, ChevronRight,
  Search, Filter, BarChart3, Table2, ArrowRightLeft, Eye, EyeOff,
} from 'lucide-react'

// ── Schema Data ──────────────────────────────────────

interface FieldDef {
  name: string
  type: string
  pk?: boolean
  fk?: string
  unique?: boolean
  nullable?: boolean
  index?: boolean
  note?: string
  default?: string
}

type TableGroup = 'core' | 'actors' | 'config' | 'related' | 'analytics' | 'security' | 'integration' | 'cache'

interface TableDef {
  id: string
  name: string
  group: TableGroup
  color: string
  fields: FieldDef[]
  description?: string
}

const TABLES: TableDef[] = [
  // ── Core ──
  {
    id: 'tasks', name: 'tasks', group: 'core', color: '#3b82f6',
    description: 'Основная сущность — задачи для LLM-агентов',
    fields: [
      { name: 'id', type: 'uuid', pk: true, default: 'gen_random_uuid()' },
      { name: 'title', type: 'varchar(255)' },
      { name: 'description', type: 'text', nullable: true },
      { name: 'prompt', type: 'text' },
      { name: 'prompt_version', type: 'int', default: '1' },
      { name: 'status', type: 'varchar(50)', fk: 'columns', index: true },
      { name: 'priority', type: 'enum', note: 'low | medium | high | critical', index: true },
      { name: 'assigned_agent', type: 'uuid', fk: 'agents', nullable: true, index: true },
      { name: 'created_by', type: 'uuid', fk: 'users', index: true },
      { name: 'epic_id', type: 'uuid', fk: 'epics', nullable: true, index: true },
      { name: 'parent_task_id', type: 'uuid', fk: 'tasks', nullable: true },
      { name: 'estimated_time', type: 'int', nullable: true },
      { name: 'actual_time', type: 'int', nullable: true },
      { name: 'deadline', type: 'timestamptz', nullable: true, index: true },
      { name: 'progress', type: 'smallint', note: '0-100', default: '0' },
      { name: 'token_usage', type: 'int', default: '0' },
      { name: 'cost_cents', type: 'int', default: '0' },
      { name: 'retry_count', type: 'smallint', default: '0' },
      { name: 'color', type: 'varchar(7)' },
      { name: 'is_archived', type: 'boolean', default: 'false', index: true },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', default: 'now()' },
    ],
  },
  {
    id: 'epics', name: 'epics', group: 'core', color: '#3b82f6',
    description: 'Группировка задач по эпикам',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'name', type: 'varchar(255)' },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'varchar(50)' },
      { name: 'color', type: 'varchar(7)' },
      { name: 'status', type: 'enum', note: 'planning | active | completed | archived' },
      { name: 'owner_id', type: 'uuid', fk: 'users' },
      { name: 'budget_cents', type: 'int', nullable: true },
      { name: 'start_date', type: 'timestamptz', nullable: true },
      { name: 'target_date', type: 'timestamptz', nullable: true },
      { name: 'created_at', type: 'timestamptz' },
      { name: 'updated_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'task_dependencies', name: 'task_dependencies', group: 'core', color: '#3b82f6',
    description: 'Зависимости между задачами (DAG)',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'task_id', type: 'uuid', fk: 'tasks', index: true },
      { name: 'depends_on', type: 'uuid', fk: 'tasks', index: true },
      { name: 'type', type: 'enum', note: 'blocks | related | duplicates' },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },

  // ── Actors ──
  {
    id: 'users', name: 'users', group: 'actors', color: '#22c55e',
    description: 'Пользователи системы',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'name', type: 'varchar(255)' },
      { name: 'email', type: 'varchar(255)', unique: true },
      { name: 'password_hash', type: 'varchar(255)' },
      { name: 'role', type: 'enum', note: 'admin | manager | developer | viewer' },
      { name: 'avatar', type: 'varchar(10)' },
      { name: 'bio', type: 'text', nullable: true },
      { name: 'position', type: 'varchar(100)' },
      { name: 'department', type: 'varchar(100)', nullable: true },
      { name: 'timezone', type: 'varchar(50)', default: "'UTC'" },
      { name: 'is_active', type: 'boolean', default: 'true' },
      { name: 'last_login_at', type: 'timestamptz', nullable: true },
      { name: 'joined_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'agents', name: 'agents', group: 'actors', color: '#22c55e',
    description: 'LLM-агенты (Claude, Codex, Gemini)',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'name', type: 'varchar(255)' },
      { name: 'type', type: 'enum', note: 'claude-code | codex | gemini-cli | custom' },
      { name: 'avatar', type: 'varchar(10)' },
      { name: 'status', type: 'enum', note: 'idle | busy | offline | error', index: true },
      { name: 'tasks_completed', type: 'int', default: '0' },
      { name: 'success_rate', type: 'smallint', note: '0-100' },
      { name: 'description', type: 'text' },
      { name: 'avg_execution_time', type: 'int' },
      { name: 'total_tokens_used', type: 'bigint', default: '0' },
      { name: 'total_cost_cents', type: 'int', default: '0' },
      { name: 'config', type: 'jsonb', note: 'model, maxTokens, temp' },
      { name: 'capabilities', type: 'text[]', note: 'code | review | test | docs' },
      { name: 'max_concurrent', type: 'smallint', default: '1' },
      { name: 'endpoint_url', type: 'varchar(500)', nullable: true },
      { name: 'api_key_id', type: 'uuid', fk: 'api_keys', nullable: true },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'teams', name: 'teams', group: 'actors', color: '#22c55e',
    description: 'Команды пользователей',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'name', type: 'varchar(255)' },
      { name: 'slug', type: 'varchar(100)', unique: true },
      { name: 'description', type: 'text', nullable: true },
      { name: 'lead_id', type: 'uuid', fk: 'users' },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'team_members', name: 'team_members', group: 'actors', color: '#22c55e',
    description: 'Участники команд (M2M)',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'team_id', type: 'uuid', fk: 'teams', index: true },
      { name: 'user_id', type: 'uuid', fk: 'users', index: true },
      { name: 'role', type: 'enum', note: 'lead | member | observer' },
      { name: 'joined_at', type: 'timestamptz' },
    ],
  },

  // ── Config ──
  {
    id: 'columns', name: 'columns', group: 'config', color: '#8b5cf6',
    description: 'Колонки канбан-доски',
    fields: [
      { name: 'id', type: 'varchar(50)', pk: true },
      { name: 'title', type: 'varchar(100)' },
      { name: 'icon', type: 'varchar(50)' },
      { name: 'description', type: 'text' },
      { name: 'color', type: 'varchar(7)' },
      { name: 'wip_limit', type: 'smallint', nullable: true },
      { name: 'sort_order', type: 'smallint' },
      { name: 'auto_assign', type: 'boolean', default: 'false' },
      { name: 'sla_hours', type: 'int', nullable: true },
    ],
  },
  {
    id: 'transitions', name: 'transitions', group: 'config', color: '#8b5cf6',
    description: 'Граф разрешённых переходов',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'from_column', type: 'varchar(50)', fk: 'columns' },
      { name: 'to_column', type: 'varchar(50)', fk: 'columns' },
      { name: 'requires_review', type: 'boolean', default: 'false' },
      { name: 'auto_trigger', type: 'boolean', default: 'false' },
    ],
  },
  {
    id: 'automation_rules', name: 'automation_rules', group: 'config', color: '#8b5cf6',
    description: 'Правила автоматизации рабочего процесса',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'name', type: 'varchar(255)' },
      { name: 'trigger_event', type: 'enum', note: 'task_created | status_changed | deadline_near | review_done' },
      { name: 'condition', type: 'jsonb', note: 'filter expression' },
      { name: 'action_type', type: 'enum', note: 'assign_agent | move_column | send_notification | webhook' },
      { name: 'action_config', type: 'jsonb' },
      { name: 'is_active', type: 'boolean', default: 'true' },
      { name: 'created_by', type: 'uuid', fk: 'users' },
      { name: 'run_count', type: 'int', default: '0' },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'prompt_templates', name: 'prompt_templates', group: 'config', color: '#8b5cf6',
    description: 'Шаблоны промптов с версионированием',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'name', type: 'varchar(255)' },
      { name: 'category', type: 'varchar(100)', index: true },
      { name: 'template', type: 'text' },
      { name: 'variables', type: 'jsonb', note: 'template variables schema' },
      { name: 'version', type: 'int', default: '1' },
      { name: 'agent_type', type: 'enum', nullable: true },
      { name: 'created_by', type: 'uuid', fk: 'users' },
      { name: 'usage_count', type: 'int', default: '0' },
      { name: 'avg_score', type: 'numeric(3,1)', nullable: true },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },

  // ── Related data ──
  {
    id: 'task_logs', name: 'task_logs', group: 'related', color: '#f97316',
    description: 'Логи выполнения задач агентами',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'task_id', type: 'uuid', fk: 'tasks', index: true },
      { name: 'agent_id', type: 'uuid', fk: 'agents', nullable: true },
      { name: 'type', type: 'enum', note: 'info | success | error | warning | debug' },
      { name: 'message', type: 'text' },
      { name: 'metadata', type: 'jsonb', nullable: true },
      { name: 'duration_ms', type: 'int', nullable: true },
      { name: 'created_at', type: 'timestamptz', index: true },
    ],
  },
  {
    id: 'subtasks', name: 'subtasks', group: 'related', color: '#f97316',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'task_id', type: 'uuid', fk: 'tasks', index: true },
      { name: 'title', type: 'varchar(255)' },
      { name: 'done', type: 'boolean', default: 'false' },
      { name: 'sort_order', type: 'smallint' },
    ],
  },
  {
    id: 'comments', name: 'comments', group: 'related', color: '#f97316',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'task_id', type: 'uuid', fk: 'tasks', index: true },
      { name: 'author_id', type: 'uuid', fk: 'users' },
      { name: 'parent_id', type: 'uuid', fk: 'comments', nullable: true },
      { name: 'content', type: 'text' },
      { name: 'is_edited', type: 'boolean', default: 'false' },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'reviews', name: 'reviews', group: 'related', color: '#f97316',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'task_id', type: 'uuid', fk: 'tasks' },
      { name: 'reviewer_id', type: 'uuid', fk: 'users' },
      { name: 'score', type: 'smallint', note: '1-10' },
      { name: 'comment', type: 'text', nullable: true },
      { name: 'quality_tags', type: 'text[]', note: 'correct | efficient | clean | documented' },
      { name: 'auto_review_score', type: 'numeric(3,1)', nullable: true, note: 'AI-assisted score' },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'tags', name: 'tags', group: 'related', color: '#f97316',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'task_id', type: 'uuid', fk: 'tasks', index: true },
      { name: 'name', type: 'varchar(100)', index: true },
    ],
  },
  {
    id: 'attachments', name: 'attachments', group: 'related', color: '#f97316',
    description: 'Файлы-вложения к задачам',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'task_id', type: 'uuid', fk: 'tasks', index: true },
      { name: 'uploaded_by', type: 'uuid', fk: 'users' },
      { name: 'filename', type: 'varchar(255)' },
      { name: 'mime_type', type: 'varchar(100)' },
      { name: 'size_bytes', type: 'int' },
      { name: 'storage_key', type: 'varchar(500)' },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },

  // ── Analytics ──
  {
    id: 'agent_metrics', name: 'agent_metrics', group: 'analytics', color: '#06b6d4',
    description: 'Метрики производительности агентов (TimescaleDB)',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'agent_id', type: 'uuid', fk: 'agents', index: true },
      { name: 'period_start', type: 'timestamptz', index: true },
      { name: 'period_type', type: 'enum', note: 'hourly | daily | weekly' },
      { name: 'tasks_completed', type: 'int' },
      { name: 'tasks_failed', type: 'int' },
      { name: 'avg_score', type: 'numeric(3,1)' },
      { name: 'total_tokens', type: 'bigint' },
      { name: 'total_cost_cents', type: 'int' },
      { name: 'avg_duration_ms', type: 'int' },
      { name: 'p95_duration_ms', type: 'int' },
      { name: 'error_rate', type: 'numeric(5,2)' },
    ],
  },
  {
    id: 'task_events', name: 'task_events', group: 'analytics', color: '#06b6d4',
    description: 'Event sourcing — все изменения задач',
    fields: [
      { name: 'id', type: 'bigserial', pk: true },
      { name: 'task_id', type: 'uuid', fk: 'tasks', index: true },
      { name: 'event_type', type: 'enum', note: 'created | updated | moved | assigned | reviewed | archived' },
      { name: 'actor_type', type: 'enum', note: 'user | agent | system' },
      { name: 'actor_id', type: 'uuid', nullable: true },
      { name: 'old_value', type: 'jsonb', nullable: true },
      { name: 'new_value', type: 'jsonb', nullable: true },
      { name: 'ip_address', type: 'inet', nullable: true },
      { name: 'created_at', type: 'timestamptz', index: true },
    ],
  },
  {
    id: 'cost_ledger', name: 'cost_ledger', group: 'analytics', color: '#06b6d4',
    description: 'Бухгалтерия расходов на API',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'task_id', type: 'uuid', fk: 'tasks', nullable: true },
      { name: 'agent_id', type: 'uuid', fk: 'agents' },
      { name: 'epic_id', type: 'uuid', fk: 'epics', nullable: true },
      { name: 'model', type: 'varchar(100)' },
      { name: 'input_tokens', type: 'int' },
      { name: 'output_tokens', type: 'int' },
      { name: 'cost_cents', type: 'int' },
      { name: 'created_at', type: 'timestamptz', index: true },
    ],
  },
  {
    id: 'dashboard_snapshots', name: 'dashboard_snapshots', group: 'analytics', color: '#06b6d4',
    description: 'Снимки дашборда для исторических графиков',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'snapshot_date', type: 'date', index: true },
      { name: 'total_tasks', type: 'int' },
      { name: 'completed_tasks', type: 'int' },
      { name: 'avg_lead_time_h', type: 'numeric(6,1)' },
      { name: 'avg_cycle_time_h', type: 'numeric(6,1)' },
      { name: 'throughput', type: 'int' },
      { name: 'wip_count', type: 'int' },
      { name: 'cumulative_cost', type: 'int' },
      { name: 'column_distribution', type: 'jsonb' },
    ],
  },

  // ── Security ──
  {
    id: 'api_keys', name: 'api_keys', group: 'security', color: '#ef4444',
    description: 'Ключи API для агентов и интеграций',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'name', type: 'varchar(255)' },
      { name: 'key_hash', type: 'varchar(255)' },
      { name: 'key_prefix', type: 'varchar(8)' },
      { name: 'created_by', type: 'uuid', fk: 'users' },
      { name: 'scopes', type: 'text[]', note: 'read | write | admin | execute' },
      { name: 'rate_limit', type: 'int', default: '1000' },
      { name: 'expires_at', type: 'timestamptz', nullable: true },
      { name: 'last_used_at', type: 'timestamptz', nullable: true },
      { name: 'is_revoked', type: 'boolean', default: 'false' },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'sessions', name: 'sessions', group: 'security', color: '#ef4444',
    description: 'Пользовательские сессии',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'user_id', type: 'uuid', fk: 'users', index: true },
      { name: 'token_hash', type: 'varchar(255)' },
      { name: 'ip_address', type: 'inet' },
      { name: 'user_agent', type: 'text' },
      { name: 'expires_at', type: 'timestamptz', index: true },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'audit_log', name: 'audit_log', group: 'security', color: '#ef4444',
    description: 'Аудит-лог действий (append-only)',
    fields: [
      { name: 'id', type: 'bigserial', pk: true },
      { name: 'user_id', type: 'uuid', fk: 'users', nullable: true, index: true },
      { name: 'action', type: 'varchar(100)', index: true },
      { name: 'resource_type', type: 'varchar(50)' },
      { name: 'resource_id', type: 'uuid', nullable: true },
      { name: 'changes', type: 'jsonb', nullable: true },
      { name: 'ip_address', type: 'inet' },
      { name: 'user_agent', type: 'text' },
      { name: 'created_at', type: 'timestamptz', index: true },
    ],
  },

  // ── Integration ──
  {
    id: 'webhooks', name: 'webhooks', group: 'integration', color: '#ec4899',
    description: 'Вебхуки для внешних интеграций',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'name', type: 'varchar(255)' },
      { name: 'url', type: 'varchar(500)' },
      { name: 'secret', type: 'varchar(255)' },
      { name: 'events', type: 'text[]', note: 'task.created | task.completed | ...' },
      { name: 'is_active', type: 'boolean', default: 'true' },
      { name: 'created_by', type: 'uuid', fk: 'users' },
      { name: 'failure_count', type: 'int', default: '0' },
      { name: 'last_triggered_at', type: 'timestamptz', nullable: true },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'webhook_deliveries', name: 'webhook_deliveries', group: 'integration', color: '#ec4899',
    description: 'Лог доставки вебхуков',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'webhook_id', type: 'uuid', fk: 'webhooks', index: true },
      { name: 'event_type', type: 'varchar(100)' },
      { name: 'payload', type: 'jsonb' },
      { name: 'response_status', type: 'smallint', nullable: true },
      { name: 'response_body', type: 'text', nullable: true },
      { name: 'duration_ms', type: 'int' },
      { name: 'attempt', type: 'smallint', default: '1' },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'notifications', name: 'notifications', group: 'integration', color: '#ec4899',
    description: 'Уведомления пользователей',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'user_id', type: 'uuid', fk: 'users', index: true },
      { name: 'type', type: 'enum', note: 'task_assigned | review_done | mention | deadline | system' },
      { name: 'title', type: 'varchar(255)' },
      { name: 'body', type: 'text' },
      { name: 'link', type: 'varchar(500)', nullable: true },
      { name: 'is_read', type: 'boolean', default: 'false', index: true },
      { name: 'task_id', type: 'uuid', fk: 'tasks', nullable: true },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },

  // ── Cache / Queue ──
  {
    id: 'kafka_outbox', name: 'kafka_outbox', group: 'cache', color: '#eab308',
    description: 'Transactional outbox для Kafka (CDC)',
    fields: [
      { name: 'id', type: 'bigserial', pk: true },
      { name: 'topic', type: 'varchar(255)', index: true },
      { name: 'key', type: 'varchar(255)' },
      { name: 'payload', type: 'jsonb' },
      { name: 'headers', type: 'jsonb', nullable: true },
      { name: 'is_published', type: 'boolean', default: 'false', index: true },
      { name: 'retry_count', type: 'smallint', default: '0' },
      { name: 'created_at', type: 'timestamptz', index: true },
    ],
  },
  {
    id: 'job_queue', name: 'job_queue', group: 'cache', color: '#eab308',
    description: 'Очередь фоновых задач (worker pool)',
    fields: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'queue', type: 'varchar(100)', index: true },
      { name: 'job_type', type: 'varchar(100)', note: 'execute_agent | send_email | generate_report | cleanup' },
      { name: 'payload', type: 'jsonb' },
      { name: 'status', type: 'enum', note: 'pending | running | completed | failed | dead', index: true },
      { name: 'priority', type: 'smallint', default: '0' },
      { name: 'max_retries', type: 'smallint', default: '3' },
      { name: 'attempt', type: 'smallint', default: '0' },
      { name: 'locked_by', type: 'varchar(100)', nullable: true },
      { name: 'locked_at', type: 'timestamptz', nullable: true },
      { name: 'scheduled_at', type: 'timestamptz', index: true },
      { name: 'completed_at', type: 'timestamptz', nullable: true },
      { name: 'error', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'cache_entries', name: 'cache_entries', group: 'cache', color: '#eab308',
    description: 'Кэш-таблица (fallback при недоступности Redis)',
    fields: [
      { name: 'key', type: 'varchar(500)', pk: true },
      { name: 'value', type: 'jsonb' },
      { name: 'ttl_seconds', type: 'int' },
      { name: 'created_at', type: 'timestamptz' },
      { name: 'expires_at', type: 'timestamptz', index: true },
    ],
  },
]

const RELATIONS: RelationDef[] = [
  // Core
  { from: 'tasks', fromField: 'status', to: 'columns', type: 'one-to-many', label: 'status' },
  { from: 'tasks', fromField: 'assigned_agent', to: 'agents', type: 'one-to-many', label: 'agent' },
  { from: 'tasks', fromField: 'created_by', to: 'users', type: 'one-to-many', label: 'creator' },
  { from: 'tasks', fromField: 'epic_id', to: 'epics', type: 'one-to-many', label: 'epic' },
  { from: 'tasks', fromField: 'parent_task_id', to: 'tasks', type: 'one-to-many', label: 'parent' },
  { from: 'task_dependencies', fromField: 'task_id', to: 'tasks', type: 'one-to-many', label: 'task' },
  { from: 'task_dependencies', fromField: 'depends_on', to: 'tasks', type: 'one-to-many', label: 'depends_on' },
  { from: 'epics', fromField: 'owner_id', to: 'users', type: 'one-to-many', label: 'owner' },
  // Related
  { from: 'task_logs', fromField: 'task_id', to: 'tasks', type: 'one-to-many', label: 'task' },
  { from: 'task_logs', fromField: 'agent_id', to: 'agents', type: 'one-to-many', label: 'agent' },
  { from: 'subtasks', fromField: 'task_id', to: 'tasks', type: 'one-to-many', label: 'task' },
  { from: 'comments', fromField: 'task_id', to: 'tasks', type: 'one-to-many', label: 'task' },
  { from: 'comments', fromField: 'author_id', to: 'users', type: 'one-to-many', label: 'author' },
  { from: 'comments', fromField: 'parent_id', to: 'comments', type: 'one-to-many', label: 'reply_to' },
  { from: 'reviews', fromField: 'task_id', to: 'tasks', type: 'one-to-one', label: 'task' },
  { from: 'reviews', fromField: 'reviewer_id', to: 'users', type: 'one-to-many', label: 'reviewer' },
  { from: 'tags', fromField: 'task_id', to: 'tasks', type: 'one-to-many', label: 'task' },
  { from: 'attachments', fromField: 'task_id', to: 'tasks', type: 'one-to-many', label: 'task' },
  { from: 'attachments', fromField: 'uploaded_by', to: 'users', type: 'one-to-many', label: 'uploader' },
  // Config
  { from: 'transitions', fromField: 'from_column', to: 'columns', type: 'one-to-many', label: 'from' },
  { from: 'transitions', fromField: 'to_column', to: 'columns', type: 'one-to-many', label: 'to' },
  { from: 'automation_rules', fromField: 'created_by', to: 'users', type: 'one-to-many', label: 'creator' },
  { from: 'prompt_templates', fromField: 'created_by', to: 'users', type: 'one-to-many', label: 'creator' },
  // Analytics
  { from: 'agent_metrics', fromField: 'agent_id', to: 'agents', type: 'one-to-many', label: 'agent' },
  { from: 'task_events', fromField: 'task_id', to: 'tasks', type: 'one-to-many', label: 'task' },
  { from: 'cost_ledger', fromField: 'task_id', to: 'tasks', type: 'one-to-many', label: 'task' },
  { from: 'cost_ledger', fromField: 'agent_id', to: 'agents', type: 'one-to-many', label: 'agent' },
  { from: 'cost_ledger', fromField: 'epic_id', to: 'epics', type: 'one-to-many', label: 'epic' },
  // Security
  { from: 'agents', fromField: 'api_key_id', to: 'api_keys', type: 'one-to-many', label: 'api_key' },
  { from: 'api_keys', fromField: 'created_by', to: 'users', type: 'one-to-many', label: 'creator' },
  { from: 'sessions', fromField: 'user_id', to: 'users', type: 'one-to-many', label: 'user' },
  { from: 'audit_log', fromField: 'user_id', to: 'users', type: 'one-to-many', label: 'actor' },
  // Integration
  { from: 'webhooks', fromField: 'created_by', to: 'users', type: 'one-to-many', label: 'creator' },
  { from: 'webhook_deliveries', fromField: 'webhook_id', to: 'webhooks', type: 'one-to-many', label: 'webhook' },
  { from: 'notifications', fromField: 'user_id', to: 'users', type: 'one-to-many', label: 'user' },
  { from: 'notifications', fromField: 'task_id', to: 'tasks', type: 'one-to-many', label: 'task' },
]

interface RelationDef {
  from: string
  fromField: string
  to: string
  type: 'one-to-many' | 'one-to-one'
  label: string
}

// ── Table Node Component ─────────────────────────────

const TABLE_W = 290

interface TableNodeData {
  table: TableDef
  highlighted: boolean
  dimmed: boolean
  [key: string]: unknown
}

function TableNode({ data }: { data: TableNodeData }) {
  const { table, highlighted, dimmed } = data
  const [collapsed, setCollapsed] = useState(false)

  const visibleFields = collapsed ? table.fields.filter(f => f.pk || f.fk) : table.fields

  return (
    <div
      className={cn(
        'rounded-xl border-2 overflow-hidden transition-all duration-200',
        highlighted ? 'shadow-2xl scale-[1.02]' : 'shadow-lg',
        dimmed && 'opacity-15',
      )}
      style={{
        borderColor: highlighted ? table.color : 'hsl(var(--border))',
        width: TABLE_W,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !w-full !h-2 !min-h-0 !border-0 !rounded-none !top-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !w-full !h-2 !min-h-0 !border-0 !rounded-none !bottom-0" />
      <Handle type="target" position={Position.Left} className="!bg-transparent !h-full !w-2 !min-w-0 !border-0 !rounded-none !left-0" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !h-full !w-2 !min-w-0 !border-0 !rounded-none !right-0" />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing"
        style={{ background: `${table.color}18` }}
      >
        <div
          className="h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `${table.color}25` }}
        >
          <Database className="h-3 w-3" style={{ color: table.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-xs block font-mono">{table.name}</span>
          {table.description && (
            <span className="text-[9px] text-muted-foreground block truncate">{table.description}</span>
          )}
        </div>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ background: `${table.color}20`, color: table.color }}
        >
          {table.fields.length}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed) }}
          className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
        >
          {collapsed
            ? <ChevronRight className="h-3 w-3 text-muted-foreground" />
            : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </button>
      </div>

      {/* Fields */}
      <div className="bg-card">
        {visibleFields.map((field, i) => (
          <div
            key={field.name}
            className={cn(
              'flex items-center gap-1.5 px-2.5 h-6 text-[11px] font-mono border-t border-border/40',
              'hover:bg-muted/50 transition-colors',
              i === 0 && 'border-t-0',
            )}
          >
            <span className="w-3.5 flex-shrink-0 flex justify-center">
              {field.pk && <Key className="h-2.5 w-2.5 text-yellow-500" />}
              {field.fk && !field.pk && <Link2 className="h-2.5 w-2.5 text-blue-400" />}
              {field.unique && !field.pk && !field.fk && <Fingerprint className="h-2.5 w-2.5 text-purple-400" />}
              {field.index && !field.pk && !field.fk && !field.unique && (
                <span className="text-[7px] text-cyan-400 font-bold">IX</span>
              )}
            </span>

            <span className={cn(
              'flex-1 truncate',
              field.pk && 'text-yellow-500 font-semibold',
              field.fk && !field.pk && 'text-blue-400',
              field.nullable && !field.pk && !field.fk && 'text-muted-foreground',
            )}>
              {field.name}
              {field.nullable && <span className="text-muted-foreground/50">?</span>}
            </span>

            <span className="text-muted-foreground text-[9px] flex-shrink-0">{field.type}</span>

            {field.fk && (
              <span className="text-[8px] px-1 rounded bg-blue-500/10 text-blue-400 flex-shrink-0">
                →{field.fk}
              </span>
            )}
          </div>
        ))}

        {collapsed && table.fields.length > visibleFields.length && (
          <div className="flex items-center justify-center h-5 text-[9px] text-muted-foreground border-t border-border/40">
            +{table.fields.length - visibleFields.length} скрыто
          </div>
        )}
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  dbTable: TableNode as any,
}

// ── Positions ────────────────────────────────────────

function getInitialPositions(): Record<string, { x: number; y: number }> {
  return {
    // Core (center-left)
    tasks:              { x: 600,  y: 400 },
    epics:              { x: 120,  y: 850 },
    task_dependencies:  { x: 600,  y: 900 },
    // Actors (left)
    users:              { x: 30,   y: 80 },
    agents:             { x: 30,   y: 480 },
    teams:              { x: -320, y: 80 },
    team_members:       { x: -320, y: 360 },
    // Config (top-right)
    columns:            { x: 1080, y: 0 },
    transitions:        { x: 1420, y: 0 },
    automation_rules:   { x: 1080, y: 250 },
    prompt_templates:   { x: 1420, y: 250 },
    // Related (right)
    task_logs:          { x: 1080, y: 520 },
    subtasks:           { x: 1420, y: 520 },
    comments:           { x: 1080, y: 750 },
    reviews:            { x: 1420, y: 750 },
    tags:               { x: 1080, y: 960 },
    attachments:        { x: 1420, y: 960 },
    // Analytics (bottom)
    agent_metrics:      { x: -320, y: 700 },
    task_events:        { x: 600,  y: 1150 },
    cost_ledger:        { x: -320, y: 1000 },
    dashboard_snapshots:{ x: 120,  y: 1150 },
    // Security (far left)
    api_keys:           { x: -660, y: 480 },
    sessions:           { x: -660, y: 80 },
    audit_log:          { x: -660, y: 260 },
    // Integration (bottom-right)
    webhooks:           { x: 1750, y: 520 },
    webhook_deliveries: { x: 1750, y: 780 },
    notifications:      { x: 1750, y: 250 },
    // Cache (bottom-center)
    kafka_outbox:       { x: 240,  y: 1400 },
    job_queue:          { x: 600,  y: 1400 },
    cache_entries:      { x: 960,  y: 1400 },
  }
}

// ── Group Colors ─────────────────────────────────────

const GROUP_META: Record<TableGroup, { bg: string; label: string }> = {
  core:        { bg: '#3b82f6', label: 'Core' },
  actors:      { bg: '#22c55e', label: 'Actors' },
  config:      { bg: '#8b5cf6', label: 'Config' },
  related:     { bg: '#f97316', label: 'Related' },
  analytics:   { bg: '#06b6d4', label: 'Analytics' },
  security:    { bg: '#ef4444', label: 'Security' },
  integration: { bg: '#ec4899', label: 'Integration' },
  cache:       { bg: '#eab308', label: 'Cache / Queue' },
}

// ── Main Component ───────────────────────────────────

function DbDiagramInner() {
  const [hoveredTable, setHoveredTable] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeGroups, setActiveGroups] = useState<Set<TableGroup>>(new Set(Object.keys(GROUP_META) as TableGroup[]))
  const [showRelations, setShowRelations] = useState(true)

  const filteredTableIds = useMemo(() => {
    return new Set(
      TABLES
        .filter(t => activeGroups.has(t.group))
        .filter(t => !search || t.name.includes(search.toLowerCase()) || t.fields.some(f => f.name.includes(search.toLowerCase())))
        .map(t => t.id)
    )
  }, [search, activeGroups])

  const connectedTables = useMemo(() => {
    if (!hoveredTable) return new Set<string>()
    const set = new Set<string>()
    set.add(hoveredTable)
    RELATIONS.forEach(r => {
      if (r.from === hoveredTable) set.add(r.to)
      if (r.to === hoveredTable) set.add(r.from)
    })
    return set
  }, [hoveredTable])

  const initialNodes: Node[] = useMemo(() => {
    const positions = getInitialPositions()
    return TABLES
      .filter(t => filteredTableIds.has(t.id))
      .map(table => ({
        id: table.id,
        type: 'dbTable',
        position: positions[table.id] || { x: 0, y: 0 },
        data: {
          table,
          highlighted: hoveredTable === table.id,
          dimmed: hoveredTable !== null && !connectedTables.has(table.id),
        } satisfies TableNodeData,
      }))
  }, [hoveredTable, connectedTables, filteredTableIds])

  const initialEdges: Edge[] = useMemo(() => {
    if (!showRelations) return []
    return RELATIONS
      .filter(r => filteredTableIds.has(r.from) && filteredTableIds.has(r.to))
      .map((rel, i) => {
        const isHighlighted = hoveredTable && (rel.from === hoveredTable || rel.to === hoveredTable)
        const isDimmed = hoveredTable && !isHighlighted
        const sourceTable = TABLES.find(t => t.id === rel.from)

        return {
          id: `rel-${i}`,
          source: rel.from,
          target: rel.to,
          type: 'smoothstep',
          animated: !!isHighlighted,
          label: rel.label,
          labelStyle: {
            fontSize: 9,
            fontFamily: 'ui-monospace, monospace',
            fill: isHighlighted ? '#fafafa' : '#52525b',
            fontWeight: isHighlighted ? 600 : 400,
          },
          labelBgStyle: {
            fill: isHighlighted ? (sourceTable?.color || '#3b82f6') : 'hsl(var(--background))',
            fillOpacity: isHighlighted ? 0.9 : 0.8,
            rx: 4, ry: 4,
          },
          labelBgPadding: [3, 5] as [number, number],
          style: {
            stroke: isHighlighted
              ? (sourceTable?.color || '#3b82f6')
              : isDimmed ? '#1e1e22' : '#3f3f46',
            strokeWidth: isHighlighted ? 2.5 : 1,
            strokeDasharray: rel.type === 'one-to-one' ? '6 4' : undefined,
            opacity: isDimmed ? 0.1 : 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 12, height: 12,
            color: isHighlighted
              ? (sourceTable?.color || '#3b82f6')
              : isDimmed ? '#1e1e22' : '#3f3f46',
          },
        }
      })
  }, [hoveredTable, filteredTableIds, showRelations])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useMemo(() => {
    setNodes(prev => {
      const posMap = new Map(prev.map(n => [n.id, n.position]))
      return initialNodes.map(n => ({
        ...n,
        position: posMap.get(n.id) || n.position,
      }))
    })
  }, [initialNodes])

  useMemo(() => { setEdges(initialEdges) }, [initialEdges])

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => setHoveredTable(node.id), [])
  const onNodeMouseLeave = useCallback(() => setHoveredTable(null), [])

  const toggleGroup = (g: TableGroup) => {
    setActiveGroups(prev => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g); else next.add(g)
      return next
    })
  }

  // Stats
  const totalFields = TABLES.filter(t => filteredTableIds.has(t.id)).reduce((s, t) => s + t.fields.length, 0)
  const totalFKs = TABLES.filter(t => filteredTableIds.has(t.id)).flatMap(t => t.fields).filter(f => f.fk).length
  const totalIndexes = TABLES.filter(t => filteredTableIds.has(t.id)).flatMap(t => t.fields).filter(f => f.pk || f.index || f.unique).length

  return (
    <div className="h-[calc(100vh-7.5rem)]" data-tour="db-diagram-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-muted-foreground" />
            Схема базы данных
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Интерактивная ER-диаграмма · перетаскивайте таблицы · наведите для подсветки связей
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card border">
              <Table2 className="h-3 w-3 text-muted-foreground" />
              <span className="font-bold">{filteredTableIds.size}</span>
              <span className="text-muted-foreground">таблиц</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card border">
              <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
              <span className="font-bold">{RELATIONS.filter(r => filteredTableIds.has(r.from) && filteredTableIds.has(r.to)).length}</span>
              <span className="text-muted-foreground">связей</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card border">
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span className="font-bold">{totalFields}</span>
              <span className="text-muted-foreground">полей</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск таблиц и полей..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 pl-8 pr-3 text-xs rounded-lg border bg-card focus:outline-none focus:ring-1 focus:ring-ring w-56"
          />
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Group filters */}
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          {(Object.entries(GROUP_META) as [TableGroup, { bg: string; label: string }][]).map(([key, { bg, label }]) => {
            const active = activeGroups.has(key)
            const count = TABLES.filter(t => t.group === key).length
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
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Toggle relations */}
        <button
          onClick={() => setShowRelations(!showRelations)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-all',
            showRelations ? 'border-border bg-card' : 'border-transparent opacity-50',
          )}
        >
          {showRelations ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Связи
        </button>
      </div>

      {/* Diagram */}
      <div className="rounded-xl border bg-card overflow-hidden h-[calc(100%-6.5rem)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          nodesDraggable
          panOnDrag
          zoomOnScroll
          minZoom={0.1}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background gap={24} size={1} className="!bg-background" />
          <Controls
            showInteractive={false}
            className="!bg-card !border-border !shadow-sm [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted"
          />
          <MiniMap
            nodeColor={(node) => {
              const table = TABLES.find(t => t.id === node.id)
              return table?.color || '#3f3f46'
            }}
            maskColor="hsl(var(--background) / 0.85)"
            className="!bg-card !border-border"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
    </div>
  )
}

export function DbDiagramPage() {
  return (
    <ReactFlowProvider>
      <DbDiagramInner />
    </ReactFlowProvider>
  )
}
