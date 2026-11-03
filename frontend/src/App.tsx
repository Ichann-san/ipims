import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { getToken } from './api'
import { AdminNavbar, PublicNavbar } from './ui/Navbar'

// Pages load on demand so the map library does not delay the first paint.
const Home = lazy(() => import('./pages/Home'))
const Reports = lazy(() => import('./pages/Reports'))
const MapPage = lazy(() => import('./pages/MapPage'))
const Transparency = lazy(() => import('./pages/Transparency'))
const DevUI = lazy(() => import('./pages/DevUI'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Login = lazy(() => import('./pages/admin/Dashboard').then((m) => ({ default: m.Login })))
const Operations = lazy(() => import('./pages/admin/Operations'))

function PublicLayout() {
  const nav = useNavigate()
  return (
    <>
      <PublicNavbar onReport={() => nav('/laporan?buat=1')} />
      <main><Suspense fallback={null}><Outlet /></Suspense></main>
    </>
  )
}

function AdminLayout() {
  if (!getToken()) return <Navigate to="/admin/login" replace />
  return (
    <>
      <AdminNavbar />
      <main><Suspense fallback={null}><Outlet /></Suspense></main>
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
        <Route path="admin/login" element={<Suspense fallback={null}><Login /></Suspense>} />
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
