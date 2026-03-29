import { useState } from 'react'
import { useGitHubStore } from '@/stores/github-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHero } from '@/components/page-hero'
import {
  Github, Link2, Unlink, Eye, EyeOff, Loader2, CheckCircle2,
  AlertTriangle, Star, GitFork, Lock, Globe, Info,
} from 'lucide-react'

export function GitHubSettingsPage() {
  const {
    isConnected, isConnecting, error, user, repoInfo,
    rateLimitRemaining, connect, disconnect,
  } = useGitHubStore()

  const [token, setToken] = useState('')
  const [repoPath, setRepoPath] = useState('')
  const [showToken, setShowToken] = useState(false)

  const handleConnect = async () => {
    const parts = repoPath.split('/')
    if (parts.length !== 2 || !parts[0] || !parts[1]) return
    await connect(token.trim(), parts[0].trim(), parts[1].trim())
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      <PageHero>
        <div className="flex items-center gap-3 mb-2">
          <Github className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">GitHub Integration</h1>
        </div>
        <p className="text-sm text-muted-foreground">Connect your repository to manage issues, PRs and workflows</p>
      </PageHero>

      {!isConnected ? (
        <div className="max-w-xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-4 w-4" />
                Connect Repository
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Personal Access Token</label>
                <div className="relative">
                  <Input
                    type={showToken ? 'text' : 'password'}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Repository (owner/repo)</label>
                <Input
                  placeholder="owner/repository"
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleConnect}
                disabled={isConnecting || !token.trim() || !repoPath.includes('/')}
              >
                {isConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Github className="h-4 w-4 mr-2" />}
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2.5">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Token needs <code className="px-1 py-0.5 bg-background rounded text-[10px] font-mono">repo</code> and{' '}
                  <code className="px-1 py-0.5 bg-background rounded text-[10px] font-mono">workflow</code> scopes.
                  Create one at GitHub → Settings → Developer settings → Personal access tokens.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Connection status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={user?.avatar_url}
                      alt={user?.login}
                      className="w-12 h-12 rounded-full border-2 border-border"
                    />
                    <CheckCircle2 className="absolute -bottom-1 -right-1 h-4 w-4 text-green-500 bg-background rounded-full" />
                  </div>
                  <div>
                    <p className="font-semibold">{user?.name || user?.login}</p>
                    <p className="text-sm text-muted-foreground">@{user?.login}</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-green-500/30 text-green-500">
                  Connected
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Repo info */}
          {repoInfo && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {repoInfo.private ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Globe className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <p className="font-semibold font-mono text-sm">{repoInfo.full_name}</p>
                      {repoInfo.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{repoInfo.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">{repoInfo.private ? 'Private' : 'Public'}</Badge>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: Star, label: 'Stars', value: repoInfo.stargazers_count },
                    { icon: GitFork, label: 'Forks', value: repoInfo.forks_count },
                    { icon: AlertTriangle, label: 'Issues', value: repoInfo.open_issues_count },
                    { icon: Info, label: 'Rate Limit', value: rateLimitRemaining ?? '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-lg border bg-card p-3 text-center">
                      <Icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-lg font-bold font-mono">{value}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                    </div>
                  ))}
                </div>

                {repoInfo.language && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-foreground/30" />
                    {repoInfo.language}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Disconnect */}
          <Button variant="outline" className="w-full" onClick={disconnect}>
            <Unlink className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>
      )}
    </div>
  )
}
