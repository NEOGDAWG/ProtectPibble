import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { clearDemoIdentity, getDemoIdentity, setDemoIdentity } from './storage'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState(() => getDemoIdentity())

  const login = useCallback((next: { email: string; name: string }) => {
    setDemoIdentity(next)
    setIdentity(next)
  }, [])

  const logout = useCallback(() => {
    clearDemoIdentity()
    setIdentity(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({ identity, login, logout }), [identity, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

