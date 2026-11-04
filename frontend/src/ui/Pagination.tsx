import { pageNumbers } from '../reportPaging'
import { Button, IconButton } from './core'

export function Pagination({ page, pageSize, total, loading = false, compact = false, onChange }: {
  page: number; pageSize: number; total: number | null; loading?: boolean; compact?: boolean; onChange: (page: number) => void
}) {
  const last = Math.max(1, Math.ceil((total ?? 0) / pageSize))
  if (compact) return <nav aria-label="Report pagination" className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
    <Button className="!px-3" onClick={() => onChange(page - 1)} disabled={loading || total === null || page <= 1}>Previous</Button>
    <p className="num type-meta text-center text-muted" role="status">{loading ? 'Loading...' : total === null ? 'Unavailable' : `Page ${Math.min(page, last)} of ${last}`}</p>
    <Button className="!px-3" onClick={() => onChange(page + 1)} disabled={loading || total === null || page >= last}>Next</Button>
  </nav>
  return <nav aria-label="Report pagination" className="flex flex-wrap items-center justify-between gap-2">
    <p className="num type-meta text-muted" role="status">{loading ? 'Loading reports…' : total === null ? 'Pagination unavailable' : total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : '0 reports'}</p>
    <div className="flex flex-wrap items-center justify-center gap-1">
      <Button size="sm" onClick={() => onChange(page - 1)} disabled={loading || page <= 1}>Previous</Button>
      {pageNumbers(Math.min(page, last), last).map((p) => typeof p === 'string'
        ? <span key={p} className="px-1 text-muted" aria-hidden="true">…</span>
        : <IconButton key={p} variant="pagination" size="sm" label={`Page ${p}`} aria-current={p === page ? 'page' : undefined}
          disabled={loading} onClick={() => onChange(p)} className={p === page ? 'bg-blue !text-white' : ''}>{p}</IconButton>)}
      <Button size="sm" onClick={() => onChange(page + 1)} disabled={loading || page >= last}>Next</Button>
    </div>
  </nav>
}
