import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
  children: ReactNode
}

export function Button({ variant = 'secondary', className = '', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50'
  const v =
    variant === 'primary'
      ? 'bg-white text-slate-900 hover:bg-slate-100'
      : variant === 'danger'
        ? 'bg-rose-500/15 text-rose-200 hover:bg-rose-500/25 border border-rose-500/30'
        : 'bg-slate-800/60 text-slate-100 hover:bg-slate-800 border border-slate-700'
  return <button className={`${base} ${v} ${className}`} {...props} />
}

