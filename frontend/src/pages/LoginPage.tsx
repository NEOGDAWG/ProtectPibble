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

  // If already logged in, redirect to groups
  if (identity) return <Navigate to="/groups" replace />

  return (
    <div className="min-h-full bg-blue-50 px-6 py-10">
      <div className="mx-auto max-w-lg">
        <header className="mb-6 flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-blue-900">Welcome to ProtectPibble</h1>
          <p className="text-blue-700">Sign in to your account or create a new one</p>
        </header>

        <div className="mb-6 flex gap-3">
          <Link to="/register" className="flex-1">
            <Button variant="primary" className="w-full">
              Create Account
            </Button>
          </Link>
          <div className="flex-1">
            <Button variant="secondary" className="w-full" disabled>
              Sign In
            </Button>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-blue-50 px-2 text-blue-600">Or sign in with email</span>
          </div>
        </div>

        <form className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
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
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 underline font-medium">
                  Register here
                </Link>
              </p>
              <Button type="submit" variant="primary" disabled={loginMutation.isPending || !email.trim() || !password}>
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

