import type { Report, StatusEvent } from '../api'
import { formatDate, reportTitle } from '../labels'
import { StatusBadge } from './core'

export function ReportIdentity({ report, compact = false, className = '' }: { report: Report; compact?: boolean; className?: string }) {
  return <div className={`min-w-0 ${className}`}>
    <p className={`${compact ? 'type-label' : 'type-section'} break-words text-fg`}>{reportTitle(report)}</p>
    <time className="type-meta num text-muted" dateTime={report.created_at}>{formatDate(report.created_at)}</time>
  </div>
}

export function ReportTimeline({ timeline, showActor = false }: { timeline: StatusEvent[]; showActor?: boolean }) {
  if (!timeline.length) return <p className="type-meta text-muted">No status history yet.</p>
  return <ol aria-label="Report history" className="grid gap-3 border-l border-line pl-4">
    {timeline.map((event, index) => <li key={`${event.created_at}-${index}`} className="type-body">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={event.to_status} />
        <time className="type-meta num text-muted" dateTime={event.created_at}>{formatDate(event.created_at)}</time>
      </div>
      {showActor && <p className="type-meta mt-1 text-muted">{event.actor}</p>}
      {event.note && <p className="type-body mt-1 whitespace-pre-wrap break-words text-muted">{event.note}</p>}
    </li>)}
  </ol>
}
