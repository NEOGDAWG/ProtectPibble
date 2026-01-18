import type { GroupMode } from '../api/types'

export function ModeBadge({ mode }: { mode: GroupMode }) {
  const label = mode === 'INSTRUCTOR' ? 'Instructor' : 'Friend'
  const cls =
    mode === 'INSTRUCTOR'
      ? 'border-violet-500/30 bg-violet-500/10 text-violet-200'
      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>
      {label}
    </span>
  )
}

