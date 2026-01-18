import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  helpText?: string
}

export function Input({ label, className = '', error, helpText, ...props }: Props) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-blue-900 font-medium">{label}</span>
      <input
        className={`rounded-xl border ${
          error ? 'border-red-400' : 'border-gray-300'
        } bg-white px-3 py-2 text-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
          error ? 'focus:ring-red-400 focus:border-red-400' : 'focus:ring-blue-400 focus:border-blue-400'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
      {helpText && !error && <span className="text-xs text-gray-500">{helpText}</span>}
    </label>
  )
}

