import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { clearAuthToken, getAuthToken, setAuthToken } from './storage'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState(() => {
    const token = getAuthToken()
    return token ? token.user : null
  })

  const login = useCallback((token: { accessToken: string; user: { id: string; email: string; displayName: string } }) => {
    setAuthToken(token)
    setIdentity(token.user)
  }, [])

  const logout = useCallback(() => {
    clearAuthToken()
    setIdentity(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({ identity, login, logout }), [identity, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

