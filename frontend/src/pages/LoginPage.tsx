import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/Button'
import { Input } from '../components/Input'

export function LoginPage() {
  const { identity, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const loginMutation = useMutation({
    mutationFn: (req: { email: string; password: string }) => api.login(req),
    onSuccess: (data) => {
      login({ accessToken: data.accessToken, user: data.user })
      navigate('/groups')
    },
    onError: (error: Error) => {
      setError(error.message || 'Invalid email or password')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter both email and password')
      return
    }

    loginMutation.mutate({
      email: email.trim(),
      password,
    })
  }

  if (identity) return <Navigate to="/groups" replace />

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Sign In</h1>
        <p className="text-slate-300">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 underline">
            Create one
          </Link>
        </p>
      </header>

      <form className="rounded-xl border border-slate-800 bg-slate-900/40 p-5" onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError('')
            }}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError('')
            }}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="rounded-lg bg-rose-900/30 border border-rose-800 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end">
            <Button type="submit" variant="primary" disabled={loginMutation.isPending || !email.trim() || !password}>
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

