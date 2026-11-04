import { pageNumbers } from '../reportPaging'
import { Button } from './core'

export function Pagination({ page, pageSize, total, loading = false, onChange }: {
  page: number; pageSize: number; total: number; loading?: boolean; onChange: (page: number) => void
}) {
  const last = Math.max(1, Math.ceil(total / pageSize))
  return <nav aria-label="Report pagination" className="flex flex-wrap items-center justify-between gap-2">
    <p className="num text-xs text-muted" role="status">{loading ? 'Loading reports…' : total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : '0 reports'}</p>
    <div className="flex flex-wrap items-center justify-center gap-1">
      <Button size="sm" onClick={() => onChange(page - 1)} disabled={loading || page <= 1}>Previous</Button>
      {pageNumbers(Math.min(page, last), last).map((p) => typeof p === 'string'
        ? <span key={p} className="px-1 text-muted" aria-hidden="true">…</span>
        : <button key={p} type="button" aria-label={`Page ${p}`} aria-current={p === page ? 'page' : undefined}
          disabled={loading} onClick={() => onChange(p)} className={`size-9 rounded-xl text-[13px] font-semibold disabled:opacity-40 ${p === page ? 'bg-blue text-white' : 'text-muted hover:bg-white/[0.06] hover:text-fg'}`}>{p}</button>)}
      <Button size="sm" onClick={() => onChange(page + 1)} disabled={loading || page >= last}>Next</Button>
    </div>
  </nav>
}
