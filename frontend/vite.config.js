import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5009,
    host: true,
    allowedHosts: [
      'dj.kmis.kr',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:15009',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:15009',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})