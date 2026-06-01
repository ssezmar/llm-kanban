import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTasksStore } from '@/stores/tasks-store'
import { useAgentsStore } from '@/stores/agents-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHero } from '@/components/page-hero'
import { CodeStream } from '@/components/code-stream'
import { codeSamples } from '@/lib/code-samples'
import { Bot, Radio, ArrowUpRight, Cpu } from 'lucide-react'

export function LiveGenerationPage() {
  const tasks = useTasksStore((s) => s.tasks)
  const agents = useAgentsStore((s) => s.agents)

  const live = useMemo(() => {
    const executing = tasks.filter((t) => t.status === 'executing')
    const assigned = tasks.filter((t) => t.assignedAgent && t.status !== 'done')
    const pool = executing.length >= 2 ? executing : assigned.length >= 2 ? assigned : tasks
    return pool.slice(0, 6).map((task, i) => ({
      task,
      agent: agents.find((a) => a.id === task.assignedAgent) || agents[i % agents.length],
      sample: codeSamples[i % codeSamples.length],
      speed: 1 + (i % 3),
    }))
  }, [tasks, agents])

  const activeAgents = new Set(live.map((l) => l.agent?.id)).size

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up" data-tour="live-page">
      <PageHero>
        <div className="flex items-center gap-3 mb-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Radio className="h-6 w-6" /> Живая генерация
          </h1>
          <Badge variant="outline" className="border-red-500/40 text-red-500 uppercase tracking-wider text-[10px]">
            Live
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {activeAgents} LLM-агентов одновременно пишут код по {live.length} задачам в реальном времени
        </p>
      </PageHero>

      <div className="grid gap-5 lg:grid-cols-2" data-tour="live-grid">
        {live.map(({ task, agent, sample, speed }) => (
          <Card key={task.id} className="overflow-hidden">
            <CardContent className="pt-4 space-y-3">
              {/* Card header */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {agent?.avatar ?? <Bot className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/tasks/${task.id}`} className="text-sm font-semibold hover:underline truncate block">
                    {task.title}
                  </Link>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Cpu className="h-3 w-3" />
                    {agent?.name ?? 'Агент'} · {agent?.config.model ?? 'llm'}
                  </p>
                </div>
                <Link
                  to={`/tasks/${task.id}`}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Открыть задачу"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Live editor */}
              <CodeStream
                code={sample.code}
                language={sample.language}
                fileName={sample.fileName}
                agentName={agent?.name}
                speed={speed}
                streaming
                loop
                heightClass="h-72"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
