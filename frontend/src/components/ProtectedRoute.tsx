import { Navigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'

type Props = {
  children: React.ReactNode
}

/**
 * Protected route component - redirects to login if not authenticated
 */
export function ProtectedRoute({ children }: Props) {
  const { identity } = useAuth()

  if (!identity) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
