import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const { identity, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState(identity?.email ?? '')
  const [name, setName] = useState(identity?.name ?? '')

  const canSubmit = useMemo(() => email.trim().includes('@') && name.trim().length > 0, [email, name])

  if (identity) return <Navigate to="/groups" replace />

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Login</h1>
        <p className="text-slate-300">
          MVP demo auth. This will be sent as <code className="rounded bg-slate-800 px-1">X-Demo-Email</code> and{' '}
          <code className="rounded bg-slate-800 px-1">X-Demo-Name</code>.
        </p>
      </header>

      <form
        className="rounded-xl border border-slate-800 bg-slate-900/40 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          login({ email: email.trim(), name: name.trim() })
          navigate('/groups')
        }}
      >
        <div className="grid gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kabir"
            required
          />
          <div className="flex items-center justify-end">
            <Button type="submit" variant="primary" disabled={!canSubmit}>
              Continue
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

