import { Plus } from '@phosphor-icons/react'
import { useState } from 'react'
import type { Status } from '../api'
import { STATUSES } from '../labels'
import { IMPACT_RAMP } from '../map/layers'
import { Button, Chip, Empty, Field, Panel, Skeleton, Stat, StatusBadge, inputCls } from '../ui/core'
import { StageTracker } from '../ui/Progress'

const SWATCHES = ['ink-950', 'ink-900', 'ink-800', 'ink-700', 'blue', 'blue-soft', 'cyan', 'coral', 'coral-soft', 'fg', 'muted']

/** Design system reference for the team. */
export default function DevUI() {
  const [chip, setChip] = useState(true)
  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-3 pb-10 pt-20 md:px-6">
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
        <Button variant="primary" icon={<Plus size={18} weight="bold" />}>Lapor</Button>
        <Button variant="blue">Simulasi</Button>
        <Button>Sekunder</Button>
        <Button variant="ghost">Ghost</Button>
        <Button size="sm">Kecil</Button>
        <Chip active={chip} onClick={() => setChip(!chip)}>Chip aktif</Chip>
        <Chip>Chip</Chip>
      </div>
      <div className="flex flex-wrap gap-2">{STATUSES.map((s) => <StatusBadge key={s} status={s} />)}</div>
      <Panel className="grid gap-4 p-4">
        {(['ai_verified', 'in_repair', 'completed', 'rejected'] as Status[]).map((s) => <StageTracker key={s} status={s} />)}
        <StageTracker status="assigned" compact />
      </Panel>
      <Panel className="grid grid-cols-3 gap-4 p-4">
        <Stat label="Laporan aktif" value={34} />
        <Stat label="Selesai" value={12} tone="var(--color-st-completed)" />
        <Stat label="Median" value="27 j" />
      </Panel>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Kategori" hint="Diisi otomatis oleh AI"><input className={`${inputCls} h-11`} placeholder="Jalan" /></Field>
        <Field label="Keterangan" error="Wajib diisi saat menolak"><input className={`${inputCls} h-11`} /></Field>
      </div>
      <div className="h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${IMPACT_RAMP.map(([, c]) => c).join(',')})` }} />
      <div className="grid gap-2 md:grid-cols-2"><Skeleton className="h-20" /><Empty title="Kosong" /></div>
    </div>
  )
}
