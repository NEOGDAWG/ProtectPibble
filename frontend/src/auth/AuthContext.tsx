import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { clearAuthToken, getAuthToken, setAuthToken } from './storage'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

/**
 * Decode JWT token to check expiration (without verification)
 * Returns null if token is invalid or expired
 */
function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    const payload = JSON.parse(atob(parts[1]))
    const exp = payload.exp
    if (!exp) return false
    
    // Check if token is expired (with 60 second buffer)
    const now = Math.floor(Date.now() / 1000)
    return exp > now + 60
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState(() => {
    const token = getAuthToken()
    if (!token) return null
    
    // Validate token is not expired
    if (!isTokenValid(token.accessToken)) {
      clearAuthToken()
      return null
    }
    
    return token.user
  })

  // Periodically check if token is still valid
  useEffect(() => {
    const token = getAuthToken()
    if (token && !isTokenValid(token.accessToken)) {
      clearAuthToken()
      setIdentity(null)
    }
  }, [identity])

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

