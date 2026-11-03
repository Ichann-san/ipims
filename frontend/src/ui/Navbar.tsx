import { ChartBar, ListBullets, MapTrifold, Plus, SignOut, SquaresFour, TreeStructure } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { setToken } from '../api'

function Mark() {
  return (
    <span className="flex items-center gap-2 pl-1 pr-2">
      <span className="grid size-10 place-items-center rounded-xl bg-coral text-white"><TreeStructure size={22} weight="bold" /></span>
      <span className="hidden leading-none sm:block">
        <span className="block text-base font-bold tracking-tight">IPIMS</span>
        <span className="block text-[11px] font-medium text-muted">Surabaya</span>
      </span>
    </span>
  )
}

function Item({ to, icon, label, end }: { to: string; icon: ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} aria-label={label} title={label}
      className={({ isActive }) =>
        `flex h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${isActive ? 'bg-white/[0.09] text-fg' : 'text-muted hover:text-fg'}`}>
      {icon}
      <span className="hidden md:inline">{label}</span>
    </NavLink>
  )
}

const shell = 'glass fixed left-1/2 top-3 z-30 flex w-[calc(100%-1.5rem)] max-w-max -translate-x-1/2 items-center gap-1 rounded-full p-2'

export function PublicNavbar({ onReport }: { onReport: () => void }) {
  return (
    <nav className={shell} aria-label="Main navigation">
      <NavLink to="/" aria-label="Home"><Mark /></NavLink>
      <Item to="/laporan" icon={<ListBullets size={20} />} label="Reports" />
      <Item to="/peta" icon={<MapTrifold size={20} />} label="Map" />
      <Item to="/transparansi" icon={<ChartBar size={20} />} label="Transparency" />
      <button onClick={onReport}
        className="ml-1 flex h-12 items-center gap-2 rounded-full bg-coral px-5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]">
        <Plus size={18} weight="bold" /> Report
      </button>
    </nav>
  )
}

export function AdminNavbar() {
  const nav = useNavigate()
  return (
    <nav className={shell} aria-label="Officer navigation">
      <NavLink to="/admin" aria-label="Dashboard"><Mark /></NavLink>
      <Item to="/admin" end icon={<SquaresFour size={20} />} label="Dashboard" />
      <Item to="/admin/peta" icon={<MapTrifold size={20} />} label="Operations map" />
      <button aria-label="Sign out" title="Sign out"
        onClick={() => { setToken(null); nav('/admin/login') }}
        className="flex h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold text-muted hover:text-fg">
        <SignOut size={20} /><span className="hidden md:inline">Sign out</span>
      </button>
    </nav>
  )
}
