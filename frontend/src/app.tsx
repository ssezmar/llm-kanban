import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { Layout } from '@/components/layout'
import { LandingPage } from '@/pages/landing'
import { AuthPage } from '@/pages/auth'
import { DashboardPage } from '@/pages/dashboard'
import { BoardPage } from '@/pages/board'
import { BoardSettingsPage } from '@/pages/board-settings'
import { TasksPage } from '@/pages/tasks'
import { TaskDetailPage } from '@/pages/task-detail'
import { TaskCreatePage } from '@/pages/task-create'
import { EpicsPage } from '@/pages/epics'
import { EpicCreatePage } from '@/pages/epic-create'
import { EpicDetailPage } from '@/pages/epic-detail'
import { UserProfilePage } from '@/pages/user-profile'
import { AgentProfilePage } from '@/pages/agent-profile'
import { DbDiagramPage } from '@/pages/db-diagram'
import { ArchitecturePage } from '@/pages/architecture'
import { UseCasesPage } from '@/pages/use-cases'
import { TechStackPage } from '@/pages/tech-stack'
import { GitHubSettingsPage } from '@/pages/github-settings'
import { GitHubIssuesPage } from '@/pages/github-issues'
import { GitHubIssueDetailPage } from '@/pages/github-issue-detail'
import { GitHubPRsPage } from '@/pages/github-prs'
import { GitHubPRDetailPage } from '@/pages/github-pr-detail'
import { GitHubActionsPage } from '@/pages/github-actions'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/board/settings" element={<BoardSettingsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/new" element={<TaskCreatePage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/epics" element={<EpicsPage />} />
          <Route path="/epics/new" element={<EpicCreatePage />} />
          <Route path="/epics/:id" element={<EpicDetailPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />
          <Route path="/agents/:id" element={<AgentProfilePage />} />
          <Route path="/diagrams" element={<DbDiagramPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/use-cases" element={<UseCasesPage />} />
          <Route path="/tech-stack" element={<TechStackPage />} />
          <Route path="/github/settings" element={<GitHubSettingsPage />} />
          <Route path="/github/issues" element={<GitHubIssuesPage />} />
          <Route path="/github/issues/:number" element={<GitHubIssueDetailPage />} />
          <Route path="/github/prs" element={<GitHubPRsPage />} />
          <Route path="/github/prs/:number" element={<GitHubPRDetailPage />} />
          <Route path="/github/actions" element={<GitHubActionsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
