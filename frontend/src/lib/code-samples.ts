// Realistic code snippets used by the live "code generation" editor.
// Each sample maps loosely to the kind of work an LLM agent produces.

export type CodeLang = 'typescript' | 'tsx' | 'go' | 'python' | 'sql'

export interface CodeSample {
  id: string
  fileName: string
  language: CodeLang
  code: string
}

export const codeSamples: CodeSample[] = [
  {
    id: 'auth-refresh',
    fileName: 'auth/refresh.ts',
    language: 'typescript',
    code: `import { randomUUID } from 'crypto'
import { redis } from '../infra/redis'
import { signAccessToken, signRefreshToken } from './jwt'

// Ротация refresh-токенов с revoke-list в Redis
export async function rotateRefreshToken(oldToken: string) {
  const payload = await verifyRefresh(oldToken)
  if (await isRevoked(payload.jti)) {
    throw new AuthError('refresh token reused', 401)
  }

  // помечаем старый токен как отозванный
  await redis.set(\`revoked:\${payload.jti}\`, '1', 'EX', REFRESH_TTL)

  const jti = randomUUID()
  const accessToken = signAccessToken(payload.sub)
  const refreshToken = signRefreshToken(payload.sub, jti)

  return { accessToken, refreshToken, jti }
}

async function isRevoked(jti: string): Promise<boolean> {
  return (await redis.exists(\`revoked:\${jti}\`)) === 1
}`,
  },
  {
    id: 'rate-limiter',
    fileName: 'gateway/ratelimit.go',
    language: 'go',
    code: `package gateway

import (
	"context"
	"net/http"
	"time"
)

// RateLimiter — sliding window на Redis по API-ключу.
type RateLimiter struct {
	rdb    Redis
	limit  int
	window time.Duration
}

func (rl *RateLimiter) Allow(ctx context.Context, key string) (bool, error) {
	now := time.Now().UnixMilli()
	from := now - rl.window.Milliseconds()

	pipe := rl.rdb.Pipeline()
	pipe.ZRemRangeByScore(ctx, key, "0", itoa(from))
	count := pipe.ZCard(ctx, key)
	pipe.ZAdd(ctx, key, now)
	pipe.Expire(ctx, key, rl.window)
	if _, err := pipe.Exec(ctx); err != nil {
		return false, err
	}
	return count.Val() < int64(rl.limit), nil
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ok, err := rl.Allow(r.Context(), apiKey(r))
		if err != nil || !ok {
			http.Error(w, "too many requests", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}`,
  },
  {
    id: 'throughput-chart',
    fileName: 'components/throughput-chart.tsx',
    language: 'tsx',
    code: `import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAgentMetrics } from '../hooks/use-agent-metrics'

// График задач/день по каждому агенту за 30 дней
export function ThroughputChart({ agentId }: { agentId: string }) {
  const { data, isLoading } = useAgentMetrics(agentId, 30)

  if (isLoading) return <ChartSkeleton />

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12 }}>
        <XAxis dataKey="day" tickLine={false} fontSize={11} />
        <YAxis allowDecimals={false} width={28} fontSize={11} />
        <Tooltip cursor={{ opacity: 0.1 }} />
        <Line
          type="monotone"
          dataKey="completed"
          strokeWidth={2}
          dot={false}
          isAnimationActive
        />
      </LineChart>
    </ResponsiveContainer>
  )
}`,
  },
  {
    id: 'dataloader',
    fileName: 'board/dataloader.ts',
    language: 'typescript',
    code: `import DataLoader from 'dataloader'
import { db } from '../infra/db'

// Батчинг выборки агентов — лечит N+1 на доске
export const agentLoader = new DataLoader<string, Agent>(async (ids) => {
  const rows = await db
    .selectFrom('agents')
    .selectAll()
    .where('id', 'in', ids as string[])
    .execute()

  const byId = new Map(rows.map((r) => [r.id, r]))
  return ids.map((id) => byId.get(id) ?? notFound(id))
})

export async function loadBoard(columns: string[]) {
  const tasks = await fetchTasks(columns)
  // один батч вместо запроса на каждую задачу
  await Promise.all(tasks.map((t) => agentLoader.load(t.agentId)))
  return tasks
}`,
  },
  {
    id: 'email-worker',
    fileName: 'notify/worker.py',
    language: 'python',
    code: `import asyncio
from dataclasses import dataclass
from .smtp import SmtpClient
from .templates import render

@dataclass
class Notification:
    to: str
    template: str
    context: dict

# Воркер рассылки email-уведомлений из очереди
class EmailWorker:
    def __init__(self, queue, smtp: SmtpClient):
        self.queue = queue
        self.smtp = smtp

    async def run(self) -> None:
        while True:
            msg: Notification = await self.queue.get()
            try:
                body = render(msg.template, msg.context)
                await self.smtp.send(msg.to, subject=body.subject, html=body.html)
            except Exception as exc:
                await self.retry(msg, exc)
            finally:
                self.queue.task_done()`,
  },
  {
    id: 'totp',
    fileName: 'auth/totp.go',
    language: 'go',
    code: `package auth

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/binary"
	"time"
)

// GenerateTOTP — код двухфакторной аутентификации (RFC 6238)
func GenerateTOTP(secret []byte, t time.Time) string {
	counter := uint64(t.Unix()) / 30
	buf := make([]byte, 8)
	binary.BigEndian.PutUint64(buf, counter)

	mac := hmac.New(sha1.New, secret)
	mac.Write(buf)
	sum := mac.Sum(nil)

	offset := sum[len(sum)-1] & 0x0f
	code := (int(sum[offset]&0x7f) << 24) |
		(int(sum[offset+1]) << 16) |
		(int(sum[offset+2]) << 8) |
		int(sum[offset+3])

	return pad(code%1_000_000, 6)
}`,
  },
  {
    id: 'openapi',
    fileName: 'docs/openapi.ts',
    language: 'typescript',
    code: `import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { TaskSchema, AgentSchema } from '../schemas'

// Автогенерация OpenAPI 3.1 из zod-схем
const registry = new OpenAPIRegistry()

registry.registerPath({
  method: 'get',
  path: '/api/tasks/{id}',
  summary: 'Получить задачу по id',
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: TaskSchema } } },
    404: { description: 'Not found' },
  },
})

registry.register('Agent', AgentSchema)

export const openapi = registry.generateDocument({
  openapi: '3.1.0',
  info: { title: 'LLM Kanban API', version: '1.0.0' },
})`,
  },
  {
    id: 'migration',
    fileName: 'db/0042_refresh_tokens.sql',
    language: 'sql',
    code: `-- Хранилище refresh-токенов с поддержкой ротации
CREATE TABLE refresh_tokens (
    jti         UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id),
    issued_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_refresh_user ON refresh_tokens(user_id)
    WHERE revoked = false;

-- авто-очистка истёкших токенов
DELETE FROM refresh_tokens WHERE expires_at < now();`,
  },
]

// Стабильный выбор сэмпла для задачи (по её id).
export function sampleForTask(taskId: string): CodeSample {
  let hash = 0
  for (let i = 0; i < taskId.length; i++) hash = (hash * 31 + taskId.charCodeAt(i)) | 0
  return codeSamples[Math.abs(hash) % codeSamples.length]
}
