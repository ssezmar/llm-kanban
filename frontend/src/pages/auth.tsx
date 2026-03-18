import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot } from 'lucide-react'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, register } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isLogin) {
      const success = login(email, password)
      if (success) {
        navigate('/dashboard')
      } else {
        setError('Неверный email или пароль')
      }
    } else {
      if (!name.trim()) {
        setError('Введите имя')
        return
      }
      const success = register(name, email, password)
      if (success) {
        navigate('/dashboard')
      } else {
        setError('Пользователь с таким email уже существует')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-mesh relative">
      <div className="absolute inset-0 bg-background/80" />
      <Card className="w-full max-w-md relative animate-scale-in shadow-2xl shadow-foreground/5 dark:shadow-primary/10 border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 relative">
            <Bot className="h-12 w-12 text-foreground dark:text-primary" />
            <div className="absolute inset-0 blur-xl bg-foreground/5 dark:bg-primary/20" />
          </div>
          <CardTitle className="text-xl">{isLogin ? 'Вход в систему' : 'Регистрация'}</CardTitle>
          <CardDescription>
            {isLogin
              ? 'Войдите в LLM Kanban для управления задачами'
              : 'Создайте аккаунт для начала работы'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2 animate-fade-in-up">
                <label className="text-sm font-medium">Имя</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Пароль</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                minLength={6}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive animate-fade-in bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full shadow-lg shadow-foreground/10 dark:shadow-primary/20">
              {isLogin ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              className="text-primary hover:underline transition-colors"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
            >
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </button>
          </div>
          {isLogin && (
            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">
                Демо-доступ: <code className="text-foreground font-mono">admin@llmkanban.ru</code> / <code className="text-foreground font-mono">admin123</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
