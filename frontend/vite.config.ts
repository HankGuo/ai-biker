import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const frontendPort = Number(process.env.FRONTEND_PORT || 26528)
const backendPort = Number(process.env.BACKEND_PORT || process.env.PORT || 26529)
const apiTarget = process.env.VITE_API_TARGET || `http://localhost:${backendPort}`

export default defineConfig({
  plugins: [react()],
  server: {
    port: frontendPort,
    strictPort: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
