import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  helpText?: string
}

export function Input({ label, className = '', error, helpText, ...props }: Props) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-[#314479] font-normal">{label}</span>
      <input
        className={`rounded-xl bg-[#f2f7fa] px-3 py-2 text-[#5e9bd4] placeholder:text-[#5e9bd4]/60 border focus:outline-none focus:ring-2 ${
          error ? 'border-[#ef8688] focus:ring-[#ef8688]' : 'border-[#5b9cd4]/50 focus:ring-[#5b9cd4]'
        } ${className}`}
        style={error ? {} : { borderColor: '#5b9cd4' }}
        {...props}
      />
      {error && <span className="text-xs text-[#ef8688]">{error}</span>}
      {helpText && !error && <span className="text-xs text-[#5e9bd4]/80">{helpText}</span>}
    </label>
  )
}

