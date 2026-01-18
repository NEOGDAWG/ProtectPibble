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
import { getPetImage } from '../utils/petImage'

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

  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [showJoinPanel, setShowJoinPanel] = useState(false)
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

  const deleteMutation = useMutation({
    mutationFn: (groupId: string) => api.deleteGroup(groupId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['myGroups'] })
    },
    onError: (error) => {
      console.error('Failed to delete group:', error)
      alert(`Failed to delete group: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
    <div className="min-h-full px-6 py-8" style={{ backgroundColor: '#cae0ee' }}>
      <div className="mx-auto max-w-6xl">
        {/* Centered ProtectPibble Title */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-normal" style={{ color: '#314479' }}>ProtectPibble</h1>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-normal" style={{ color: '#314479' }}>Groups</h2>
            <p className="mt-1 text-lg font-normal" style={{ color: '#5e9bd4' }}>
              Signed in as <span className="font-normal">{identity.displayName}</span> (
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
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-normal" style={{ color: '#314479' }}>My groups</h2>
            <div className="relative flex gap-2">
              <div className="relative">
                <Button
                  onClick={() => {
                    setShowCreatePanel(!showCreatePanel)
                    setShowJoinPanel(false)
                  }}
                  variant="primary"
                >
                  {showCreatePanel ? 'Cancel' : 'Create Group'}
                </Button>
                {/* Create Group Panel */}
                {showCreatePanel && (
                  <div className="absolute top-full right-0 mt-2 rounded-2xl p-5 w-fit z-50 shadow-md transition-all duration-200" style={{ backgroundColor: '#f2f7fa' }}>
                    <h2 className="mb-3 text-xl font-normal" style={{ color: '#314479' }}>Create group</h2>
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
                        <span className="font-normal" style={{ color: '#314479' }}>Mode</span>
                        <select
                          className="rounded-xl bg-[#f2f7fa] px-3 py-2 font-normal focus:outline-none focus:ring-2"
                          style={{ color: '#5e9bd4' }}
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
                        <p className="text-sm font-normal" style={{ color: '#ef8688' }}>{(createMutation.error as Error).message}</p>
                      )}
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          onClick={() => setShowCreatePanel(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={!canCreate || createMutation.isPending}>
                          {createMutation.isPending ? 'Creating…' : 'Create'}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
              <div className="relative">
                <Button
                  onClick={() => {
                    setShowJoinPanel(!showJoinPanel)
                    setShowCreatePanel(false)
                  }}
                  variant="primary"
                >
                  {showJoinPanel ? 'Cancel' : 'Join Group'}
                </Button>
                {/* Join Group Panel */}
                {showJoinPanel && (
                  <div className="absolute top-full right-0 mt-2 rounded-2xl p-5 w-fit z-50 shadow-md transition-all duration-200" style={{ backgroundColor: '#f2f7fa' }}>
                    <h2 className="mb-3 text-xl font-normal" style={{ color: '#314479' }}>Join group</h2>
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
                        <p className="text-sm font-normal" style={{ color: '#ef8688' }}>{(joinMutation.error as Error).message}</p>
                      )}
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          onClick={() => setShowJoinPanel(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={!inviteCode.trim() || joinMutation.isPending}>
                          {joinMutation.isPending ? 'Joining…' : 'Join'}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
          {isLoading && <p className="font-normal" style={{ color: '#5e9bd4' }}>Loading…</p>}
          {error && (
            <p className="font-normal" style={{ color: '#ef8688' }}>
              {(error as Error).message}
            </p>
          )}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.groups?.length ? (
                data.groups.map((g) => {
                  const petHealth = g.petHealth ?? 100
                  const petMaxHealth = g.petMaxHealth ?? 100
                  const healthPercent = Math.max(0, Math.min(100, (petHealth / petMaxHealth) * 100))
                  const petImageSrc = getPetImage(petHealth, petMaxHealth)
                  
                  return (
                    <div key={g.id} className="flex flex-col gap-3 rounded-xl px-4 py-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 w-fit relative" style={{ backgroundColor: '#f2f7fa' }}>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/groups/${g.id}`}
                          className="flex items-center gap-2 flex-1 hover:opacity-90"
                        >
                          <span className="text-lg font-normal" style={{ color: '#314479' }}>{g.name}</span>
                          <ModeBadge mode={g.mode} />
                        </Link>
                        {g.isCreator && (
                          <Button
                            variant="danger"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (window.confirm(`Are you sure you want to delete "${g.name}"? This will permanently delete the group for all members.`)) {
                                deleteMutation.mutate(g.id)
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="ml-2"
                          >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                          </Button>
                        )}
                      </div>
                      <Link
                        to={`/groups/${g.id}`}
                        className="flex flex-col gap-3 hover:opacity-90"
                      >
                        <div className="text-sm font-normal" style={{ color: '#5e9bd4' }}>
                          {g.class.code} • {g.class.term}
                        </div>
                        {/* Pet Preview */}
                        <div className="flex items-center gap-3">
                          <img
                            src={petImageSrc}
                            alt="Pet preview"
                            className="h-16 w-16 object-contain"
                          />
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2 text-xs font-normal" style={{ color: '#314479' }}>
                              <span>Health</span>
                              <span>HP {petHealth}</span>
                            </div>
                            <div className="h-3 w-32 overflow-hidden rounded-full" style={{ backgroundColor: '#cae0ee' }}>
                              <div
                                className="h-full transition-all"
                                style={{ width: `${healthPercent}%`, backgroundColor: '#07d273' }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-normal" style={{ color: '#5e9bd4' }}>Invite: {g.inviteCode}</div>
                      </Link>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full rounded-xl p-4 text-center font-normal" style={{ backgroundColor: '#f2f7fa', color: '#5e9bd4' }}>
                  No groups yet. Create one or join using an invite code.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
