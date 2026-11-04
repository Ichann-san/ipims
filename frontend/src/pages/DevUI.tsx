import { Plus } from '@phosphor-icons/react'
import { useState } from 'react'
import type { ReportDetail, Status } from '../api'
import { STATUSES } from '../labels'
import { IMPACT_RAMP } from '../map/layers'
import { Button, ButtonLink, Chip, Empty, ErrorNote, Field, IconButton, Modal, Panel, SegmentedControl, Sheet, Skeleton, Stat, StatusBadge, controlCls, inputCls } from '../ui/core'
import { StageTracker, reachedStages } from '../ui/Progress'
import { ReportIdentity, ReportTimeline } from '../ui/ReportSummary'
import { MapDock } from '../map/MapDock'
import { Pagination } from '../ui/Pagination'

const SWATCHES = ['ink-950', 'ink-900', 'ink-800', 'ink-700', 'blue', 'blue-soft', 'cyan', 'coral', 'coral-soft', 'fg', 'muted']
const REPORT: ReportDetail = {
  code: 'IP-20261105-DEMO', created_at: '2026-11-05T02:00:00Z', updated_at: '2026-11-05T04:00:00Z',
  lat: -7.2575, lng: 112.7521, manual_pin: true, category: 'lampu_jalan', category_source: 'user',
  description: 'Illustrative report fixture for the component catalog.', photo_url: '', ai: null,
  segment: { id: 'demo-road', name: 'Example road', highway: 'residential', road_group: 'lingkungan', impact_score: 0 },
  snap_distance_m: 12, impact_score: null, priority_score: null, priority_breakdown: null,
  status: 'gov_approved', assigned_to: null, needs_review: false,
  timeline: [
    { from_status: null, to_status: 'reported', actor: 'Public reporter', note: null, created_at: '2026-11-05T02:00:00Z' },
    { from_status: 'reported', to_status: 'gov_approved', actor: 'Demo officer', note: 'Illustrative officer note. The AI step was skipped.', created_at: '2026-11-05T04:00:00Z' },
  ],
}

/** Deterministic design reference: no API requests or live report dependencies. */
export default function DevUI() {
  const [chip, setChip] = useState(true)
  const [view, setView] = useState('before')
  const [detailed, setDetailed] = useState(false)
  const [zoom, setZoom] = useState(12)
  const [page, setPage] = useState(1)
  const [sheet, setSheet] = useState(false)
  const [modal, setModal] = useState(false)
  const [retry, setRetry] = useState(0)
  return <div className="mx-auto page-content grid max-w-5xl grid-cols-1 gap-6 px-3 md:px-6">
    <h1 className="type-page">Design system</h1>
    <Panel className="grid gap-3 p-4">
      <h2 className="type-section">Typography</h2>
      <p className="type-page">Page title</p><p className="type-section">Section title</p><p className="type-dialog">Dialog title</p>
      <p className="type-body">Body text explains the report and its context.</p>
      <p className="type-label">Field or control label</p><p className="type-meta text-muted">Metadata - 5 Nov 2026</p>
      <p className="type-caption text-muted">Caption and supporting context</p>
    </Panel>
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{SWATCHES.map((swatch) => <div key={swatch} className="grid gap-1 type-meta">
      <span className="h-12 rounded-xl border border-line" style={{ background: `var(--color-${swatch})` }} /><span className="text-muted">{swatch}</span>
    </div>)}</div>
    <Panel className="grid gap-4 p-4">
      <h2 className="type-section">Buttons and selections</h2>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" icon={<Plus size={18} weight="bold" />}>Report</Button><Button variant="blue">Simulate</Button>
        <Button>Secondary</Button><Button variant="ghost">Ghost</Button><Button size="sm">Small</Button><Button disabled>Disabled</Button>
        <ButtonLink to="/laporan">Report link</ButtonLink><ButtonLink size="sm" variant="ghost" to="/peta">Map link</ButtonLink>
        <IconButton label="Add example"><Plus size={20} /></IconButton><IconButton label="Unavailable action" disabled><Plus size={20} /></IconButton>
        <IconButton label="Compact action" size="sm" variant="pagination"><Plus size={16} /></IconButton>
        <Chip active={chip} onClick={() => setChip(!chip)}>Active chip</Chip><Chip>Chip</Chip>
      </div>
      <SegmentedControl label="Scenario preview" value={view} onChange={setView} options={[{ value: 'before', label: 'Before' }, { value: 'after', label: 'After' }]} />
    </Panel>
    <div className="flex flex-wrap gap-2">{STATUSES.map((status) => <StatusBadge key={status} status={status} />)}</div>
    <Panel className="grid gap-4 p-4">
      <h2 className="type-section">Progress and metrics</h2>
      {(['ai_verified', 'in_repair', 'completed', 'rejected'] as Status[]).map((status) => <StageTracker key={status} status={status} />)}
      <StageTracker status={REPORT.status} reached={reachedStages(REPORT.timeline)} />
      <StageTracker status="assigned" compact />
      <div className="grid grid-cols-3 gap-4"><Stat label="Active reports" value={34} /><Stat label="Completed" value={12} tone="var(--color-st-completed)" /><Stat label="Median time to officer approval" value="27 h" /></div>
    </Panel>
    <Panel className="grid gap-4 p-4">
      <h2 className="type-section">Fields</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Category" hint="Default control size"><select className={controlCls()} defaultValue="Road"><option>Road</option><option>Street light</option></select></Field>
        <Field label="Compact field" hint="Explicit compact size"><input className={controlCls('sm')} placeholder="Report code" /></Field>
        <Field label="Note" error="A reason is required"><input className={controlCls()} aria-invalid="true" /></Field>
        <Field label="Unavailable field"><input className={controlCls()} disabled value="Disabled" readOnly /></Field>
        <Field label="Description"><textarea className={`${inputCls} py-2`} rows={3} placeholder="Describe the issue" /></Field>
      </div>
    </Panel>
    <Panel className="grid justify-items-start gap-3 p-4">
      <h2 className="type-section">Map controls</h2>
      <MapDock detailed={detailed} onToggle={() => setDetailed(!detailed)} onZoomIn={() => setZoom((value) => Math.min(19, value + 1))}
        onZoomOut={() => setZoom((value) => Math.max(10, value - 1))} onResetNorth={() => setZoom(12)} canZoomIn={zoom < 19} canZoomOut={zoom > 10} />
      <span className="num type-meta text-muted">Preview zoom {zoom}</span>
    </Panel>
    <Panel className="grid min-w-0 gap-4 p-4">
      <h2 className="type-section">Report metadata and history</h2>
      <p className="type-caption text-muted">Synthetic fixture. Coordinates and road are illustrative.</p>
      <ReportIdentity report={REPORT} /><ReportIdentity report={{ ...REPORT, segment: null }} compact />
      <ReportTimeline timeline={REPORT.timeline} showActor />
      <Pagination page={page} pageSize={9} total={27} onChange={setPage} />
    </Panel>
    <Panel className="grid gap-3 p-4">
      <h2 className="type-section">Overlays</h2><div className="flex flex-wrap gap-2"><Button onClick={() => setSheet(true)}>Open sheet</Button><Button onClick={() => setModal(true)}>Open modal</Button></div>
    </Panel>
    <Sheet open={sheet} onClose={() => setSheet(false)} title="Example sheet"><div className="grid gap-3"><Field label="Focus example"><input className={controlCls()} /></Field><Button onClick={() => setModal(true)}>Open nested modal</Button><Button onClick={() => setSheet(false)}>Close sheet</Button></div></Sheet>
    <Modal open={modal} onClose={() => setModal(false)} title="Example modal"><div className="grid gap-3"><Field label="Example input"><input className={controlCls()} /></Field><p className="type-body text-muted">Tab stays inside this dialog. Escape closes the top dialog and focus returns to its opener.</p><Button onClick={() => setModal(false)}>Close modal</Button></div></Modal>
    <div className="h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${IMPACT_RAMP.map(([, color]) => color).join(',')})` }} />
    <Panel className="grid gap-3 p-4">
      <h2 className="type-section">Loading, empty and error states</h2>
      <div role="status" aria-label="Loading example"><Skeleton className="h-20" /><span className="sr-only">Loading</span></div>
      <Empty title="No matching reports." />
      <ErrorNote message="Example connection error." onRetry={() => setRetry((value) => value + 1)} />
      <ErrorNote title="Could not submit report." message="Please try again." compact />
      <p className="type-meta text-muted" aria-live="polite">Example retries: {retry}</p>
    </Panel>
  </div>
}
