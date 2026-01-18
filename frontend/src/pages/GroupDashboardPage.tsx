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
import { getPetImage } from '../utils/petImage'

type DueFilter = 'ALL' | 'OVERDUE' | 'TODAY' | 'NEXT_7D' | 'NEXT_30D'
type StatusFilter = 'ALL' | 'DONE' | 'NOT_DONE'
type SortBy = 'DUE_DATE' | 'PENALTY' | 'TITLE'

// Utility functions to work consistently in PST
// All dates from the backend are in UTC - we convert to PST for display and comparisons

/**
 * Convert a UTC ISO string to a Date object with PST time components
 * This allows us to compare dates as if they were in PST timezone
 * Returns a Date object that can be compared (using getTime()) with other PST dates
 */
function toPSTDate(isoString: string): Date {
  // Ensure the ISO string is treated as UTC
  const utcIso = ensureUTC(isoString)
  const utcDate = new Date(utcIso)
  
  if (Number.isNaN(utcDate.getTime())) {
    return new Date(0) // Return epoch if invalid
  }
  
  // Get the PST representation of this UTC date
  const pstStr = utcDate.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  
  // Parse PST string: "MM/DD/YYYY, HH:MM:SS"
  const match = pstStr.match(/(\d{2})\/(\d{2})\/(\d{4}),\s(\d{2}):(\d{2}):(\d{2})/)
  if (!match) return utcDate
  
  const [, month, day, year, hour, minute, second] = match
  // Create a date in local timezone with PST values
  // This allows us to compare dates as if they were both in PST
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10),
    parseInt(second, 10)
  )
}

/**
 * Get current time as a Date object in PST
 */
function getPSTNow(): Date {
  const now = new Date()
  const pstStr = now.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  
  const match = pstStr.match(/(\d{2})\/(\d{2})\/(\d{4}),\s(\d{2}):(\d{2}):(\d{2})/)
  if (!match) return now
  
  const [, month, day, year, hour, minute, second] = match
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10),
    parseInt(second, 10)
  )
}

/**
 * Determine if a date in PST/PDT timezone is in daylight saving time
 * Returns true if PDT (daylight time), false if PST (standard time)
 * Uses a reliable method: check what timezone name the browser returns
 */
function isDaylightTime(date: Date): boolean {
  // Try to get timezone name from formatter - this is the most reliable
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short',
  })
  
  const parts = formatter.formatToParts(date)
  const tzName = parts.find(p => p.type === 'timeZoneName')?.value || ''
  
  // If browser returns PDT or PST explicitly, use that
  if (tzName.toUpperCase().includes('PDT')) return true
  if (tzName.toUpperCase().includes('PST')) return false
  
  // Fallback: Use a known date in summer (PDT) and winter (PST) to determine offset
  // Create a test date at UTC noon on the same date
  const testUtcNoon = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    12, 0, 0
  ))
  
  // Get what hour it is in PST/PDT at UTC noon
  const pstParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(testUtcNoon)
  
  const pstHour = parseInt(pstParts.find(p => p.type === 'hour')?.value || '4', 10)
  
  // At UTC noon:
  // - PST = 4am (offset -8 hours)
  // - PDT = 5am (offset -7 hours)
  return pstHour === 5
}

/**
 * Ensure an ISO string is treated as UTC
 * If the string doesn't have timezone info, assume it's UTC
 */
function ensureUTC(iso: string): string {
  // If it already has timezone info (Z or +/- offset), return as-is
  if (iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso)) {
    return iso
  }
  // If it doesn't have timezone info, append 'Z' to indicate UTC
  // Handle formats: "2024-01-18T15:00:00" or "2024-01-18T15:00:00.123"
  if (iso.includes('T')) {
    // Remove any trailing milliseconds and append Z
    const withoutMs = iso.replace(/\.\d+$/, '')
    return withoutMs + 'Z'
  }
  return iso
}

/**
 * Format a UTC ISO string for display in PST/PDT
 * Always shows the correct timezone abbreviation (PST or PDT)
 * The input ISO string should be in UTC (from backend)
 */
function formatLocalDateTime(iso: string): string {
  try {
    // Ensure the ISO string is treated as UTC
    const utcIso = ensureUTC(iso)
    const d = new Date(utcIso)
    
    if (Number.isNaN(d.getTime())) {
      console.warn('Invalid date:', iso)
      return iso
    }
    
    // Format in PST/PDT timezone
    // Intl.DateTimeFormat will automatically convert from UTC to PST/PDT
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    
    const parts = formatter.formatToParts(d)
    const month = parts.find(p => p.type === 'month')?.value || ''
    const day = parts.find(p => p.type === 'day')?.value || ''
    const year = parts.find(p => p.type === 'year')?.value || ''
    const hour = parts.find(p => p.type === 'hour')?.value || ''
    const minute = parts.find(p => p.type === 'minute')?.value || ''
    const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value?.toUpperCase() || ''
    
    // Determine if it's PST or PDT
    const isDST = isDaylightTime(d)
    const timeZoneName = isDST ? 'PDT' : 'PST'
    
    return `${month} ${day}, ${year}, ${hour}:${minute} ${dayPeriod} ${timeZoneName}`
  } catch (error) {
    console.error('Error formatting date:', iso, error)
    return iso
  }
}

function formatEnumValue(value: string): string {
  // Convert SNAKE_CASE to Title Case
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function isDoneStatus(s: TaskStatusValue) {
  return s === 'DONE' || s === 'EXCUSED'
}

export function GroupDashboardPage() {
  const { identity } = useAuth()
  const params = useParams()
  const groupId = params.groupId || ''

  const { data, isLoading, error, dataUpdatedAt } = useGroupState(groupId)

  // Track current time in PST for comparisons
  const [pstNow, setPstNow] = useState(() => getPSTNow())
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

  // Update PST time every second
  useEffect(() => {
    const updateClock = () => {
      setPstNow(getPSTNow())
      // Update PST time string for display
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
    if (!dataUpdatedAt) return null
    const updatedDate = new Date(dataUpdatedAt)
    const now = new Date()
    return Math.floor((now.getTime() - updatedDate.getTime()) / 1000)
  }, [dataUpdatedAt])

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
      // User enters time in PST - convert to UTC for storage
      // datetime-local gives us a string like "2026-01-18T06:57" with no timezone
      // We interpret this as PST/PDT time
      
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
      
      // Create a date representing this time in PST
      // We'll use a workaround: create date string with PST timezone and parse it
      // Format: "YYYY-MM-DDTHH:mm:00-08:00" for PST or "-07:00" for PDT
      // First, determine if it's DST (roughly March-November, but we'll check accurately)
      const testDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
      const pstFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: '2-digit',
        hour12: false,
      })
      const pstHour = parseInt(pstFormatter.formatToParts(testDate).find(p => p.type === 'hour')?.value || '12', 10)
      const offset = pstHour - 12 // If UTC 12:00 = PST 4:00, offset is -8
      
      // Convert PST to UTC: PST time - offset = UTC time
      // If offset is -8 and PST is 6:57, UTC is 6:57 - (-8) = 14:57
      const utcDate = new Date(Date.UTC(
        year,
        month - 1,
        day,
        hours - offset, // offset is negative, so subtracting adds hours
        minutes,
        0
      ))
      
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

  // Filter and sort tasks - all comparisons in PST
  const filteredAndSortedTasks = useMemo(() => {
    if (!data?.tasks) return []

    const q = search.trim().toLowerCase()
    const nowPST = pstNow

    let filtered = data.tasks.filter((t) => {
      // Search filter
      if (q && !t.title.toLowerCase().includes(q)) return false

      // Type filter
      if (!typeFilters[t.type]) return false

      // Status filter
      const done = isDoneStatus(t.myStatus)
      if (statusFilter === 'DONE' && !done) return false
      if (statusFilter === 'NOT_DONE' && done) return false

      // Due date filter - convert to PST for comparison
      const duePST = toPSTDate(t.dueAt)
      if (!Number.isNaN(duePST.getTime())) {
        const dayStart = new Date(nowPST)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)
        const weekEnd = new Date(nowPST)
        weekEnd.setDate(weekEnd.getDate() + 7)
        const monthEnd = new Date(nowPST)
        monthEnd.setDate(monthEnd.getDate() + 30)

        if (dueFilter === 'OVERDUE' && duePST >= nowPST) return false
        if (dueFilter === 'TODAY' && (duePST < dayStart || duePST >= dayEnd)) return false
        if (dueFilter === 'NEXT_7D' && (duePST < nowPST || duePST >= weekEnd)) return false
        if (dueFilter === 'NEXT_30D' && (duePST < nowPST || duePST >= monthEnd)) return false
      }

      return true
    })

    // Sort - compare in PST
    filtered.sort((a, b) => {
      if (sortBy === 'DUE_DATE') {
        return toPSTDate(a.dueAt).getTime() - toPSTDate(b.dueAt).getTime()
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
  }, [data?.tasks, search, dueFilter, statusFilter, typeFilters, sortBy, pstNow])

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
      <div className="min-h-full bg-blue-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="text-blue-700">Loading dashboard…</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-full bg-blue-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
            <p className="text-red-600">{(error as Error)?.message || 'Failed to load group.'}</p>
            <div className="mt-3">
              <Link className="text-blue-600 underline" to="/groups">
                Back to groups
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const canCreateTasks =
    data.group.mode === 'FRIEND' || (data.viewer?.role ? data.viewer.role === 'instructor' : false)

  const healthPercent = Math.max(0, Math.min(100, (data.pet.health / data.pet.maxHealth) * 100))
  const healthColor =
    healthPercent >= 70 ? 'bg-green-500' : healthPercent >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  const petImageSrc = getPetImage(data.pet.health, data.pet.maxHealth)

  return (
    <div className="min-h-full bg-blue-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header with group name and back button */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">{data.group.name}</h1>
            <p className="mt-1 text-blue-700">
              {data.group.class.code} • {data.group.class.term}
            </p>
          </div>
          <Link
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-blue-900 shadow-sm hover:bg-gray-50"
            to="/groups"
          >
            Back
          </Link>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column - Pet and Health */}
          <div className="lg:col-span-2">
            {/* Pet Section */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center">
                <h2 className="mb-4 text-2xl font-bold text-blue-900">ProtectPibble</h2>
                <img
                  src={petImageSrc}
                  alt={data.pet.name}
                  className="mb-4 h-48 w-48 object-contain"
                />
                <div className="w-full">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Health</span>
                    <span className="text-sm font-bold text-blue-900">HP {data.pet.health}</span>
                  </div>
                  <div className="h-6 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full transition-all ${healthColor}`}
                      style={{ width: `${healthPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-blue-900">Tasks</h2>
                <div className="flex gap-2">
                  <Button onClick={() => setFiltersOpen((v) => !v)}>
                    {filtersOpen ? 'Hide Filters' : 'Filter'}
                  </Button>
                  {canCreateTasks ? (
                    <Button onClick={() => setShowCreate((v) => !v)} variant="primary">
                      {showCreate ? 'Close' : 'Create'}
                    </Button>
                  ) : null}
                </div>
              </div>

              {filtersOpen && (
                <div className="mb-4 grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search tasks..."
                    />
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-blue-900 font-medium">Due date</span>
                      <select
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                      <span className="text-blue-900 font-medium">Status</span>
                      <select
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                      >
                        <option value="ALL">All</option>
                        <option value="NOT_DONE">Not done</option>
                        <option value="DONE">Done</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-blue-900 font-medium">Sort by</span>
                      <select
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    <div className="text-sm font-medium text-blue-900">Types</div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                      {(Object.keys(typeFilters) as TaskType[]).map((tt) => (
                        <label
                          key={tt}
                          className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-blue-900"
                        >
                          <input
                            type="checkbox"
                            checked={typeFilters[tt]}
                            onChange={(e) => setTypeFilters((p) => ({ ...p, [tt]: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-400"
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
                  className="mb-4 grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    createTaskMutation.mutate()
                  }}
                >
                  <Input label="Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-blue-900 font-medium">Type</span>
                    <select
                      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    <p className="text-sm text-red-600">{(createTaskMutation.error as Error).message}</p>
                  ) : null}
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" disabled={createTaskMutation.isPending || !taskTitle.trim()}>
                      {createTaskMutation.isPending ? 'Creating…' : 'Create'}
                    </Button>
                  </div>
                </form>
              ) : null}

              <div className="grid gap-3">
                {filteredAndSortedTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-blue-700">
                    {data.tasks.length === 0
                      ? `No tasks yet${canCreateTasks ? ' — create the first one.' : '.'}`
                      : 'No tasks match your filters.'}
                  </div>
                ) : (
                  filteredAndSortedTasks.map((t) => {
                    // Check if overdue - compare in PST
                    const duePST = toPSTDate(t.dueAt)
                    const isOverdue = duePST < pstNow && !isDoneStatus(t.myStatus)
                    const needsGrade = (t.type === 'EXAM' || t.type === 'ASSIGNMENT') && t.myStatus !== 'DONE'

                    return (
                      <div key={t.id} className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-blue-900">{t.title}</span>
                              <span className="rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-blue-700">
                                {formatEnumValue(t.type)}
                              </span>
                              <span className="rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-blue-700">
                                {formatEnumValue(t.myStatus)}
                              </span>
                              {t.myGradeLetter && (
                                <span className="rounded-full border border-green-300 bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                  Grade: {t.myGradeLetter}
                                  {t.myGradePercent ? ` (${t.myGradePercent}%)` : ''}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-sm text-blue-700">
                              <span className={isOverdue ? 'font-medium text-red-600' : ''}>
                                Due {formatLocalDateTime(t.dueAt)}
                              </span>
                              {' • '}
                              <span>penalty {t.penalty}</span>
                              {' • '}
                              <span>{t.stats.doneCount}/{t.stats.totalCount} done</span>
                            </div>
                          </div>
                          <div className="ml-4">
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
                                Mark Done
                              </Button>
                            )}
                          </div>
                        </div>
                        {gradeTaskId === t.id && (
                          <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="mb-3 text-sm font-medium text-blue-900">Enter your grade:</div>
                            <div className="flex flex-wrap items-end gap-3">
                              <label className="flex items-center gap-2 text-sm text-blue-900">
                                <input
                                  type="radio"
                                  name={`gradeMode-${t.id}`}
                                  checked={gradeMode === 'percent'}
                                  onChange={() => setGradeMode('percent')}
                                  className="text-blue-600 focus:ring-blue-400"
                                />
                                <span>Percent</span>
                              </label>
                              <label className="flex items-center gap-2 text-sm text-blue-900">
                                <input
                                  type="radio"
                                  name={`gradeMode-${t.id}`}
                                  checked={gradeMode === 'letter'}
                                  onChange={() => setGradeMode('letter')}
                                  className="text-blue-600 focus:ring-blue-400"
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
                                  <span className="text-blue-900 font-medium">Letter</span>
                                  <select
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                              <p className="mt-2 text-sm text-red-600">{(completeMutation.error as Error).message}</p>
                            ) : null}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right column - Leaderboard and Activity */}
          <div className="space-y-6">

            {/* Leaderboard */}
            {data.group.mode === 'FRIEND' && data.leaderboard?.length ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-xl font-bold text-blue-900">Leaderboard</h2>
                <div className="grid gap-2">
                  {data.leaderboard.map((row, idx) => (
                    <div
                      key={row.user.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <div className="font-medium text-blue-900">
                        {idx + 1}. {row.user.displayName}
                      </div>
                      <div className="text-sm text-blue-700">
                        Done {row.doneCount} Missed {row.missedCount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Activity Log */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-xl font-bold text-blue-900">Activity Log</h2>
              <div className="grid gap-2">
                {data.recentEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-blue-700">
                    Activity will appear here.
                  </div>
                ) : (
                  data.recentEvents.slice(0, 15).map((e, idx) => {
                    // Find task name and type if taskId exists
                    const task = e.taskId ? data.tasks.find(t => t.id === e.taskId) : null
                    const taskName = task?.title || null
                    const taskType = task?.type || null
                    
                    // Format event message
                    let eventText = ''
                    if (e.type === 'TASK_COMPLETED' && taskName) {
                      eventText = `${taskName} completed`
                    } else if (e.type === 'TASK_MISSED' && taskName) {
                      eventText = `${taskName} missed`
                    } else if (e.type === 'TASK_CREATED' && taskName) {
                      eventText = `Created ${taskName}`
                    } else {
                      // Fallback to formatted enum value
                      eventText = formatEnumValue(e.type)
                    }
                    
                    // Determine what to show as the "actor" - use task type if no actor and task exists
                    let actorDisplay = e.actor?.displayName
                    if (!actorDisplay && taskType && (e.type === 'TASK_MISSED' || e.type === 'TASK_COMPLETED')) {
                      actorDisplay = formatEnumValue(taskType)
                    } else if (!actorDisplay) {
                      actorDisplay = 'System'
                    }
                    
                    return (
                      <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="text-sm text-blue-900">
                          {data.group.mode === 'FRIEND' ? (
                            <>
                              <span className="font-medium">{actorDisplay}</span> {eventText}
                              {typeof e.delta === 'number' && e.delta !== 0 ? (
                                <span className={e.delta >= 0 ? 'ml-2 font-medium text-green-600' : 'ml-2 font-medium text-red-600'}>
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
                              {e.message || eventText}
                              {typeof e.delta === 'number' && e.delta !== 0 ? (
                                <span className={e.delta >= 0 ? 'ml-2 text-green-600' : 'ml-2 text-red-600'}>
                                  {e.delta >= 0 ? `+${e.delta}` : `${e.delta}`} HP
                                </span>
                              ) : null}
                            </>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-blue-600">{formatLocalDateTime(e.createdAt)}</div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
