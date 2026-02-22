import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy Node.js API locally
      '/api/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy Django Chat HTTP requests locally
      '/api/chat': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // Proxy Django WebSockets locally
      '/ws/chat': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})