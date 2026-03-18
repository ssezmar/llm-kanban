import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { useUsersStore } from '@/stores/users-store'
import { useTasksStore } from '@/stores/tasks-store'
import { useBoardStore } from '@/stores/board-store'
import { useEpicsStore } from '@/stores/epics-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft, Save, X, Pencil, Mail, Briefcase, Calendar,
  ListChecks, CheckCircle2, AlertCircle, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  developer: 'Разработчик',
  viewer: 'Наблюдатель',
}

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-500 border-red-500/20',
  manager: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  developer: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  viewer: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser, updateProfile } = useAuthStore()
  const { users } = useUsersStore()
  const { tasks } = useTasksStore()
  const { columns } = useBoardStore()
  const { epics } = useEpicsStore()

  const isOwnProfile = !id || id === currentUser?.id
  const profileUser = isOwnProfile ? currentUser : users.find((u) => u.id === id)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editPosition, setEditPosition] = useState('')

  if (!profileUser) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Пользователь не найден</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>Вернуться</Button>
      </div>
    )
  }

  // User stats
  const userTasks = tasks.filter((t) => t.createdBy === profileUser.id)
  const completedTasks = userTasks.filter((t) => t.status === 'done')
  const activeTasks = userTasks.filter((t) => t.progress > 0 && t.progress < 100)
  const overdueTasks = userTasks.filter((t) => t.deadline && t.deadline < Date.now() && t.progress < 100)
  const userComments = tasks.reduce((acc, t) => acc + t.comments.filter((c) => c.author === profileUser.name).length, 0)
  const userReviews = tasks.filter((t) => t.review?.reviewer.startsWith(profileUser.name.split(' ')[0])).length

  const startEditing = () => {
    setEditName(profileUser.name)
    setEditBio(profileUser.bio)
    setEditPosition(profileUser.position)
    setEditing(true)
  }

  const saveEdit = () => {
    updateProfile({
      name: editName,
      bio: editBio,
      position: editPosition,
      avatar: editName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
    })
    setEditing(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Назад
        </Button>
        {isOwnProfile && !editing && (
          <Button variant="outline" className="gap-2" onClick={startEditing}>
            <Pencil className="h-4 w-4" /> Редактировать
          </Button>
        )}
        {editing && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" /> Отмена
            </Button>
            <Button className="gap-2" onClick={saveEdit}>
              <Save className="h-4 w-4" /> Сохранить
            </Button>
          </div>
        )}
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-2xl bg-foreground/5 dark:bg-primary/10 text-foreground/70 dark:text-primary/70 text-2xl font-bold flex items-center justify-center shrink-0">
              {profileUser.avatar}
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              {editing ? (
                <div className="space-y-3">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="text-xl h-12 font-bold" placeholder="Имя" />
                  <Input value={editPosition} onChange={(e) => setEditPosition(e.target.value)}
                    className="h-9" placeholder="Должность" />
                  <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)}
                    rows={3} placeholder="О себе..." />
                </div>
              ) : (
                <>
                  <div>
                    <h1 className="text-2xl font-bold">{profileUser.name}</h1>
                    {profileUser.position && (
                      <p className="text-muted-foreground">{profileUser.position}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <Badge variant="outline" className={cn('border', roleBadgeColors[profileUser.role])}>
                      {roleLabels[profileUser.role]}
                    </Badge>
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {profileUser.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> С {new Date(profileUser.joinedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  {profileUser.bio && <p className="text-sm">{profileUser.bio}</p>}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-foreground/5 dark:bg-primary/10 flex items-center justify-center">
                <ListChecks className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userTasks.length}</p>
                <p className="text-xs text-muted-foreground">Задач создано</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
                <p className="text-xs text-muted-foreground">Завершено</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueTasks.length}</p>
                <p className="text-xs text-muted-foreground">Просрочено</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-foreground/5 dark:bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userComments + userReviews}</p>
                <p className="text-xs text-muted-foreground">Активностей</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks by user */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Задачи ({userTasks.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {userTasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Нет задач</p>
          )}
          {userTasks.slice(0, 10).map((task) => {
            const col = columns.find((c) => c.id === task.status)
            const epic = task.epicId ? epics.find((e) => e.id === task.epicId) : null
            return (
              <div key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/tasks/${task.id}`)}>
                <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {epic && <span className="text-xs text-muted-foreground">{epic.emoji} {epic.name}</span>}
                    {task.progress > 0 && task.progress < 100 && (
                      <div className="w-16"><Progress value={task.progress} size="sm" /></div>
                    )}
                  </div>
                </div>
                {col && (
                  <Badge variant="outline" className="text-xs gap-1 shrink-0">
                    {col.emoji} {col.title}
                  </Badge>
                )}
              </div>
            )
          })}
          {userTasks.length > 10 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              И ещё {userTasks.length - 10} задач...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Последние комментарии</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(() => {
            const allComments = tasks.flatMap((t) =>
              t.comments
                .filter((c) => c.author === profileUser.name)
                .map((c) => ({ ...c, taskId: t.id, taskTitle: t.title }))
            ).sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)

            if (allComments.length === 0) {
              return <p className="text-sm text-muted-foreground text-center py-4">Нет комментариев</p>
            }

            return allComments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-muted text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {profileUser.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className="font-medium text-foreground hover:underline cursor-pointer"
                      onClick={() => navigate(`/tasks/${c.taskId}`)}
                    >
                      {c.taskTitle}
                    </span>
                    <span>·</span>
                    <span>{new Date(c.timestamp).toLocaleString('ru-RU')}</span>
                  </div>
                  <p className="text-sm mt-0.5">{c.text}</p>
                </div>
              </div>
            ))
          })()}
        </CardContent>
      </Card>
    </div>
  )
}
