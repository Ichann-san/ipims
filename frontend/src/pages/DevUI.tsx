import { Plus } from '@phosphor-icons/react'
import { useState } from 'react'
import { api, type Status } from '../api'
import { useAsync } from '../hooks'
import { STATUSES } from '../labels'
import { IMPACT_RAMP } from '../map/layers'
import { Button, Chip, Empty, Field, Panel, Skeleton, Stat, StatusBadge, inputCls } from '../ui/core'
import { StageTracker } from '../ui/Progress'
import { MapDock } from '../map/MapDock'
import { Pagination } from '../ui/Pagination'
import { ReportRow } from './Reports'

const SWATCHES = ['ink-950', 'ink-900', 'ink-800', 'ink-700', 'blue', 'blue-soft', 'cyan', 'coral', 'coral-soft', 'fg', 'muted']

/** Design system reference for the team. */
export default function DevUI() {
  const [chip, setChip] = useState(true)
  const [detailed, setDetailed] = useState(false)
  const [zoom, setZoom] = useState(12)
  const [page, setPage] = useState(1)
  const reports = useAsync((signal) => api.listReports({ limit: 1 }, signal), [])
  return (
    <div className="mx-auto page-content grid grid-cols-1 max-w-5xl gap-6 px-3 md:px-6">
      <h1 className="text-2xl font-bold">Design system</h1>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {SWATCHES.map((s) => (
          <div key={s} className="grid gap-1 text-xs">
            <span className="h-12 rounded-xl border border-line" style={{ background: `var(--color-${s})` }} />
            <span className="text-muted">{s}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" icon={<Plus size={18} weight="bold" />}>Report</Button>
        <Button variant="blue">Simulate</Button>
        <Button>Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button size="sm">Small</Button>
        <Chip active={chip} onClick={() => setChip(!chip)}>Active chip</Chip>
        <Chip>Chip</Chip>
      </div>
      <div className="flex flex-wrap gap-2">{STATUSES.map((s) => <StatusBadge key={s} status={s} />)}</div>
      <Panel className="grid gap-4 p-4">
        {(['ai_verified', 'in_repair', 'completed', 'rejected'] as Status[]).map((s) => <StageTracker key={s} status={s} />)}
        <StageTracker status="assigned" compact />
      </Panel>
      <Panel className="grid grid-cols-3 gap-4 p-4">
        <Stat label="Active reports" value={34} />
        <Stat label="Completed" value={12} tone="var(--color-st-completed)" />
        <Stat label="Median" value="27 h" />
      </Panel>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Category" hint="Filled in by AI"><input className={`${inputCls} h-11`} placeholder="Road" /></Field>
        <Field label="Note" error="Required to reject"><input className={`${inputCls} h-11`} /></Field>
      </div>
      <Panel className="grid justify-items-start gap-3 p-4">
        <h2 className="text-sm font-semibold">Map controls</h2>
        <MapDock detailed={detailed} onToggle={() => setDetailed(!detailed)} onZoomIn={() => setZoom((z) => Math.min(19, z + 1))}
          onZoomOut={() => setZoom((z) => Math.max(10, z - 1))} onResetNorth={() => setZoom(12)} canZoomIn={zoom < 19} canZoomOut={zoom > 10} />
        <span className="num text-xs text-muted">Preview zoom {zoom}</span>
      </Panel>
      <Panel className="grid min-w-0 gap-3 p-4">
        <h2 className="text-sm font-semibold">Report card and pagination</h2>
        {reports.data?.items[0] && <ReportRow report={reports.data.items[0]} />}
        <Pagination page={page} pageSize={9} total={reports.data?.total ?? 0} onChange={setPage} />
      </Panel>
      <div className="h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${IMPACT_RAMP.map(([, c]) => c).join(',')})` }} />
      <div className="grid gap-2 md:grid-cols-2"><Skeleton className="h-20" /><Empty title="Empty" /></div>
    </div>
  )
}
