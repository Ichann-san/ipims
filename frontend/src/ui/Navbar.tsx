import { ChartBar, ListBullets, MapTrifold, Plus, SignOut, SquaresFour, TreeStructure } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { setToken } from '../api'

function Mark() {
  return (
    <span className="flex items-center gap-2 pl-1 pr-2">
      <span className="grid size-8 place-items-center rounded-lg bg-coral text-white"><TreeStructure size={18} weight="bold" /></span>
      <span className="hidden leading-none sm:block">
        <span className="block text-sm font-bold tracking-tight">IPIMS</span>
        <span className="block text-[10px] font-medium text-muted">Surabaya</span>
      </span>
    </span>
  )
}

function Item({ to, icon, label, end }: { to: string; icon: ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} aria-label={label} title={label}
      className={({ isActive }) =>
        `flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-semibold transition ${isActive ? 'bg-white/[0.09] text-fg' : 'text-muted hover:text-fg'}`}>
      {icon}
      <span className="hidden md:inline">{label}</span>
    </NavLink>
  )
}

const shell = 'glass fixed left-1/2 top-3 z-30 flex w-[calc(100%-1.5rem)] max-w-max -translate-x-1/2 items-center gap-1 rounded-full p-1.5'

export function PublicNavbar({ onReport }: { onReport: () => void }) {
  return (
    <nav className={shell} aria-label="Navigasi utama">
      <NavLink to="/" aria-label="Beranda"><Mark /></NavLink>
      <Item to="/laporan" icon={<ListBullets size={18} />} label="Laporan" />
      <Item to="/peta" icon={<MapTrifold size={18} />} label="Peta" />
      <Item to="/transparansi" icon={<ChartBar size={18} />} label="Transparansi" />
      <button onClick={onReport}
        className="ml-1 flex h-10 items-center gap-1.5 rounded-full bg-coral px-4 text-[13px] font-semibold text-white transition hover:brightness-110 active:scale-[0.98]">
        <Plus size={16} weight="bold" /> Lapor
      </button>
    </nav>
  )
}

export function AdminNavbar() {
  const nav = useNavigate()
  return (
    <nav className={shell} aria-label="Navigasi petugas">
      <NavLink to="/admin" aria-label="Dasbor"><Mark /></NavLink>
      <Item to="/admin" end icon={<SquaresFour size={18} />} label="Dasbor" />
      <Item to="/admin/peta" icon={<MapTrifold size={18} />} label="Peta Operasi" />
      <button aria-label="Keluar" title="Keluar"
        onClick={() => { setToken(null); nav('/admin/login') }}
        className="flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-semibold text-muted hover:text-fg">
        <SignOut size={18} /><span className="hidden md:inline">Keluar</span>
      </button>
    </nav>
  )
}
