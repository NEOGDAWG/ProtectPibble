export type DemoIdentity = {
  email: string
  name: string
}

const EMAIL_KEY = 'protectpibble.demoEmail'
const NAME_KEY = 'protectpibble.demoName'

export function getDemoIdentity(): DemoIdentity | null {
  const email = localStorage.getItem(EMAIL_KEY) || ''
  const name = localStorage.getItem(NAME_KEY) || ''
  if (!email.trim()) return null
  return { email: email.trim(), name: name.trim() || email.split('@')[0] }
}

export function setDemoIdentity(identity: DemoIdentity): void {
  localStorage.setItem(EMAIL_KEY, identity.email.trim())
  localStorage.setItem(NAME_KEY, identity.name.trim())
}

export function clearDemoIdentity(): void {
  localStorage.removeItem(EMAIL_KEY)
  localStorage.removeItem(NAME_KEY)
}

