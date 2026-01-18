import { createContext } from 'react'

export type AuthIdentity = { email: string; name: string }

export type AuthContextValue = {
  identity: AuthIdentity | null
  login: (identity: AuthIdentity) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

