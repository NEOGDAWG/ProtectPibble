export type AuthToken = {
  accessToken: string
  user: {
    id: string
    email: string
    displayName: string
  }
}

const TOKEN_KEY = 'protectpibble.authToken'

// Legacy demo auth keys (for backward compatibility)
const EMAIL_KEY = 'protectpibble.demoEmail'
const NAME_KEY = 'protectpibble.demoName'

export function getAuthToken(): AuthToken | null {
  const tokenJson = localStorage.getItem(TOKEN_KEY)
  if (!tokenJson) {
    // No token found - require proper login
    return null
  }
  try {
    return JSON.parse(tokenJson) as AuthToken
  } catch {
    return null
  }
}

export function setAuthToken(token: AuthToken): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
  // Clear legacy demo auth
  localStorage.removeItem(EMAIL_KEY)
  localStorage.removeItem(NAME_KEY)
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
  localStorage.removeItem(NAME_KEY)
}

// Legacy functions for backward compatibility
export type DemoIdentity = {
  email: string
  name: string
}

export function getDemoIdentity(): DemoIdentity | null {
  // Check for JWT token first
  const token = getAuthToken()
  if (token) {
    return { email: token.user.email, name: token.user.displayName }
  }
  // Fallback to legacy demo auth
  const email = localStorage.getItem(EMAIL_KEY) || ''
  const name = localStorage.getItem(NAME_KEY) || ''
  if (!email.trim()) return null
  return { email: email.trim(), name: name.trim() || email.split('@')[0] }
}

export function setDemoIdentity(identity: DemoIdentity): void {
  localStorage.setItem(EMAIL_KEY, identity.email.trim())
  localStorage.setItem(NAME_KEY, (identity.name || identity.email.split('@')[0]).trim())
}

export function clearDemoIdentity(): void {
  clearAuthToken()
}

