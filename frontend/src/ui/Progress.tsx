import { Check, X } from '@phosphor-icons/react'
import type { Status, StatusEvent } from '../api'
import { STATUS_LABEL, STATUS_SHORT_LABEL } from '../labels'

export const STAGES: Status[] = ['reported', 'ai_verified', 'gov_approved', 'assigned', 'in_repair', 'completed']
/** Six-stage tracker. Stages the report passed are filled; a skipped AI step stays hollow. */
export function StageTracker({ status, reached, compact = false }: { status: Status; reached?: Set<Status>; compact?: boolean }) {
  const current = status === 'rejected' ? -1 : STAGES.indexOf(status)
  return (
    <ol className="flex w-full min-w-0 items-center overflow-x-auto" aria-label={`Stage: ${STATUS_LABEL[status]}`}>
      {STAGES.map((s, i) => {
        const done = reached ? reached.has(s) : i <= current
        const isCurrent = i === current
        return (
          <li key={s} className="flex min-w-0 flex-1 items-center last:flex-none">
            <span className="flex flex-col items-center gap-1">
              <span
                className={`grid place-items-center rounded-full ${compact ? 'size-4' : 'size-6'} ${
                  done ? (isCurrent && s !== 'completed' ? 'bg-cyan text-ink-950' : 'bg-st-completed text-ink-950') : 'border border-line-strong'
                }`}>
                {done && !isCurrent && <Check size={compact ? 10 : 13} weight="bold" />}
                {isCurrent && s === 'completed' && <Check size={compact ? 10 : 13} weight="bold" />}
              </span>
              {!compact && <span title={STATUS_LABEL[s]} className={`type-caption ${isCurrent ? 'font-semibold text-fg' : 'text-muted'}`}>{STATUS_SHORT_LABEL[s]}</span>}
            </span>
            {i < STAGES.length - 1 && (
              <span className={`mx-1 h-px flex-1 ${compact ? '' : 'mb-5'} ${i < current ? 'bg-st-completed/70' : 'bg-line-strong'}`} />
            )}
          </li>
        )
      })}
      {status === 'rejected' && (
        <li className="ml-2 flex items-center gap-1 text-xs font-semibold text-st-rejected"><X size={14} weight="bold" />Rejected</li>
      )}
    </ol>
  )
}

export function reachedStages(timeline: StatusEvent[]): Set<Status> {
  return new Set(timeline.map((e) => e.to_status))
}
