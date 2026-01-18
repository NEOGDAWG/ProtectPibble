import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
  children: ReactNode
}

export function Button({ variant = 'secondary', className = '', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-normal transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
  const v =
    variant === 'primary'
      ? 'bg-[#5b9cd4] text-white hover:bg-[#4a8bc4] hover:opacity-100'
      : variant === 'danger'
        ? 'bg-[#ef8688] text-white hover:bg-[#e67577] hover:opacity-100'
        : 'bg-[#f2f7fa] text-[#5e9bd4] hover:bg-[#e8f0f5] hover:opacity-100'
  return <button className={`${base} ${v} ${className}`} {...props} />
}

