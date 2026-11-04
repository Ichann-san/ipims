import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BRAND } from './brand'
import { applyStatusPalette } from './palette'

applyStatusPalette(document.documentElement)
document.title = BRAND.name

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
