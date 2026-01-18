import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export function Input({ label, className = '', ...props }: Props) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-200">{label}</span>
      <input
        className={`rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 ${className}`}
        {...props}
      />
    </label>
  )
}

