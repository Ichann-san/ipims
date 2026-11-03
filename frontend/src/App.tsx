import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { getToken } from './api'
import DevUI from './pages/DevUI'
import Home from './pages/Home'
import MapPage from './pages/MapPage'
import Reports from './pages/Reports'
import Transparency from './pages/Transparency'
import Dashboard, { Login } from './pages/admin/Dashboard'
import Operations from './pages/admin/Operations'
import { AdminNavbar, PublicNavbar } from './ui/Navbar'

function PublicLayout() {
  const nav = useNavigate()
  return (
    <>
      <PublicNavbar onReport={() => nav('/laporan?buat=1')} />
      <main><Outlet /></main>
    </>
  )
}

function AdminLayout() {
  if (!getToken()) return <Navigate to="/admin/login" replace />
  return (
    <>
      <AdminNavbar />
      <main><Outlet /></main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="laporan" element={<Reports />} />
          <Route path="laporan/:code" element={<Reports />} />
          <Route path="peta" element={<MapPage />} />
          <Route path="transparansi" element={<Transparency />} />
          <Route path="dev/ui" element={<DevUI />} />
        </Route>
        <Route path="admin/login" element={<Login />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="laporan/:code" element={<Dashboard />} />
          <Route path="peta" element={<Operations />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
