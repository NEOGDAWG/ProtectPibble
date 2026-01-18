import type { GroupMode } from '../api/types'

export function ModeBadge({ mode }: { mode: GroupMode }) {
  const label = mode === 'INSTRUCTOR' ? 'Instructor' : 'Friend'
  const cls =
    mode === 'INSTRUCTOR'
      ? 'bg-[#f2f7fa] text-[#5e9bd4]'
      : 'bg-[#f2f7fa] text-[#5e9bd4]'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-normal ${cls}`}>
      {label}
    </span>
  )
}

