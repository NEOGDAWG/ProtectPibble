import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { api } from '../api/client'
import type { TaskType } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { ModeBadge } from '../components/ModeBadge'
import { useGroupState } from '../hooks/useGroupState'
import { queryClient } from '../queryClient'

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString()
}

export function GroupDashboardPage() {
  const { identity } = useAuth()
  const params = useParams()
  const groupId = params.groupId || ''

  const { data, isLoading, error, dataUpdatedAt } = useGroupState(groupId)

  const [nowMs, setNowMs] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskType, setTaskType] = useState<TaskType>('ASSIGNMENT')
  const [taskDue, setTaskDue] = useState('')
  const [taskPenalty, setTaskPenalty] = useState(1)

  // eslint rule: avoid Date.now() in render; update clock via effect.
  useEffect(() => {
    if (!dataUpdatedAt) return
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [dataUpdatedAt])

  const secondsAgo = useMemo(() => {
    if (!dataUpdatedAt || !nowMs) return null
    return Math.floor((nowMs - dataUpdatedAt) / 1000)
  }, [dataUpdatedAt, nowMs])

  const completeMutation = useMutation({
    mutationFn: (args: { taskId: string; status: 'DONE' | 'NOT_DONE' }) =>
      api.completeTask(args.taskId, { status: args.status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['groupState', groupId] })
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: () =>
      api.createTask(groupId, {
        title: taskTitle,
        type: taskType,
        dueAt: new Date(taskDue).toISOString(),
        penalty: taskPenalty,
      }),
    onSuccess: async () => {
      setShowCreate(false)
      setTaskTitle('')
      setTaskDue('')
      setTaskPenalty(1)
      await queryClient.invalidateQueries({ queryKey: ['groupState', groupId] })
    },
  })

  if (!identity) return <Navigate to="/login" replace />
  if (!groupId) return <Navigate to="/groups" replace />

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-6 px-6 py-10">
        <div className="text-slate-300">Loading dashboard…</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-6 px-6 py-10">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="text-rose-200">{(error as Error)?.message || 'Failed to load group.'}</p>
          <div className="mt-3">
            <Link className="text-slate-200 underline" to="/groups">
              Back to groups
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const canCreateTasks =
    data.group.mode === 'FRIEND' || (data.viewer?.role ? data.viewer.role === 'instructor' : false)

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{data.group.name}</h1>
              <ModeBadge mode={data.group.mode} />
            </div>
            <p className="text-slate-300">
              {data.group.class.code} • {data.group.class.term}
              {secondsAgo !== null ? <span className="ml-2 text-slate-500">updated {secondsAgo}s ago</span> : null}
            </p>
          </div>
          <div className="flex gap-2">
            <Link className="rounded-lg border border-slate-800 px-3 py-2 text-sm hover:bg-slate-900/40" to="/groups">
              Back
            </Link>
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Pet</h2>
          <div className="text-sm text-slate-300">
            {data.pet.health <= 0 ? 'dead' : 'alive'}{' '}
            <span className="text-slate-500">
              ({data.pet.health}/{data.pet.maxHealth})
            </span>
          </div>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${Math.max(0, Math.min(100, (data.pet.health / data.pet.maxHealth) * 100))}%` }}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Tasks</h2>
          {canCreateTasks ? (
            <Button onClick={() => setShowCreate((v) => !v)} variant="primary">
              {showCreate ? 'Close' : 'Create task'}
            </Button>
          ) : null}
        </div>

        {showCreate ? (
          <form
            className="mt-4 grid gap-4 rounded-lg border border-slate-800 bg-slate-950/30 p-4"
            onSubmit={(e) => {
              e.preventDefault()
              createTaskMutation.mutate()
            }}
          >
            <Input label="Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-200">Type</span>
              <select
                className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
              >
                <option value="ASSIGNMENT">Assignment</option>
                <option value="QUIZ">Quiz</option>
                <option value="LECTURE">Lecture</option>
                <option value="EXAM">Exam</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <Input
              label="Due at"
              type="datetime-local"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
              required
            />
            <Input
              label="Penalty"
              type="number"
              min={1}
              value={String(taskPenalty)}
              onChange={(e) => setTaskPenalty(Number(e.target.value))}
              required
            />
            {createTaskMutation.error ? (
              <p className="text-sm text-rose-200">{(createTaskMutation.error as Error).message}</p>
            ) : null}
            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={createTaskMutation.isPending || !taskTitle.trim()}>
                {createTaskMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </form>
        ) : null}

        <div className="mt-4 grid gap-2">
          {data.tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 p-4 text-slate-300">
              No tasks yet{canCreateTasks ? ' — create the first one.' : '.'}
            </div>
          ) : (
            data.tasks.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/30 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.title}</span>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-200">
                      {t.type}
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-200">
                      {t.myStatus}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300">
                    Due {formatDate(t.dueAt)} • penalty {t.penalty} • {t.stats.doneCount}/{t.stats.totalCount} done
                  </div>
                </div>
                <div className="flex gap-2">
                  {t.myStatus === 'DONE' ? (
                    <Button
                      onClick={() => completeMutation.mutate({ taskId: t.id, status: 'NOT_DONE' })}
                      disabled={completeMutation.isPending}
                    >
                      Undo
                    </Button>
                  ) : (
                    <Button
                      onClick={() => completeMutation.mutate({ taskId: t.id, status: 'DONE' })}
                      variant="primary"
                      disabled={completeMutation.isPending}
                    >
                      Mark done
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-medium">Activity</h2>
        <div className="mt-3 grid gap-2">
          {data.recentEvents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 p-4 text-slate-300">
              Activity will appear here.
            </div>
          ) : (
            data.recentEvents.slice(0, 15).map((e, idx) => (
              <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-3">
                <div className="text-sm text-slate-200">
                  {data.group.mode === 'FRIEND' ? (
                    <>
                      <span className="font-medium">{e.actor?.displayName ?? 'System'}</span> {e.type}
                      {e.target?.displayName ? (
                        <>
                          {' '}
                          → <span className="font-medium">{e.target.displayName}</span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>{e.message || e.type}</>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-500">{formatDate(e.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </section>

      {data.group.mode === 'FRIEND' && data.leaderboard?.length ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-lg font-medium">Leaderboard</h2>
          <div className="mt-3 grid gap-2">
            {data.leaderboard.map((row) => (
              <div
                key={row.user.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-3"
              >
                <div className="font-medium">{row.user.displayName}</div>
                <div className="text-sm text-slate-300">
                  done {row.doneCount} • missed {row.missedCount}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

