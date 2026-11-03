import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { getToken, setToken } from './api'
import { Login, ManageReport, NetworkPage, Queue, WeightsPage } from './pages/admin'
import { Home, MapPage, ReportDetailPage, ReportList, Transparency } from './pages/public'
import ReportFlow from './pages/ReportFlow'

const link = ({ isActive }: { isActive: boolean }) => (isActive ? 'font-semibold text-slate-900' : 'text-slate-600 hover:text-slate-900')

function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
          <NavLink to="/" className="mr-2 font-bold">IPIMS Kediri</NavLink>
          <NavLink to="/lapor" className={link}>Lapor</NavLink>
          <NavLink to="/laporan" className={link}>Laporan</NavLink>
          <NavLink to="/peta" className={link}>Peta</NavLink>
          <NavLink to="/transparansi" className={link}>Transparansi</NavLink>
          <NavLink to="/admin" className="ml-auto text-xs text-slate-500">Petugas</NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-4"><Outlet /></main>
      <footer className="mx-auto max-w-5xl px-4 pb-6 text-xs text-slate-400">
        Data peta © OpenStreetMap contributors (ODbL). Prototipe Lomba Kediri Cerdas 2026.
      </footer>
    </div>
  )
}

function AdminLayout() {
  const nav = useNavigate()
  if (!getToken()) return <Navigate to="/admin/login" replace />
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
          <span className="mr-2 font-bold">IPIMS · Petugas</span>
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'font-semibold' : 'text-slate-300')}>Antrian prioritas</NavLink>
          <NavLink to="/admin/jaringan" className={({ isActive }) => (isActive ? 'font-semibold' : 'text-slate-300')}>Jaringan & what-if</NavLink>
          <NavLink to="/admin/bobot" className={({ isActive }) => (isActive ? 'font-semibold' : 'text-slate-300')}>Bobot MCDM</NavLink>
          <NavLink to="/" className="text-slate-300">Situs publik</NavLink>
          <button className="ml-auto text-xs text-slate-300" onClick={() => { setToken(null); nav('/admin/login') }}>Keluar</button>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-4"><Outlet /></main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="lapor" element={<ReportFlow />} />
          <Route path="laporan" element={<ReportList />} />
          <Route path="laporan/:code" element={<ReportDetailPage />} />
          <Route path="peta" element={<MapPage />} />
          <Route path="transparansi" element={<Transparency />} />
        </Route>
        <Route path="admin/login" element={<Login />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Queue />} />
          <Route path="laporan/:code" element={<ManageReport />} />
          <Route path="bobot" element={<WeightsPage />} />
          <Route path="jaringan" element={<NetworkPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
