// Beautiful in-memory GitHub mock dataset + a path-based resolver.
// When the github store is connected with the token "mock", every call in
// github-api.ts is routed here instead of hitting api.github.com — so all
// pages, stores and the "demo" connection work with zero network and no token.

import type {
  GitHubUser, GitHubRepo, GitHubLabel, GitHubIssue, GitHubComment,
  GitHubPullRequest, GitHubReview, GitHubCheckRun, GitHubPullFile,
  GitHubWorkflow, GitHubWorkflowRun, GitHubWorkflowJob,
} from './github-types'
import { codeSamples } from './code-samples'

export const MOCK_TOKEN = 'mock'
export const MOCK_OWNER = 'llm-kanban'
export const MOCK_REPO = 'orchestrator'
export const isMockToken = (token: string | null | undefined) => token === MOCK_TOKEN

const HOUR = 3600_000
const DAY = 86_400_000
const now = Date.now()
const iso = (ms: number) => new Date(ms).toISOString()
const repoUrl = `https://github.com/${MOCK_OWNER}/${MOCK_REPO}`

// ── People ───────────────────────────────────────────────────────────────

let uid = 1000
function ghUser(login: string, name: string, bot = false): GitHubUser {
  const id = uid++
  const style = bot ? 'bottts' : 'avataaars'
  return {
    id,
    login,
    name,
    bio: bot ? 'Автоматизированный LLM-агент оркестратора' : null,
    avatar_url: `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(login)}`,
    html_url: `https://github.com/${login}`,
  }
}

// Agents (commit & author code) — logins match mockAgents[].githubLogin
const claude = ghUser('claude-code-agent', 'Claude Code', true)
const codex = ghUser('codex-cli-agent', 'Codex CLI', true)
const gemini = ghUser('gemini-cli-agent', 'Gemini CLI', true)
const custom = ghUser('custom-agent', 'Custom Agent', true)

// Humans (review & triage)
const admin = ghUser('admin', 'Администратор')
const akozlov = ghUser('akozlov', 'Александр Козлов')
const msidorova = ghUser('msidorova', 'Мария Сидорова')
const dvolkov = ghUser('dvolkov', 'Дмитрий Волков')
const enovikova = ghUser('enovikova', 'Елена Новикова')

const humans = [admin, akozlov, msidorova, dvolkov, enovikova]

export const mockGitHubUser: GitHubUser = admin

export const mockGitHubRepo: GitHubRepo = {
  id: 9001,
  name: MOCK_REPO,
  full_name: `${MOCK_OWNER}/${MOCK_REPO}`,
  html_url: repoUrl,
  description: 'Оркестратор LLM-агентов: канбан, пайплайны и GitHub-интеграция (демо-данные)',
  private: false,
  default_branch: 'main',
  open_issues_count: 9,
  stargazers_count: 248,
  forks_count: 37,
  language: 'TypeScript',
  updated_at: iso(now - HOUR * 2),
}

// ── Labels ───────────────────────────────────────────────────────────────

let lid = 2000
const mkLabel = (name: string, color: string, description: string | null = null): GitHubLabel =>
  ({ id: lid++, name, color, description })

const L = {
  bug: mkLabel('bug', 'd73a4a', 'Что-то работает не так'),
  enhancement: mkLabel('enhancement', 'a2eeef', 'Новая фича или улучшение'),
  docs: mkLabel('documentation', '0075ca', 'Документация'),
  goodFirst: mkLabel('good first issue', '7057ff', 'Хорошо для начала'),
  backend: mkLabel('backend', '1d76db'),
  frontend: mkLabel('frontend', '5319e7'),
  cicd: mkLabel('ci/cd', 'fbca04'),
  security: mkLabel('security', 'b60205'),
  perf: mkLabel('performance', '0e8a16'),
  agent: mkLabel('ai-agent', '8b5cf6', 'Выполнено LLM-агентом'),
}

export const mockLabels: GitHubLabel[] = Object.values(L)

// ── Issues (numbers 1..11, linked from mockTasks) ─────────────────────────

interface IssueSeed {
  number: number
  title: string
  body: string
  state: 'open' | 'closed'
  author: GitHubUser
  assignee: GitHubUser
  labels: GitHubLabel[]
  ageDays: number
  comments: number
}

const issueSeeds: IssueSeed[] = [
  { number: 1, title: 'Добавить ротацию refresh-токенов в JWT-аутентификацию', body: 'Сейчас refresh-токены живут бессрочно. Нужно реализовать rotation + revoke-list в Redis, чтобы украденный токен можно было инвалидировать.\n\nОжидаемый интерфейс:\n\n```ts\nexport async function rotateRefreshToken(old: string): Promise<TokenPair> {\n  const payload = await verifyRefresh(old)\n  if (await isRevoked(payload.jti)) throw new AuthError("reuse", 401)\n  await revoke(payload.jti)\n  return issuePair(payload.sub)\n}\n```', state: 'open', author: admin, assignee: claude, labels: [L.backend, L.security, L.agent], ageDays: 6, comments: 4 },
  { number: 2, title: 'Flaky-тест в auth-сервисе при параллельном запуске', body: 'TestLoginConcurrent падает ~1 раз из 10 в CI. Похоже на race condition в моке хранилища сессий.\n\nВоспроизведение с детектором гонок:\n\n```go\nfunc TestLoginConcurrent(t *testing.T) {\n\tstore := NewMemSessionStore()\n\tvar wg sync.WaitGroup\n\tfor i := 0; i < 50; i++ {\n\t\twg.Add(1)\n\t\tgo func() {\n\t\t\tdefer wg.Done()\n\t\t\tstore.Set("sid", &Session{User: "u"}) // data race\n\t\t}()\n\t}\n\twg.Wait()\n}\n```', state: 'open', author: msidorova, assignee: codex, labels: [L.bug, L.backend], ageDays: 4, comments: 6 },
  { number: 3, title: 'Настроить автоскейлинг подов в Kubernetes (HPA)', body: 'Добавить HorizontalPodAutoscaler для gateway и task-runner по CPU/памяти. Целевая загрузка 70%.', state: 'open', author: dvolkov, assignee: gemini, labels: [L.enhancement, L.cicd], ageDays: 9, comments: 2 },
  { number: 4, title: 'N+1 запрос при выборке задач канбана', body: 'На доске с 200+ задачами делается отдельный запрос за агентом для каждой задачи. Нужно батчить через dataloader.\n\nСейчас в логах видно N запросов:\n\n```sql\nSELECT * FROM agents WHERE id = $1; -- ×200\n```\n\nДолжен быть один:\n\n```sql\nSELECT * FROM agents WHERE id = ANY($1);\n```', state: 'closed', author: akozlov, assignee: claude, labels: [L.bug, L.perf, L.backend], ageDays: 12, comments: 3 },
  { number: 5, title: 'GraphQL endpoint для мобильного приложения', body: 'REST слишком «болтливый» для мобилки. Нужна GraphQL-схема: задачи, эпики, агенты, подписки на статусы.', state: 'open', author: dvolkov, assignee: claude, labels: [L.enhancement, L.backend, L.agent], ageDays: 7, comments: 5 },
  { number: 6, title: 'Email-уведомления о смене статуса задачи', body: 'Слать письмо ответственному при переходе задачи в «Ревью» и «Готово». Шаблоны + дайджест.', state: 'open', author: admin, assignee: codex, labels: [L.enhancement], ageDays: 5, comments: 2 },
  { number: 7, title: 'Дашборд аналитики: график throughput агентов', body: 'Нужен график «задач в день» по каждому агенту за последние 30 дней (recharts).', state: 'open', author: msidorova, assignee: gemini, labels: [L.enhancement, L.frontend], ageDays: 3, comments: 1 },
  { number: 8, title: 'Docker-образ слишком большой (1.2 GB)', body: 'Финальный образ раздут. Перейти на multi-stage build и distroless базу.', state: 'closed', author: dvolkov, assignee: custom, labels: [L.cicd, L.perf], ageDays: 15, comments: 4 },
  { number: 9, title: 'Тёмная тема ломает контраст в бейджах', body: 'Текст бейджей сливается с фоном в dark-режиме (WCAG AA не проходит). Поправить токены цвета.\n\nПроблемный вариант:\n\n```tsx\nconst variants = {\n  outline: "border text-muted-foreground", // контраст 2.1:1 — мало\n}\n```', state: 'open', author: enovikova, assignee: gemini, labels: [L.bug, L.frontend, L.goodFirst], ageDays: 2, comments: 2 },
  { number: 10, title: 'Сгенерировать OpenAPI-спеку и поднять Swagger UI', body: 'Автогенерация OpenAPI 3.1 из хэндлеров + маршрут /docs со Swagger UI.', state: 'open', author: admin, assignee: gemini, labels: [L.docs], ageDays: 8, comments: 1 },
  { number: 11, title: 'Rate limiting на gateway через Redis', body: 'Ограничение запросов по API-ключу: sliding window в Redis, 429 при превышении.', state: 'open', author: akozlov, assignee: claude, labels: [L.enhancement, L.backend, L.security], ageDays: 6, comments: 3 },
]

export const mockIssues: GitHubIssue[] = issueSeeds.map((s) => {
  const created = now - DAY * s.ageDays
  const updated = now - HOUR * (s.number * 3)
  return {
    id: 30000 + s.number,
    number: s.number,
    title: s.title,
    body: s.body,
    state: s.state,
    html_url: `${repoUrl}/issues/${s.number}`,
    user: s.author,
    assignees: [s.assignee],
    labels: s.labels,
    milestone: null,
    comments: s.comments,
    created_at: iso(created),
    updated_at: iso(updated),
    closed_at: s.state === 'closed' ? iso(updated) : null,
  }
})

const issueComments: Record<number, GitHubComment[]> = {}
function seedComments(issueNumber: number, entries: [GitHubUser, string][]) {
  issueComments[issueNumber] = entries.map(([user, body], i) => ({
    id: issueNumber * 100 + i,
    body,
    user,
    created_at: iso(now - HOUR * (24 - i * 3)),
    updated_at: iso(now - HOUR * (24 - i * 3)),
  }))
}
seedComments(1, [
  [claude, 'Беру задачу. План: добавить таблицу refresh_tokens с jti, при refresh — ротация + запись старого в revoke-list.'],
  [akozlov, 'Не забудь про TTL в Redis, иначе revoke-list будет расти бесконечно.'],
  [claude, 'Учёл, TTL = времени жизни refresh-токена. Открыл PR #3.'],
  [admin, 'Отлично, ревью назначил на Александра.'],
])
seedComments(2, [
  [msidorova, 'Воспроизвела локально с -race, ловится дата-рейс на map сессий.'],
  [codex, 'Добавлю sync.RWMutex вокруг доступа к стору, плюс t.Parallel() переразложу.'],
])
seedComments(5, [
  [dvolkov, 'Подписки на статусы — обязательны, мобилка хочет realtime.'],
  [claude, 'Сделаю через GraphQL subscriptions поверх существующего Kafka-топика.'],
])

// ── Pull Requests (numbers 3..13, linked from mockTasks) ──────────────────

type ReviewState = GitHubReview['state']
interface PRSeed {
  number: number
  title: string
  body: string
  state: 'open' | 'closed'
  merged: boolean
  draft: boolean
  author: GitHubUser
  head: string
  reviews: [GitHubUser, ReviewState, string][]
  requested: GitHubUser[]
  labels: GitHubLabel[]
  additions: number
  deletions: number
  files: number
  commits: number
  ageDays: number
  checks: [string, GitHubCheckRun['conclusion']][]
}

const PASS: [string, GitHubCheckRun['conclusion']][] = [
  ['lint', 'success'], ['typecheck', 'success'], ['unit-tests', 'success'], ['build', 'success'],
]
const prSeeds: PRSeed[] = [
  { number: 3, title: 'feat(auth): ротация refresh-токенов + revoke-list', body: 'Реализует ротацию refresh-токенов и инвалидацию через Redis revoke-list.\n\nCloses #1', state: 'closed', merged: true, draft: false, author: claude, head: 'feat/auth-refresh-rotation', reviews: [[akozlov, 'APPROVED', 'LGTM, TTL на месте. Мержим.'], [msidorova, 'COMMENTED', 'Добавь тест на повторное использование старого токена.']], requested: [], labels: [L.backend, L.security, L.agent], additions: 412, deletions: 86, files: 9, commits: 6, ageDays: 5, checks: PASS },
  { number: 4, title: 'ci: HPA и resource limits для всех сервисов', body: 'Добавляет HorizontalPodAutoscaler и requests/limits.\n\nRelates to #3', state: 'open', merged: false, draft: false, author: gemini, head: 'feat/k8s-hpa', reviews: [[dvolkov, 'CHANGES_REQUESTED', 'Лимиты памяти занижены для task-runner, OOM словим.']], requested: [dvolkov], labels: [L.cicd, L.agent], additions: 234, deletions: 12, files: 7, commits: 3, ageDays: 2, checks: [['lint', 'success'], ['typecheck', 'success'], ['unit-tests', 'success'], ['build', 'failure']] },
  { number: 5, title: 'perf(board): устранение N+1 через dataloader', body: 'Батчинг выборки агентов. p95 листинга доски 820ms → 70ms.\n\nCloses #4', state: 'closed', merged: true, draft: false, author: claude, head: 'fix/board-n1', reviews: [[akozlov, 'APPROVED', 'Огонь, цифры впечатляют.']], requested: [], labels: [L.perf, L.backend, L.agent], additions: 156, deletions: 73, files: 4, commits: 2, ageDays: 10, checks: PASS },
  { number: 6, title: 'feat(notify): email-уведомления через SMTP-воркер', body: 'Воркер рассылки + шаблоны писем. WIP: остался дайджест.\n\nRelates to #6', state: 'open', merged: false, draft: true, author: codex, head: 'feat/email-notify', reviews: [[admin, 'COMMENTED', 'Вынеси SMTP-конфиг в env, не хардкодь.']], requested: [admin], labels: [L.enhancement, L.agent], additions: 298, deletions: 4, files: 11, commits: 5, ageDays: 4, checks: [['lint', 'success'], ['typecheck', 'success'], ['unit-tests', null], ['build', null]] },
  { number: 7, title: 'feat(auth): поддержка 2FA (TOTP)', body: 'Двухфакторная аутентификация по TOTP + recovery-коды.\n\nRelates to #1', state: 'open', merged: false, draft: false, author: claude, head: 'feat/auth-2fa', reviews: [[msidorova, 'APPROVED', 'Чисто. QR-генерация порадовала.'], [enovikova, 'COMMENTED', 'Добавь e2e на ввод неверного кода.']], requested: [], labels: [L.backend, L.security, L.agent], additions: 521, deletions: 23, files: 13, commits: 8, ageDays: 3, checks: PASS },
  { number: 8, title: 'chore(docker): multi-stage build, образ 1.2GB → 180MB', body: 'Distroless база + multi-stage.\n\nCloses #8', state: 'closed', merged: true, draft: false, author: custom, head: 'chore/docker-slim', reviews: [[dvolkov, 'APPROVED', '180MB — отлично, мержим.']], requested: [], labels: [L.cicd, L.perf, L.agent], additions: 64, deletions: 41, files: 3, commits: 2, ageDays: 13, checks: PASS },
  { number: 9, title: 'feat(dashboard): график throughput агентов', body: 'График задач/день по агентам на recharts.\n\nCloses #7', state: 'open', merged: false, draft: false, author: gemini, head: 'feat/agent-throughput-chart', reviews: [[msidorova, 'CHANGES_REQUESTED', 'Подписи осей нечитаемы в тёмной теме.']], requested: [msidorova], labels: [L.frontend, L.agent], additions: 187, deletions: 9, files: 5, commits: 4, ageDays: 2, checks: [['lint', 'success'], ['typecheck', 'success'], ['unit-tests', 'success'], ['build', 'success'], ['e2e', 'failure']] },
  { number: 10, title: 'docs: OpenAPI 3.1 спека + маршрут Swagger UI', body: 'Автогенерация спеки и /docs.\n\nCloses #10', state: 'open', merged: false, draft: false, author: gemini, head: 'docs/openapi-swagger', reviews: [[admin, 'APPROVED', 'Спека валидная, Swagger поднимается.']], requested: [], labels: [L.docs, L.agent], additions: 1240, deletions: 2, files: 6, commits: 3, ageDays: 7, checks: PASS },
  { number: 11, title: 'feat(gateway): rate limiter на Redis (sliding window)', body: 'Ограничение запросов по API-ключу, 429 при превышении.\n\nCloses #11', state: 'open', merged: false, draft: false, author: claude, head: 'feat/gateway-ratelimit', reviews: [[akozlov, 'COMMENTED', 'Глянь, нет ли гонки на инкременте окна.']], requested: [akozlov], labels: [L.backend, L.security, L.agent], additions: 203, deletions: 18, files: 6, commits: 4, ageDays: 5, checks: PASS },
  { number: 12, title: 'fix(ui): контраст бейджей в тёмной теме', body: 'Поправлены цветовые токены бейджей под WCAG AA.\n\nCloses #9', state: 'open', merged: false, draft: false, author: gemini, head: 'fix/badge-contrast', reviews: [[enovikova, 'APPROVED', 'Контраст теперь проходит, спасибо.']], requested: [], labels: [L.frontend, L.bug, L.agent], additions: 38, deletions: 31, files: 2, commits: 1, ageDays: 1, checks: PASS },
  { number: 13, title: 'feat(api): GraphQL-схема и резолверы', body: 'GraphQL-схема: задачи, эпики, агенты + subscriptions. WIP.\n\nRelates to #5', state: 'open', merged: false, draft: true, author: claude, head: 'feat/graphql-api', reviews: [[dvolkov, 'COMMENTED', 'Подписки через Kafka — то, что нужно. Жду готовности.']], requested: [dvolkov], labels: [L.backend, L.agent], additions: 689, deletions: 7, files: 14, commits: 9, ageDays: 3, checks: [['lint', 'success'], ['typecheck', 'success'], ['unit-tests', 'success'], ['build', 'success']] },
]

const sha = (n: number) => (n * 1234567).toString(16).padStart(7, '0').slice(0, 7)

export const mockPullRequests: GitHubPullRequest[] = prSeeds.map((s) => {
  const created = now - DAY * s.ageDays
  const updated = now - HOUR * (s.number * 2)
  return {
    id: 40000 + s.number,
    number: s.number,
    title: s.title,
    body: s.body,
    state: s.state,
    html_url: `${repoUrl}/pull/${s.number}`,
    user: s.author,
    head: { ref: s.head, sha: sha(s.number), repo: { full_name: `${MOCK_OWNER}/${MOCK_REPO}` } },
    base: { ref: 'main', sha: sha(99) },
    merged: s.merged,
    mergeable: s.state === 'open' ? true : null,
    mergeable_state: s.state === 'open' ? 'clean' : 'unknown',
    draft: s.draft,
    assignees: [s.author],
    labels: s.labels,
    requested_reviewers: s.requested,
    comments: s.reviews.length,
    review_comments: s.reviews.length,
    commits: s.commits,
    additions: s.additions,
    deletions: s.deletions,
    changed_files: s.files,
    created_at: iso(created),
    updated_at: iso(updated),
    merged_at: s.merged ? iso(updated) : null,
    closed_at: s.state === 'closed' ? iso(updated) : null,
  }
})

const prReviews: Record<number, GitHubReview[]> = {}
const prChecks: Record<number, GitHubCheckRun[]> = {}
prSeeds.forEach((s) => {
  prReviews[s.number] = s.reviews.map(([user, state, body], i) => ({
    id: s.number * 1000 + i,
    user,
    body,
    state,
    submitted_at: iso(now - HOUR * (12 - i * 2)),
    html_url: `${repoUrl}/pull/${s.number}#pullrequestreview-${s.number}${i}`,
  }))
  prChecks[s.number] = s.checks.map(([name, conclusion], i) => ({
    id: s.number * 500 + i,
    name,
    status: conclusion ? 'completed' : 'in_progress',
    conclusion,
    html_url: `${repoUrl}/pull/${s.number}/checks`,
    started_at: iso(now - HOUR * 2),
    completed_at: conclusion ? iso(now - HOUR) : null,
  }))
})

// ── PR changed files (unified diffs) ──────────────────────────────────────

function addedPatch(code: string): { patch: string; additions: number } {
  const lines = code.split('\n')
  const body = lines.map((l) => '+' + l).join('\n')
  return { patch: `@@ -0,0 +1,${lines.length} @@\n` + body, additions: lines.length }
}

const modPatches: Omit<GitHubPullFile, 'changes'>[] = [
  {
    filename: 'auth/jwt.ts', status: 'modified', additions: 2, deletions: 1,
    patch: `@@ -10,7 +10,9 @@ export function signRefreshToken(sub: string) {
   return jwt.sign({ sub }, SECRET, {
     algorithm: 'HS256',
-    expiresIn: '30d',
+    expiresIn: REFRESH_TTL,
+    jwtid: randomUUID(),
   })
 }`,
  },
  {
    filename: 'board/queries.ts', status: 'modified', additions: 1, deletions: 3,
    patch: `@@ -21,9 +21,7 @@ export async function fetchTasks(cols: string[]) {
   const tasks = await db.selectFrom('tasks').where('col', 'in', cols).execute()
-  for (const t of tasks) {
-    t.agent = await fetchAgent(t.agentId)
-  }
+  await agentLoader.loadMany(tasks.map((t) => t.agentId))
   return tasks
 }`,
  },
  {
    filename: 'components/badge.tsx', status: 'modified', additions: 1, deletions: 1,
    patch: `@@ -6,7 +6,7 @@ const variants = {
   default: 'bg-primary text-primary-foreground',
   secondary: 'bg-secondary text-secondary-foreground',
-  outline: 'border text-muted-foreground',
+  outline: 'border text-foreground/80 dark:text-foreground/90',
 }`,
  },
]

const prFiles: Record<number, GitHubPullFile[]> = {}
prSeeds.forEach((s, idx) => {
  const sample = codeSamples[idx % codeSamples.length]
  const add = addedPatch(sample.code)
  const mod = modPatches[idx % modPatches.length]
  prFiles[s.number] = [
    { filename: sample.fileName, status: 'added', additions: add.additions, deletions: 0, changes: add.additions, patch: add.patch },
    { ...mod, changes: mod.additions + mod.deletions },
  ]
})

// ── Actions: workflows, runs, jobs ────────────────────────────────────────

export const mockWorkflows: GitHubWorkflow[] = [
  { id: 501, name: 'CI', path: '.github/workflows/ci.yml', state: 'active', html_url: `${repoUrl}/actions/workflows/ci.yml`, badge_url: '', created_at: iso(now - DAY * 60), updated_at: iso(now - DAY * 2) },
  { id: 502, name: 'Deploy', path: '.github/workflows/deploy.yml', state: 'active', html_url: `${repoUrl}/actions/workflows/deploy.yml`, badge_url: '', created_at: iso(now - DAY * 55), updated_at: iso(now - DAY * 3) },
  { id: 503, name: 'CodeQL', path: '.github/workflows/codeql.yml', state: 'active', html_url: `${repoUrl}/actions/workflows/codeql.yml`, badge_url: '', created_at: iso(now - DAY * 40), updated_at: iso(now - DAY * 7) },
  { id: 504, name: 'Changelog', path: '.github/workflows/changelog.yml', state: 'active', html_url: `${repoUrl}/actions/workflows/changelog.yml`, badge_url: '', created_at: iso(now - DAY * 30), updated_at: iso(now - DAY * 5) },
]

interface RunSeed {
  id: number
  wf: number
  name: string
  status: GitHubWorkflowRun['status']
  conclusion: GitHubWorkflowRun['conclusion']
  branch: string
  title: string
  actor: GitHubUser
  runNo: number
  ageH: number
}
const runSeeds: RunSeed[] = [
  { id: 9101, wf: 501, name: 'CI', status: 'in_progress', conclusion: null, branch: 'feat/gateway-ratelimit', title: 'feat(gateway): rate limiter на Redis', actor: claude, runNo: 412, ageH: 0.3 },
  { id: 9102, wf: 501, name: 'CI', status: 'completed', conclusion: 'failure', branch: 'feat/k8s-hpa', title: 'ci: HPA и resource limits', actor: gemini, runNo: 411, ageH: 2 },
  { id: 9103, wf: 501, name: 'CI', status: 'completed', conclusion: 'success', branch: 'feat/auth-2fa', title: 'feat(auth): поддержка 2FA (TOTP)', actor: claude, runNo: 410, ageH: 5 },
  { id: 9104, wf: 502, name: 'Deploy', status: 'completed', conclusion: 'success', branch: 'main', title: 'chore(docker): multi-stage build', actor: custom, runNo: 88, ageH: 9 },
  { id: 9105, wf: 503, name: 'CodeQL', status: 'completed', conclusion: 'success', branch: 'main', title: 'Scheduled security scan', actor: admin, runNo: 51, ageH: 14 },
  { id: 9106, wf: 501, name: 'CI', status: 'completed', conclusion: 'success', branch: 'fix/badge-contrast', title: 'fix(ui): контраст бейджей', actor: gemini, runNo: 409, ageH: 20 },
  { id: 9107, wf: 504, name: 'Changelog', status: 'completed', conclusion: 'success', branch: 'main', title: 'docs: обновление CHANGELOG', actor: admin, runNo: 33, ageH: 26 },
  { id: 9108, wf: 502, name: 'Deploy', status: 'queued', conclusion: null, branch: 'main', title: 'docs: OpenAPI 3.1 спека', actor: gemini, runNo: 89, ageH: 0.1 },
]

export const mockWorkflowRuns: GitHubWorkflowRun[] = runSeeds.map((r) => ({
  id: r.id,
  name: r.name,
  workflow_id: r.wf,
  status: r.status,
  conclusion: r.conclusion,
  html_url: `${repoUrl}/actions/runs/${r.id}`,
  run_number: r.runNo,
  event: r.branch === 'main' ? 'push' : 'pull_request',
  head_branch: r.branch,
  head_sha: sha(r.id),
  display_title: r.title,
  created_at: iso(now - HOUR * r.ageH),
  updated_at: iso(now - HOUR * r.ageH + 600_000),
  run_started_at: iso(now - HOUR * r.ageH),
  actor: r.actor,
  triggering_actor: r.actor,
}))

function jobsForRun(run: GitHubWorkflowRun): GitHubWorkflowJob[] {
  const ok = run.conclusion === 'success'
  const failed = run.conclusion === 'failure'
  const running = run.status !== 'completed'
  const stepNames = ['Checkout', 'Setup', 'Install deps', 'Lint', 'Typecheck', 'Build', 'Test']
  const failAt = failed ? 5 : -1
  return [
    {
      id: run.id * 10 + 1,
      run_id: run.id,
      name: run.name === 'Deploy' ? 'deploy' : 'build-and-test',
      status: run.status,
      conclusion: run.conclusion as GitHubWorkflowJob['conclusion'],
      html_url: run.html_url,
      started_at: run.run_started_at,
      completed_at: running ? null : iso(now),
      runner_name: 'ubuntu-latest',
      steps: stepNames.map((name, i) => ({
        name,
        number: i + 1,
        status: running && i >= 4 ? (i === 4 ? 'in_progress' : 'queued') : 'completed',
        conclusion:
          failAt === i ? 'failure'
          : failAt >= 0 && i > failAt ? 'skipped'
          : running && i >= 4 ? null
          : ok || failed ? 'success'
          : 'success',
        started_at: iso(now - HOUR),
        completed_at: running && i >= 4 ? null : iso(now),
      })),
    },
  ]
}

// ── Resolver ──────────────────────────────────────────────────────────────

const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms))

function filterByState<T extends { state: 'open' | 'closed' }>(items: T[], state: string | null): T[] {
  if (!state || state === 'all') return items
  return items.filter((i) => i.state === state)
}

export async function resolveMock(path: string, init?: RequestInit): Promise<unknown> {
  await delay()
  const [rawPath, query] = path.split('?')
  const params = new URLSearchParams(query || '')
  const seg = rawPath.split('/').filter(Boolean) // e.g. ['repos','owner','repo','issues']
  const method = (init?.method || 'GET').toUpperCase()
  const body = init?.body ? JSON.parse(init.body as string) : undefined

  if (rawPath === '/user') return mockGitHubUser

  if (seg[0] === 'repos') {
    const rest = seg.slice(3) // after repos/:owner/:repo
    if (rest.length === 0) return mockGitHubRepo

    const [section, a, b] = rest

    if (section === 'issues') {
      if (rest.length === 1) {
        if (method === 'POST') {
          const num = Math.max(...mockIssues.map((i) => i.number)) + 1
          const created: GitHubIssue = {
            ...mockIssues[0],
            id: 30000 + num, number: num,
            title: body?.title || 'Новый issue', body: body?.body || '',
            state: 'open', html_url: `${repoUrl}/issues/${num}`,
            user: mockGitHubUser, assignees: [], labels: [],
            comments: 0, created_at: iso(now), updated_at: iso(now), closed_at: null,
          }
          mockIssues.unshift(created)
          return created
        }
        return filterByState(mockIssues, params.get('state'))
      }
      const num = +a
      if (b === 'comments') {
        if (method === 'POST') {
          const c: GitHubComment = { id: Date.now(), body: body?.body || '', user: mockGitHubUser, created_at: iso(now), updated_at: iso(now) }
          ;(issueComments[num] ||= []).push(c)
          return c
        }
        return issueComments[num] || []
      }
      const issue = mockIssues.find((i) => i.number === num)
      if (method === 'PATCH' && issue) {
        Object.assign(issue, body, { updated_at: iso(now), closed_at: body?.state === 'closed' ? iso(now) : issue.closed_at })
        return issue
      }
      return issue || mockIssues[0]
    }

    if (section === 'labels') return mockLabels
    if (section === 'collaborators') return humans

    if (section === 'pulls') {
      if (rest.length === 1) return filterByState(mockPullRequests, params.get('state'))
      const num = +a
      if (b === 'reviews') return prReviews[num] || []
      if (b === 'files') return prFiles[num] || []
      return mockPullRequests.find((p) => p.number === num) || mockPullRequests[0]
    }

    if (section === 'commits' && b === 'check-runs') {
      const ref = a
      const pr = mockPullRequests.find((p) => p.head.sha === ref)
      const runs = pr ? prChecks[pr.number] || [] : []
      return { total_count: runs.length, check_runs: runs }
    }

    if (section === 'actions') {
      // workflows | workflows/:id/runs | runs | runs/:id | runs/:id/jobs
      const kind = rest[1]
      if (kind === 'workflows') {
        if (rest.length === 2) return { total_count: mockWorkflows.length, workflows: mockWorkflows }
        // workflows/:id/runs
        const wfId = +rest[2]
        const runs = mockWorkflowRuns.filter((r) => r.workflow_id === wfId)
        return { total_count: runs.length, workflow_runs: runs }
      }
      if (kind === 'runs') {
        if (rest.length === 2) return { total_count: mockWorkflowRuns.length, workflow_runs: mockWorkflowRuns }
        const runId = +rest[2]
        if (rest[3] === 'jobs') {
          const run = mockWorkflowRuns.find((r) => r.id === runId)
          const jobs = run ? jobsForRun(run) : []
          return { total_count: jobs.length, jobs }
        }
        if (rest[3] === 'rerun' || rest[3] === 'cancel') return undefined
        return mockWorkflowRuns.find((r) => r.id === runId) || mockWorkflowRuns[0]
      }
    }
  }

  // Unknown path — return empty-ish payload so callers degrade gracefully.
  return []
}
