import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
  children: ReactNode
}

export function Button({ variant = 'secondary', className = '', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-normal transition-all disabled:cursor-not-allowed disabled:opacity-50'
  const v =
    variant === 'primary'
      ? 'bg-[#5b9cd4] text-white hover:opacity-90'
      : variant === 'danger'
        ? 'bg-[#ef8688] text-white hover:opacity-90'
        : 'bg-[#f2f7fa] text-[#5e9bd4] hover:opacity-90'
  return <button className={`${base} ${v} ${className}`} {...props} />
}

