import type { GroupMode } from '../api/types'

export function ModeBadge({ mode }: { mode: GroupMode }) {
  const label = mode === 'INSTRUCTOR' ? 'Instructor' : 'Friend'
  const cls =
    mode === 'INSTRUCTOR'
      ? 'border-purple-300 bg-purple-100 text-purple-700'
      : 'border-green-300 bg-green-100 text-green-700'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

