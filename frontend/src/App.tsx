import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { ProtectedRoute } from './components/ProtectedRoute'
import { GroupsPage } from './pages/GroupsPage'
import { GroupDashboardPage } from './pages/GroupDashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

function AppContent() {
  const location = useLocation()

  useEffect(() => {
    // Trigger fade-out animation on route change
    const root = document.getElementById('root')
    if (root) {
      root.style.opacity = '0'
      root.style.transition = 'opacity 100ms ease-out'
      setTimeout(() => {
        root.style.opacity = '1'
        root.style.transition = 'opacity 150ms ease-in'
      }, 100)
    }
  }, [location.pathname])

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/groups" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <GroupsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/:groupId"
        element={
          <ProtectedRoute>
            <GroupDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/groups" replace />} />
    </Routes>
  )
}

export default function App() {
  return <AppContent />
}
