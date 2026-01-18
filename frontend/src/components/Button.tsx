import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
  children: ReactNode
}

export function Button({ variant = 'secondary', className = '', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-sm'
  const v =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
      : variant === 'danger'
        ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
        : 'bg-gray-100 text-blue-900 hover:bg-gray-200 border border-gray-300'
  return <button className={`${base} ${v} ${className}`} {...props} />
}

