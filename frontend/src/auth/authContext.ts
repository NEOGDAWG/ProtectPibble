import { createContext } from 'react'

export type AuthIdentity = {
  id: string
  email: string
  displayName: string
}

export type AuthContextValue = {
  identity: AuthIdentity | null
  login: (token: { accessToken: string; user: AuthIdentity }) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

