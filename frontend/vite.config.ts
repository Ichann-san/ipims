import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `vite --mode https` serves a self-signed certificate so phones on the LAN can use GPS
// (browsers only allow geolocation over HTTPS).
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === 'https' ? [basicSsl()] : [])],
  server: {
    host: true,
    port: 5288,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/media': 'http://127.0.0.1:8000',
    },
  },
}))
