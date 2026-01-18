import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { api } from '../api/client'
import type { CreateGroupRequest, GroupMode } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { ModeBadge } from '../components/ModeBadge'
import { queryClient } from '../queryClient'

export function GroupsPage() {
  const { identity, logout } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['myGroups'],
    queryFn: api.getMyGroups,
    enabled: !!identity,
    retry: (failureCount, error) => {
      // Don't retry on 401 - token expired/invalid
      if (error instanceof Error && 'status' in error && (error as { status: number }).status === 401) {
        logout()
        navigate('/login')
        return false
      }
      return failureCount < 3
    },
  })

  // Handle authentication errors - redirect to login
  if (error && error instanceof Error && 'status' in error && (error as { status: number }).status === 401) {
    // This will be handled by retry function, but ensure we don't render
    return null
  }

  const [createForm, setCreateForm] = useState<CreateGroupRequest>({
    classCode: '',
    term: '',
    mode: 'FRIEND',
    groupName: '',
    initialHealth: 100,
  })
  const [inviteCode, setInviteCode] = useState('')

  const createMutation = useMutation({
    mutationFn: (req: CreateGroupRequest) => api.createGroup(req),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['myGroups'] })
      navigate(`/groups/${res.group.id}`)
    },
  })

  const joinMutation = useMutation({
    mutationFn: (req: { inviteCode: string }) => api.joinGroup(req),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['myGroups'] })
      navigate(`/groups/${res.group.id}`)
    },
  })

  const canCreate = useMemo(() => {
    return (
      createForm.classCode.trim() &&
      createForm.term.trim() &&
      createForm.groupName.trim() &&
      createForm.mode
    )
  }, [createForm])

  if (!identity) return <Navigate to="/login" replace />

  return (
    <div className="min-h-full bg-blue-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Groups</h1>
            <p className="mt-1 text-blue-700">
              Signed in as <span className="font-medium">{identity.displayName}</span> (
              <span className="font-mono">{identity.email}</span>)
            </p>
          </div>
          <Button
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Logout
          </Button>
        </div>

        {/* My Groups Section */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-xl font-bold text-blue-900">My groups</h2>
          {isLoading && <p className="text-blue-700">Loading…</p>}
          {error && (
            <p className="text-red-600">
              {(error as Error).message}
            </p>
          )}
          {!isLoading && !error && (
            <div className="grid gap-2">
              {data?.groups?.length ? (
                data.groups.map((g) => (
                  <Link
                    key={g.id}
                    to={`/groups/${g.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition hover:bg-gray-100"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-900">{g.name}</span>
                        <ModeBadge mode={g.mode} />
                      </div>
                      <div className="text-sm text-blue-700">
                        {g.class.code} • {g.class.term}
                      </div>
                    </div>
                    <div className="text-sm text-blue-600">Invite: {g.inviteCode}</div>
                  </Link>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-blue-700">
                  No groups yet. Create one below or join using an invite code.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create and Join Forms */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-xl font-bold text-blue-900">Create group</h2>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                createMutation.mutate(createForm)
              }}
            >
              <Input
                label="Class code"
                value={createForm.classCode}
                onChange={(e) => setCreateForm((p) => ({ ...p, classCode: e.target.value }))}
                placeholder="CPSC 313"
                required
              />
              <Input
                label="Term"
                value={createForm.term}
                onChange={(e) => setCreateForm((p) => ({ ...p, term: e.target.value }))}
                placeholder="2026W"
                required
              />
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-blue-900 font-medium">Mode</span>
                <select
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={createForm.mode}
                  onChange={(e) => setCreateForm((p) => ({ ...p, mode: e.target.value as GroupMode }))}
                >
                  <option value="FRIEND">Friend</option>
                  <option value="INSTRUCTOR">Instructor</option>
                </select>
              </label>
              <Input
                label="Group name"
                value={createForm.groupName}
                onChange={(e) => setCreateForm((p) => ({ ...p, groupName: e.target.value }))}
                placeholder="Kabir's CPSC313"
                required
              />
              <Input
                label="Initial pet HP"
                type="number"
                min={1}
                max={1000}
                value={String(createForm.initialHealth ?? 100)}
                onChange={(e) => setCreateForm((p) => ({ ...p, initialHealth: Number(e.target.value) || 100 }))}
                required
              />
              {createMutation.error && (
                <p className="text-sm text-red-600">{(createMutation.error as Error).message}</p>
              )}
              <div className="flex items-center justify-end">
                <Button type="submit" variant="primary" disabled={!canCreate || createMutation.isPending}>
                  {createMutation.isPending ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-xl font-bold text-blue-900">Join group</h2>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                joinMutation.mutate({ inviteCode })
              }}
            >
              <Input
                label="Invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="A1B2C3D"
                required
              />
              {joinMutation.error && (
                <p className="text-sm text-red-600">{(joinMutation.error as Error).message}</p>
              )}
              <div className="flex items-center justify-end">
                <Button type="submit" variant="primary" disabled={!inviteCode.trim() || joinMutation.isPending}>
                  {joinMutation.isPending ? 'Joining…' : 'Join'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
