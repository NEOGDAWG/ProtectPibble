import { Navigate, Route, Routes } from 'react-router-dom'

import { GroupsPage } from './pages/GroupsPage'
import { GroupDashboardPage } from './pages/GroupDashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/groups" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/groups/:groupId" element={<GroupDashboardPage />} />
      <Route path="*" element={<Navigate to="/groups" replace />} />
    </Routes>
  )
}
