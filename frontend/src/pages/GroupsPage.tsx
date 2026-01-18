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
  })

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
    <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight">Groups</h1>
            <p className="text-slate-300">
              Signed in as <span className="text-slate-100">{identity.displayName}</span> (
              <span className="font-mono text-slate-200">{identity.email}</span>)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-medium">My groups</h2>
        {isLoading && <p className="mt-3 text-slate-300">Loading…</p>}
        {error && (
          <p className="mt-3 text-rose-200">
            {(error as Error).message}
          </p>
        )}
        {!isLoading && !error && (
          <div className="mt-3 grid gap-2">
            {data?.groups?.length ? (
              data.groups.map((g) => (
                <Link
                  key={g.id}
                  to={`/groups/${g.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-3 hover:bg-slate-950/50"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{g.name}</span>
                      <ModeBadge mode={g.mode} />
                    </div>
                    <div className="text-sm text-slate-300">
                      {g.class.code} • {g.class.term}
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">Invite: {g.inviteCode}</div>
                </Link>
              ))
            ) : (
              <div className="mt-2 rounded-lg border border-dashed border-slate-800 p-4 text-slate-300">
                No groups yet. Create one below or join using an invite code.
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-lg font-medium">Create group</h2>
          <form
            className="mt-3 grid gap-4"
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
              <span className="text-slate-200">Mode</span>
              <select
                className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100"
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
              <p className="text-sm text-rose-200">{(createMutation.error as Error).message}</p>
            )}
            <div className="flex items-center justify-end">
              <Button type="submit" variant="primary" disabled={!canCreate || createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-lg font-medium">Join group</h2>
          <form
            className="mt-3 grid gap-4"
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
              <p className="text-sm text-rose-200">{(joinMutation.error as Error).message}</p>
            )}
            <div className="flex items-center justify-end">
              <Button type="submit" variant="primary" disabled={!inviteCode.trim() || joinMutation.isPending}>
                {joinMutation.isPending ? 'Joining…' : 'Join'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
