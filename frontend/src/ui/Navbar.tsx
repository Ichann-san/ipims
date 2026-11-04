import { ChartBar, House, List, ListBullets, MapTrifold, Plus, SignOut, SquaresFour } from '@phosphor-icons/react'
import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { setToken } from '../api'
import { BRAND } from '../brand'
import { useCompactLayout } from '../responsive'
import { Button, ButtonLink, Sheet } from './core'

function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2 pl-1 pr-2">
      <img src="/favicon.svg" alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
      <span className={compact ? 'navbar-brand-text leading-none' : 'hidden leading-none sm:block'}>
        <span className="block text-base font-bold tracking-tight">{BRAND.shortName}</span>
      </span>
    </span>
  )
}

function Item({ to, icon, label, end, compact = false, onSelect }: { to: string; icon: ReactNode; label: string; end?: boolean; compact?: boolean; onSelect?: () => void }) {
  return (
    <NavLink to={to} end={end} aria-label={label} title={label} onClick={onSelect}
      className={({ isActive }) =>
        `${compact ? 'navbar-menu-link flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold' : 'flex size-11 shrink-0 items-center justify-center gap-2 rounded-full text-sm font-semibold transition md:h-12 md:w-auto md:px-4'} ${isActive ? 'bg-white/[0.09] text-fg' : 'text-muted hover:text-fg'}`}>
      {icon}
      <span className={compact ? '' : 'hidden md:inline'}>{label}</span>
    </NavLink>
  )
}

const shell = (compact: boolean) => `site-navbar glass fixed z-30 flex items-center gap-1 p-2 ${compact ? 'compact-navbar' : 'left-1/2 top-3 w-[calc(100%-1.5rem)] max-w-max -translate-x-1/2 rounded-full'}`

function useNavigationMenu() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => { setOpen(false) }, [location.key])
  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('popstate', close)
    return () => window.removeEventListener('popstate', close)
  }, [])
  return { open, setOpen }
}

export function PublicNavbar({ onReport }: { onReport: () => void }) {
  const compact = useCompactLayout()
  const { open, setOpen } = useNavigationMenu()
  const close = () => setOpen(false)
  return (
    <>
      <nav className={shell(compact)} aria-label="Main navigation">
        <NavLink className="navbar-brand" to="/" aria-label="Home" title={BRAND.name}><Mark compact={compact} /></NavLink>
        {!compact && <>
          <Item to="/laporan" icon={<ListBullets size={20} />} label="Reports" />
          <Item to="/peta" icon={<MapTrifold size={20} />} label="Map" />
          <Item to="/transparansi" icon={<ChartBar size={20} />} label="Transparency" />
        </>}
        <Button variant="primary" aria-label="Report" onClick={onReport} icon={<Plus size={18} weight="bold" />}
          className="navbar-report ml-1 !h-12 !rounded-full !px-3 sm:!px-5"><span className="navbar-report-label">Report</span></Button>
        {compact && <Button className="navbar-menu-button" variant="ghost" icon={<List size={20} />} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>Menu</Button>}
      </nav>
      <Sheet open={compact && open} onClose={close} title="Menu">
        <div className="navbar-menu-links grid gap-2">
          <Item compact to="/" end icon={<House size={20} />} label="Home" onSelect={close} />
          <Item compact to="/laporan" icon={<ListBullets size={20} />} label="Reports" onSelect={close} />
          <Item compact to="/peta" icon={<MapTrifold size={20} />} label="Map" onSelect={close} />
          <Item compact to="/transparansi" icon={<ChartBar size={20} />} label="Transparency" onSelect={close} />
        </div>
      </Sheet>
    </>
  )
}

export function AdminNavbar() {
  const nav = useNavigate()
  const compact = useCompactLayout()
  const { open, setOpen } = useNavigationMenu()
  const close = () => setOpen(false)
  const signOut = () => { close(); setToken(null); nav('/admin/login') }
  const signOutButton = <button aria-label="Sign out" title="Sign out" onClick={signOut}
    className="flex h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold text-muted hover:text-fg">
    <SignOut size={20} /><span className={compact ? '' : 'hidden md:inline'}>Sign out</span>
  </button>
  return (
    <>
      <nav className={shell(compact)} aria-label="Officer navigation">
        <NavLink className="navbar-brand" to="/admin" aria-label="Dashboard"><Mark compact={compact} /></NavLink>
        {compact ? <>
          <ButtonLink className="navbar-primary-action" to="/admin/peta" aria-label="Operations map" variant="primary">Map</ButtonLink>
          <Button className="navbar-menu-button" variant="ghost" icon={<List size={20} />} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>Menu</Button>
        </> : <>
          <Item to="/admin" end icon={<SquaresFour size={20} />} label="Dashboard" />
          <Item to="/admin/peta" icon={<MapTrifold size={20} />} label="Operations map" />
          {signOutButton}
        </>}
      </nav>
      <Sheet open={compact && open} onClose={close} title="Officer menu">
        <div className="navbar-menu-links grid gap-2">
          <Item compact to="/admin" end icon={<SquaresFour size={20} />} label="Dashboard" onSelect={close} />
          <Item compact to="/admin/peta" icon={<MapTrifold size={20} />} label="Operations map" onSelect={close} />
          {signOutButton}
        </div>
      </Sheet>
    </>
  )
}
