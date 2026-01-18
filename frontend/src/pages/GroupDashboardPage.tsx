import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { api } from '../api/client'
import type { TaskStatusValue, TaskType } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { ModeBadge } from '../components/ModeBadge'
import { useGroupState } from '../hooks/useGroupState'
import { queryClient } from '../queryClient'

// Safe DateTimeFormat with fallback for browser compatibility
const dateTimeFmt: Intl.DateTimeFormat | null = (() => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  } catch {
    return null
  }
})()

type DueFilter = 'ALL' | 'OVERDUE' | 'TODAY' | 'NEXT_7D' | 'NEXT_30D'
type StatusFilter = 'ALL' | 'DONE' | 'NOT_DONE'
type SortBy = 'DUE_DATE' | 'PENALTY' | 'TITLE'

function formatLocalDateTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return dateTimeFmt ? dateTimeFmt.format(d) : d.toLocaleString()
}

function isDoneStatus(s: TaskStatusValue) {
  return s === 'DONE' || s === 'EXCUSED'
}

export function GroupDashboardPage() {
  const { identity } = useAuth()
  const params = useParams()
  const groupId = params.groupId || ''

  const { data, isLoading, error, dataUpdatedAt } = useGroupState(groupId)

  const [nowMs, setNowMs] = useState(() => Date.now())
  const [pstTime, setPstTime] = useState(() => {
    const now = new Date()
    return now.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  })
  const [showCreate, setShowCreate] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskType, setTaskType] = useState<TaskType>('ASSIGNMENT')
  const [taskDue, setTaskDue] = useState('')
  const [taskPenalty, setTaskPenalty] = useState(1)

  // Filtering state
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dueFilter, setDueFilter] = useState<DueFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [typeFilters, setTypeFilters] = useState<Record<TaskType, boolean>>({
    ASSIGNMENT: true,
    QUIZ: true,
    LECTURE: true,
    EXAM: true,
    OTHER: true,
  })
  const [sortBy, setSortBy] = useState<SortBy>('DUE_DATE')

  // Grade input state
  const [gradeTaskId, setGradeTaskId] = useState<string | null>(null)
  const [gradeMode, setGradeMode] = useState<'percent' | 'letter'>('percent')
  const [gradePercent, setGradePercent] = useState('')
  const [gradeLetter, setGradeLetter] = useState<'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F'>('A')

  // eslint rule: avoid Date.now() in render; update clock via effect.
  useEffect(() => {
    const updateClock = () => {
      setNowMs(Date.now())
      // Update PST time
      const now = new Date()
      const pstString = now.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      setPstTime(pstString)
    }
    
    updateClock() // Update immediately
    const id = window.setInterval(updateClock, 1000)
    return () => window.clearInterval(id)
  }, [])

  const secondsAgo = useMemo(() => {
    if (!dataUpdatedAt || !nowMs) return null
    return Math.floor((nowMs - dataUpdatedAt) / 1000)
  }, [dataUpdatedAt, nowMs])

  const completeMutation = useMutation({
    mutationFn: (args: {
      taskId: string
      status: 'DONE' | 'NOT_DONE'
      gradePercent?: number
      gradeLetter?: string
    }) => api.completeTask(args.taskId, args),
    onSuccess: async () => {
      setGradeTaskId(null)
      await queryClient.invalidateQueries({ queryKey: ['groupState', groupId] })
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: () => {
      // Convert datetime-local input to PST time, then to ISO string
      // datetime-local gives us a string like "2026-01-18T14:30" with no timezone
      // We need to interpret this as PST (America/Los_Angeles) time
      
      if (!taskDue) {
        throw new Error('Due date is required')
      }
      
      // Parse the datetime-local string (format: "YYYY-MM-DDTHH:mm")
      const [datePart, timePart] = taskDue.split('T')
      if (!datePart || !timePart) {
        throw new Error('Invalid date format')
      }
      
      const [year, month, day] = datePart.split('-').map(Number)
      const [hours, minutes] = timePart.split(':').map(Number)
      
      // We need to find a UTC date that, when converted to PST, gives us the desired time
      // Strategy: try different UTC times and check what PST time they represent
      // Start with assuming PST = UTC-8 (PST) or UTC-7 (PDT)
      
      // Check if DST is in effect for the target date
      // Create a test date in the middle of the target day to check DST
      const testDate = new Date(year, month - 1, day, 12, 0, 0) // Noon on target day
      const pstTest = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        timeZoneName: 'short',
      }).formatToParts(testDate)
      const isDST = pstTest.find(p => p.type === 'timeZoneName')?.value === 'PDT'
      
      // PST is UTC-8, PDT is UTC-7
      const offsetHours = isDST ? 7 : 8
      
      // Create UTC date: add offset hours to get the UTC time that represents our PST time
      const utcDate = new Date(Date.UTC(year, month - 1, day, hours + offsetHours, minutes, 0))
      
      // Verify: check what PST time this UTC date represents
      const verifyPST = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(utcDate)
      
      const verifyYear = parseInt(verifyPST.find(p => p.type === 'year')?.value || '0')
      const verifyMonth = parseInt(verifyPST.find(p => p.type === 'month')?.value || '0')
      const verifyDay = parseInt(verifyPST.find(p => p.type === 'day')?.value || '0')
      const verifyHour = parseInt(verifyPST.find(p => p.type === 'hour')?.value || '0')
      const verifyMinute = parseInt(verifyPST.find(p => p.type === 'minute')?.value || '0')
      
      // If verification doesn't match, adjust
      if (verifyYear !== year || verifyMonth !== month || verifyDay !== day || verifyHour !== hours || verifyMinute !== minutes) {
        // Calculate the difference and adjust
        const hourDiff = hours - verifyHour
        const minuteDiff = minutes - verifyMinute
        const adjustmentMs = (hourDiff * 60 + minuteDiff) * 60 * 1000
        utcDate.setTime(utcDate.getTime() + adjustmentMs)
      }
      
      return api.createTask(groupId, {
        title: taskTitle,
        type: taskType,
        dueAt: utcDate.toISOString(),
        penalty: taskPenalty,
      })
    },
    onSuccess: async () => {
      setShowCreate(false)
      setTaskTitle('')
      setTaskDue('')
      setTaskPenalty(1)
      await queryClient.invalidateQueries({ queryKey: ['groupState', groupId] })
    },
  })

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    if (!data?.tasks) return []

    const q = search.trim().toLowerCase()
    const now = nowMs

    let filtered = data.tasks.filter((t) => {
      // Search filter
      if (q && !t.title.toLowerCase().includes(q)) return false

      // Type filter
      if (!typeFilters[t.type]) return false

      // Status filter
      const done = isDoneStatus(t.myStatus)
      if (statusFilter === 'DONE' && !done) return false
      if (statusFilter === 'NOT_DONE' && done) return false

      // Due date filter
      const dueMs = new Date(t.dueAt).getTime()
      if (!Number.isNaN(dueMs)) {
        const dayStart = new Date(now).setHours(0, 0, 0, 0)
        const dayEnd = dayStart + 24 * 60 * 60 * 1000
        const weekEnd = now + 7 * 24 * 60 * 60 * 1000
        const monthEnd = now + 30 * 24 * 60 * 60 * 1000

        if (dueFilter === 'OVERDUE' && dueMs >= now) return false
        if (dueFilter === 'TODAY' && (dueMs < dayStart || dueMs >= dayEnd)) return false
        if (dueFilter === 'NEXT_7D' && (dueMs < now || dueMs >= weekEnd)) return false
        if (dueFilter === 'NEXT_30D' && (dueMs < now || dueMs >= monthEnd)) return false
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'DUE_DATE') {
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      }
      if (sortBy === 'PENALTY') {
        return b.penalty - a.penalty
      }
      if (sortBy === 'TITLE') {
        return a.title.localeCompare(b.title)
      }
      return 0
    })

    return filtered
  }, [data?.tasks, search, dueFilter, statusFilter, typeFilters, sortBy, nowMs])

  const resetFilters = () => {
    setSearch('')
    setDueFilter('ALL')
    setStatusFilter('ALL')
    setTypeFilters({
      ASSIGNMENT: true,
      QUIZ: true,
      LECTURE: true,
      EXAM: true,
      OTHER: true,
    })
    setSortBy('DUE_DATE')
  }

  if (!identity) return <Navigate to="/login" replace />
  if (!groupId) return <Navigate to="/groups" replace />

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-6 px-6 py-10">
        <div className="text-slate-300">Loading dashboard…</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-6 px-6 py-10">
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

  const healthPercent = Math.max(0, Math.min(100, (data.pet.health / data.pet.maxHealth) * 100))
  const healthColor =
    healthPercent >= 70 ? 'bg-emerald-500' : healthPercent >= 40 ? 'bg-yellow-500' : 'bg-rose-500'

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
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="font-mono">PST: {pstTime}</span>
            </div>
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
          <div>
            <h2 className="text-lg font-medium">{data.pet.name}</h2>
            <p className="text-sm text-slate-300">
              {data.pet.health <= 0 ? (
                <span className="text-rose-400 font-medium">💀 Deceased</span>
              ) : (
                <span className={healthPercent < 30 ? 'text-rose-400' : healthPercent < 70 ? 'text-yellow-400' : 'text-emerald-400'}>
                  {healthPercent < 30 ? '⚠️ Critical' : healthPercent < 70 ? '😟 Unwell' : '😊 Healthy'}
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-100">{data.pet.health}</div>
            <div className="text-sm text-slate-400">/ {data.pet.maxHealth} HP</div>
          </div>
        </div>
        <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full transition-all ${healthColor}`} style={{ width: `${healthPercent}%` }} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="text-lg font-medium">Tasks</h2>
            <div className="text-sm text-slate-400">
              Showing {filteredAndSortedTasks.length} of {data.tasks.length}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setFiltersOpen((v) => !v)}>
              {filtersOpen ? 'Hide filters' : 'Filters'}
            </Button>
            {canCreateTasks ? (
              <Button onClick={() => setShowCreate((v) => !v)} variant="primary">
                {showCreate ? 'Close' : 'Create task'}
              </Button>
            ) : null}
          </div>
        </div>

        {filtersOpen && (
          <div className="mt-4 grid gap-4 rounded-lg border border-slate-800 bg-slate-950/30 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
              />
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-200">Due date</span>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100"
                  value={dueFilter}
                  onChange={(e) => setDueFilter(e.target.value as DueFilter)}
                >
                  <option value="ALL">All</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="TODAY">Today</option>
                  <option value="NEXT_7D">Next 7 days</option>
                  <option value="NEXT_30D">Next 30 days</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-200">Status</span>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                >
                  <option value="ALL">All</option>
                  <option value="NOT_DONE">Not done</option>
                  <option value="DONE">Done</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-200">Sort by</span>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                >
                  <option value="DUE_DATE">Due date</option>
                  <option value="PENALTY">Penalty (high to low)</option>
                  <option value="TITLE">Title (A-Z)</option>
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm text-slate-200">Types</div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                {(Object.keys(typeFilters) as TaskType[]).map((tt) => (
                  <label
                    key={tt}
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-200"
                  >
                    <input
                      type="checkbox"
                      checked={typeFilters[tt]}
                      onChange={(e) => setTypeFilters((p) => ({ ...p, [tt]: e.target.checked }))}
                    />
                    <span>{tt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button onClick={resetFilters}>Reset</Button>
            </div>
          </div>
        )}

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
          {filteredAndSortedTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 p-4 text-slate-300">
              {data.tasks.length === 0
                ? `No tasks yet${canCreateTasks ? ' — create the first one.' : '.'}`
                : 'No tasks match your filters.'}
            </div>
          ) : (
            filteredAndSortedTasks.map((t) => {
              const isOverdue = new Date(t.dueAt).getTime() < nowMs && !isDoneStatus(t.myStatus)
              const needsGrade = (t.type === 'EXAM' || t.type === 'ASSIGNMENT') && t.myStatus !== 'DONE'

              return (
                <div key={t.id} className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/30 p-4">
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{t.title}</span>
                      <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-200">
                        {t.type}
                      </span>
                      <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-200">
                        {t.myStatus}
                      </span>
                      {t.myGradeLetter && (
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-emerald-300">
                          Grade: {t.myGradeLetter}
                          {t.myGradePercent ? ` (${t.myGradePercent}%)` : ''}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className={isOverdue ? 'font-medium text-rose-300' : ''}>
                        Due {formatLocalDateTime(t.dueAt)}
                      </span>{' '}
                      • penalty {t.penalty} • {t.stats.doneCount}/{t.stats.totalCount} done
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
                        onClick={() => {
                          if (needsGrade) {
                            setGradeTaskId(t.id)
                            setGradeMode('percent')
                            setGradePercent('')
                            setGradeLetter('A')
                          } else {
                            completeMutation.mutate({ taskId: t.id, status: 'DONE' })
                          }
                        }}
                        variant="primary"
                        disabled={completeMutation.isPending}
                      >
                        Mark done
                      </Button>
                    )}
                  </div>

                  {gradeTaskId === t.id && (
                    <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                      <div className="text-sm font-medium text-slate-200 mb-2">Enter your grade:</div>
                      <div className="flex flex-wrap items-end gap-3">
                        <label className="flex items-center gap-2 text-sm text-slate-200">
                          <input
                            type="radio"
                            name={`gradeMode-${t.id}`}
                            checked={gradeMode === 'percent'}
                            onChange={() => setGradeMode('percent')}
                          />
                          <span>Percent</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-200">
                          <input
                            type="radio"
                            name={`gradeMode-${t.id}`}
                            checked={gradeMode === 'letter'}
                            onChange={() => setGradeMode('letter')}
                          />
                          <span>Letter</span>
                        </label>

                        {gradeMode === 'percent' ? (
                          <Input
                            label="Percent (0-100)"
                            type="number"
                            min={0}
                            max={100}
                            value={gradePercent}
                            onChange={(e) => setGradePercent(e.target.value)}
                            className="w-32"
                          />
                        ) : (
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="text-slate-200">Letter</span>
                            <select
                              className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100"
                              value={gradeLetter}
                              onChange={(e) =>
                                setGradeLetter(
                                  e.target.value as 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F',
                                )
                              }
                            >
                              <option value="A+">A+</option>
                              <option value="A">A</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B">B</option>
                              <option value="B-">B-</option>
                              <option value="C+">C+</option>
                              <option value="C">C</option>
                              <option value="C-">C-</option>
                              <option value="D">D</option>
                              <option value="F">F</option>
                            </select>
                          </label>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            onClick={() => {
                              if (gradeMode === 'percent') {
                                const n = Number(gradePercent)
                                if (!Number.isFinite(n) || n < 0 || n > 100) {
                                  alert('Please enter a valid percent (0-100)')
                                  return
                                }
                                completeMutation.mutate({ taskId: t.id, status: 'DONE', gradePercent: n })
                              } else {
                                completeMutation.mutate({ taskId: t.id, status: 'DONE', gradeLetter })
                              }
                            }}
                            disabled={completeMutation.isPending}
                          >
                            Submit
                          </Button>
                          <Button
                            onClick={() => setGradeTaskId(null)}
                            disabled={completeMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                      {completeMutation.error ? (
                        <p className="mt-2 text-sm text-rose-200">{(completeMutation.error as Error).message}</p>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })
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
                      {typeof e.delta === 'number' && e.delta !== 0 ? (
                        <span className={e.delta >= 0 ? 'ml-2 text-emerald-300 font-medium' : 'ml-2 text-rose-300 font-medium'}>
                          {e.delta >= 0 ? `+${e.delta}` : `${e.delta}`} HP
                        </span>
                      ) : null}
                      {e.target?.displayName ? (
                        <>
                          {' '}
                          → <span className="font-medium">{e.target.displayName}</span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {e.message || e.type}
                      {typeof e.delta === 'number' && e.delta !== 0 ? (
                        <span className={e.delta >= 0 ? 'ml-2 text-emerald-300' : 'ml-2 text-rose-300'}>
                          {e.delta >= 0 ? `+${e.delta}` : `${e.delta}`} HP
                        </span>
                      ) : null}
                    </>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-500">{formatLocalDateTime(e.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
