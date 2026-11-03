import { X } from '@phosphor-icons/react'
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { Status } from '../api'
import { STATUS_LABEL } from '../labels'

type Variant = 'primary' | 'secondary' | 'ghost' | 'blue'
const VARIANT: Record<Variant, string> = {
  primary: 'bg-coral text-white hover:brightness-110',
  blue: 'bg-blue text-white hover:brightness-110',
  secondary: 'border border-line-strong bg-white/[0.03] text-fg hover:bg-white/[0.07]',
  ghost: 'text-muted hover:bg-white/[0.06] hover:text-fg',
}

export function Button({
  variant = 'secondary', size = 'md', icon, children, className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; icon?: ReactNode }) {
  const sz = size === 'sm' ? 'h-9 px-3 text-[13px]' : 'h-11 px-4 text-sm'
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${sz} ${VARIANT[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

export function IconButton({ label, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button aria-label={label} title={label}
      className={`inline-flex size-11 items-center justify-center rounded-xl text-muted transition hover:bg-white/[0.06] hover:text-fg ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function Panel({ children, className = '', strong = false }: { children: ReactNode; className?: string; strong?: boolean }) {
  return <div className={`${strong ? 'glass-strong' : 'glass'} rounded-2xl ${className}`}>{children}</div>
}

const STATUS_COLOR: Record<Status, string> = {
  reported: 'var(--color-st-reported)',
  ai_verified: 'var(--color-st-verified)',
  gov_approved: 'var(--color-st-approved)',
  assigned: 'var(--color-st-assigned)',
  in_repair: 'var(--color-st-repair)',
  completed: 'var(--color-st-completed)',
  rejected: 'var(--color-st-rejected)',
}
export const statusColor = (s: Status) => STATUS_COLOR[s]

export function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_COLOR[status]
  return (
    <span className="inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-semibold"
      style={{ color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export function Chip({ active, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button aria-pressed={active}
      className={`h-9 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition ${active ? 'bg-fg text-ink-950' : 'border border-line text-muted hover:text-fg'}`}
      {...rest}>
      {children}
    </button>
  )
}

export const inputCls =
  'w-full rounded-xl border border-line-strong bg-ink-900/70 px-3 text-sm text-fg placeholder:text-muted/70 focus:border-cyan focus:outline-none'

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs text-st-rejected">{error}</span>}
    </label>
  )
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="num text-2xl font-bold leading-tight" style={tone ? { color: tone } : undefined}>{value}</p>
      <p className="truncate text-xs text-muted">{label}</p>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />
}

export function Empty({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-10 text-center">
      <p className="text-sm text-muted">{title}</p>
      {action}
    </div>
  )
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-st-rejected/40 bg-st-rejected/10 px-3 py-2 text-sm">
      <span>Could not load. {message}</span>
      {onRetry && <Button size="sm" variant="ghost" onClick={onRetry}>Retry</Button>}
    </div>
  )
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
}

/** Right-side panel on desktop, bottom sheet on phones. */
export function Sheet({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean
}) {
  useEscape(open, onClose)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) ref.current?.focus()
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-ink-950/60" onClick={onClose} />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`glass-strong absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl outline-none md:inset-y-3 md:left-auto md:right-3 md:max-h-none md:rounded-2xl ${wide ? 'md:w-[560px]' : 'md:w-[440px]'}`}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink-950/70" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="glass-strong relative w-full max-w-2xl rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-2">
          <h2 className="text-base font-semibold">{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="max-h-[80dvh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
