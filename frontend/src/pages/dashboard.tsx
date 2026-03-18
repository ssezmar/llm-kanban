import { useTasksStore } from '@/stores/tasks-store'
import { useAgentsStore } from '@/stores/agents-store'
import { useBoardStore } from '@/stores/board-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export function DashboardPage() {
  const { tasks } = useTasksStore()
  const { agents } = useAgentsStore()
  const { columns } = useBoardStore()

  const avgScore =
    tasks
      .filter((t) => t.review)
      .reduce((sum, t) => sum + (t.review?.score || 0), 0) /
      (tasks.filter((t) => t.review).length || 1)

  const activeTasks = tasks.filter((t) => t.progress > 0 && t.progress < 100)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Дашборд</h1>

      {/* Column stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => {
          const count = tasks.filter((t) => t.status === col.id).length
          return (
            <Card key={col.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{col.title}</CardTitle>
                <span className="text-lg">{col.emoji}</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                {col.limit && (
                  <p className="text-xs text-muted-foreground">лимит: {col.limit}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Активные задачи</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTasks.length === 0 && (
              <p className="text-sm text-muted-foreground">Нет активных задач</p>
            )}
            {activeTasks.map((task) => {
              const agent = agents.find((a) => a.id === task.assignedAgent)
              return (
                <div key={task.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: task.color }} />
                      <span className="text-sm font-medium truncate mr-2">{task.title}</span>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {task.progress}%
                    </Badge>
                  </div>
                  <Progress value={task.progress} />
                  {agent && (
                    <p className="text-xs text-muted-foreground">
                      Агент: {agent.name}
                    </p>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Агенты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {agent.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.tasksCompleted} задач, {agent.successRate}% успех
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    agent.status === 'idle'
                      ? 'secondary'
                      : agent.status === 'busy'
                      ? 'default'
                      : 'outline'
                  }
                >
                  {agent.status === 'idle' ? 'Свободен' : agent.status === 'busy' ? 'Занят' : 'Офлайн'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Средняя оценка качества</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{avgScore.toFixed(1)}<span className="text-lg text-muted-foreground">/10</span></div>
          <p className="text-sm text-muted-foreground mt-1">
            По {tasks.filter((t) => t.review).length} завершённым задачам с ревью
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
