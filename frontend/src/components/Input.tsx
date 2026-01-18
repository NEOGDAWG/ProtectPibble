import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  helpText?: string
}

export function Input({ label, className = '', error, helpText, ...props }: Props) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-200">{label}</span>
      <input
        className={`rounded-lg border ${
          error ? 'border-rose-600' : 'border-slate-700'
        } bg-slate-900/40 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
          error ? 'focus:ring-rose-500' : 'focus:ring-white/20'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-rose-400">{error}</span>}
      {helpText && !error && <span className="text-xs text-slate-400">{helpText}</span>}
    </label>
  )
}

