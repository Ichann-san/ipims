import { X } from '@phosphor-icons/react'
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import type { Status } from '../api'
import { STATUS_LABEL } from '../labels'

const focusCls = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950'
const interactionCls = `transition duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${focusCls}`

type Variant = 'primary' | 'secondary' | 'ghost' | 'blue'
const VARIANT: Record<Variant, string> = {
  primary: 'bg-coral text-white hover:brightness-110',
  blue: 'bg-blue text-white hover:brightness-110',
  secondary: 'border border-line-strong bg-white/[0.03] text-fg hover:bg-white/[0.07]',
  ghost: 'text-muted hover:bg-white/[0.06] hover:text-fg',
}

function buttonCls(variant: Variant, size: 'sm' | 'md', className: string) {
  return `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold ${interactionCls} ${size === 'sm' ? 'h-9 px-3 text-[13px]' : 'h-11 px-4 text-sm'} ${VARIANT[variant]} ${className}`
}

export function Button({ variant = 'secondary', size = 'md', icon, children, className = '', type, ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; icon?: ReactNode }) {
  return <button type={type} className={buttonCls(variant, size, className)} {...rest}>{icon}{children}</button>
}

export function ButtonLink({ variant = 'secondary', size = 'md', icon, children, className = '', ...rest }:
  LinkProps & { variant?: Variant; size?: 'sm' | 'md'; icon?: ReactNode }) {
  return <Link className={buttonCls(variant, size, className)} {...rest}>{icon}{children}</Link>
}

export function IconButton({ label, children, className = '', variant = 'ghost', size = 'md', type = 'button', ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: 'ghost' | 'dock' | 'pagination'; size?: 'sm' | 'md' }) {
  const shape = 'rounded-xl'
  const surface = variant === 'pagination' ? 'border border-line bg-white/[0.03]' : ''
  return <button type={type} aria-label={label} title={label}
    className={`inline-flex shrink-0 items-center justify-center text-muted hover:bg-white/[0.06] hover:text-fg ${interactionCls} ${size === 'sm' ? 'size-9' : 'size-11'} ${shape} ${surface} ${className}`} {...rest}>{children}</button>
}

export function Panel({ children, className = '', strong = false }: { children: ReactNode; className?: string; strong?: boolean }) {
  return <div className={`${strong ? 'glass-strong' : 'glass'} min-w-0 rounded-2xl ${className}`}>{children}</div>
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
    <span className="status-badge inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-semibold"
      style={{ color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export function Chip({ active, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button type="button" aria-pressed={active}
      className={`h-9 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium ${interactionCls} ${active ? 'bg-fg text-ink-950' : 'border border-line text-muted hover:text-fg'}`}
      {...rest}>
      {children}
    </button>
  )
}

/** Base classes stay height-free for existing multiline inputs. */
export const inputCls =
  'w-full rounded-xl border border-line-strong bg-ink-900/70 px-3 text-sm text-fg placeholder:text-muted/70 focus:border-cyan focus:outline-none disabled:opacity-40'

export function controlCls(size: 'sm' | 'md' = 'md') {
  return `${inputCls} ${size === 'sm' ? 'h-9 text-[13px]' : 'h-11'}`
}

export function SegmentedControl<T extends string>({ value, options, onChange, label = 'Select view', className = '' }: {
  value: T; options: readonly { value: T; label: ReactNode }[]; onChange: (value: T) => void; label?: string; className?: string
}) {
  return <div role="group" aria-label={label} className={`inline-flex flex-wrap gap-1 rounded-xl border border-line p-1 ${className}`}>
    {options.map((option) => <button key={option.value} type="button" aria-pressed={option.value === value}
      onClick={() => onChange(option.value)} className={`rounded-xl px-3 py-2 text-[13px] font-semibold ${interactionCls} ${option.value === value ? 'bg-fg text-ink-950' : 'text-muted hover:bg-white/[0.06] hover:text-fg'}`}>
      {option.label}
    </button>)}
  </div>
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="type-label text-muted">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs text-st-rejected">{error}</span>}
    </label>
  )
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="min-w-0 text-center">
      <p className="num text-2xl font-bold leading-tight" style={tone ? { color: tone } : undefined}>{value}</p>
      <p className="type-meta whitespace-normal text-muted">{label}</p>
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

export function ErrorNote({ message, onRetry, title = 'Could not load.', compact = false }: { message: string; onRetry?: () => void; title?: string; compact?: boolean }) {
  return (
    <div role="alert" className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-st-rejected/40 bg-st-rejected/10 px-3 py-2 ${compact ? 'type-meta' : 'type-body'}`}>
      <span><strong className="font-semibold">{title}</strong> {message}</span>
      {onRetry && <Button size="sm" variant="ghost" onClick={onRetry}>Retry</Button>}
    </div>
  )
}

type OverlayEntry = { element: HTMLDivElement; previous: HTMLElement | null }
const overlays: OverlayEntry[] = []
let bodyOverflow = ''
const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
function focusables(element: HTMLElement) {
  return [...element.querySelectorAll<HTMLElement>(focusableSelector)].filter((node) => node.getClientRects().length > 0 && !node.closest('[inert]') && node.getAttribute('aria-hidden') !== 'true')
}

/** Only the top dialog owns keyboard focus and Escape; all dialogs share one scroll lock. */
function useOverlay(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const element = ref.current
    if (!open || !element) return
    const entry = { element, previous: document.activeElement instanceof HTMLElement ? document.activeElement : null }
    if (!overlays.length) {
      bodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    // Child effects can mount before parents: keep containing dialogs below their children.
    const childIndex = overlays.findIndex((other) => element.contains(other.element))
    if (childIndex < 0) overlays.push(entry)
    else overlays.splice(childIndex, 0, entry)
    const isTop = () => overlays.at(-1) === entry
    const focusFirst = () => (element.querySelector<HTMLElement>('[data-initial-focus], [autofocus]') ?? focusables(element)[0] ?? element).focus()
    const frame = requestAnimationFrame(() => { if (isTop()) focusFirst() })
    const keydown = (event: KeyboardEvent) => {
      if (!isTop()) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        close.current()
      } else if (event.key === 'Tab') {
        const nodes = focusables(element)
        const first = nodes[0]
        const last = nodes.at(-1)
        if (!first) { event.preventDefault(); element.focus() }
        else if (event.shiftKey && (document.activeElement === first || !nodes.includes(document.activeElement as HTMLElement))) {
          event.preventDefault(); last?.focus()
        } else if (!event.shiftKey && (document.activeElement === last || !nodes.includes(document.activeElement as HTMLElement))) {
          event.preventDefault(); first.focus()
        }
      }
    }
    const focusin = (event: FocusEvent) => {
      if (isTop() && !element.contains(event.target as Node)) focusFirst()
    }
    document.addEventListener('keydown', keydown, true)
    document.addEventListener('focusin', focusin)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', keydown, true)
      document.removeEventListener('focusin', focusin)
      const wasTop = isTop()
      overlays.splice(overlays.indexOf(entry), 1)
      if (!overlays.length) document.body.style.overflow = bodyOverflow
      if (wasTop) {
        const parent = overlays.at(-1)?.element
        const target = entry.previous
        // A user may already have focused the newly revealed page before effect
        // cleanup runs. Do not steal that focus back to an old opener.
        const active = document.activeElement
        const needsReturn = !active || active === document.body || element.contains(active)
        if (needsReturn && target?.isConnected && (!parent || parent.contains(target))) target.focus()
        else if (needsReturn && parent) (focusables(parent)[0] ?? parent).focus()
      }
    }
  }, [open])
  return ref
}

/** Right-side panel on desktop, full-screen workspace on compact screens. */
export function Sheet({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean
}) {
  const ref = useOverlay(open, onClose)
  if (!open) return null
  return (
    <div className="overlay-root sheet-overlay fixed inset-0 z-40">
      <div className="absolute inset-0 bg-ink-950/60" onClick={onClose} />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`glass-strong sheet-panel absolute inset-x-0 flex flex-col rounded-t-2xl outline-none md:left-auto md:right-3 md:rounded-2xl ${wide ? 'md:w-[560px]' : 'md:w-[440px]'}`}>
        <div className="overlay-header flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2">
          <h2 className="type-dialog">{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="overlay-body min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useOverlay(open, onClose)
  if (!open) return null
  return (
    <div className="overlay-root modal-overlay fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink-950/70" onClick={onClose} />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="glass-strong modal-panel relative w-full max-w-2xl rounded-2xl">
        <div className="overlay-header flex shrink-0 items-center justify-between border-b border-line px-4 py-2">
          <h2 className="type-dialog">{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="overlay-body modal-content overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
