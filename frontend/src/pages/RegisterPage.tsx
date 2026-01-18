import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import pibbleLogo from '../assets/pets/pibble.png'

export function RegisterPage() {
  const { identity, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const registerMutation = useMutation({
    mutationFn: (req: { email: string; displayName: string; password: string }) =>
      api.register(req),
    onSuccess: (data) => {
      login({ accessToken: data.accessToken, user: data.user })
      navigate('/groups')
    },
    onError: (error: Error) => {
      // Show more detailed error message
      const message = error.message || 'Failed to register. Please try again.'
      setErrors({ submit: message })
      console.error('Registration error:', error)
    },
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!email.trim() || !email.includes('@')) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!displayName.trim() || displayName.trim().length < 1) {
      newErrors.displayName = 'Please enter your name'
    }

    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    } else {
      if (!/[A-Z]/.test(password)) {
        newErrors.password = 'Password must contain at least one uppercase letter'
      } else if (!/[a-z]/.test(password)) {
        newErrors.password = 'Password must contain at least one lowercase letter'
      } else if (!/[0-9]/.test(password)) {
        newErrors.password = 'Password must contain at least one number'
      }
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validateForm()) {
      return
    }

    registerMutation.mutate({
      email: email.trim(),
      displayName: displayName.trim(),
      password,
    })
  }

  // If already logged in, redirect to groups
  if (identity) return <Navigate to="/groups" replace />

  return (
    <div className="min-h-full px-6 py-10" style={{ backgroundColor: '#cae0ee' }}>
      <div className="mx-auto max-w-lg">
        {/* Centered ProtectPibble Title */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <img
            src={pibbleLogo}
            alt="Pibble"
            className="h-12 w-12 object-contain"
          />
          <h1 className="text-5xl font-normal" style={{ color: '#314479' }}>ProtectPibble</h1>
        </div>

        <header className="mb-6 flex flex-col gap-2">
          <h2 className="text-3xl font-normal" style={{ color: '#314479' }}>Welcome</h2>
          <p className="text-lg font-normal" style={{ color: '#5e9bd4' }}>Create a new account or sign in to existing one</p>
        </header>

        <div className="mb-6 flex gap-3">
          <div className="flex-1">
            <Button variant="secondary" className="w-full" disabled>
              Create Account
            </Button>
          </div>
          <Link to="/login" className="flex-1">
            <Button variant="primary" className="w-full">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full" style={{ borderTop: '1px solid #5e9bd4' }}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 font-normal" style={{ backgroundColor: '#cae0ee', color: '#5e9bd4' }}>Or register with email</span>
          </div>
        </div>

        <form className="rounded-2xl p-6" style={{ backgroundColor: '#f2f7fa' }} onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors({ ...errors, email: '' })
              }}
              placeholder="you@example.com"
              required
              error={errors.email}
            />

            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                if (errors.displayName) setErrors({ ...errors, displayName: '' })
              }}
              placeholder="Your Name"
              required
              error={errors.displayName}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors({ ...errors, password: '' })
              }}
              placeholder="At least 8 characters"
              required
              error={errors.password}
              helpText="Must contain uppercase, lowercase, and number"
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' })
              }}
              placeholder="Re-enter your password"
              required
              error={errors.confirmPassword}
            />

            {errors.submit && (
              <div className="rounded-xl px-4 py-3 text-sm font-normal" style={{ backgroundColor: '#ef8688', color: 'white' }}>
                {errors.submit}
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm font-normal" style={{ color: '#5e9bd4' }}>
                Already have an account?{' '}
                <Link to="/login" className="underline font-normal" style={{ color: '#5e9bd4' }}>
                  Sign in here
                </Link>
              </p>
              <Button type="submit" variant="primary" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
