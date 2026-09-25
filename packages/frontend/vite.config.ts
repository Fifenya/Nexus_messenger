import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backend = { target: 'http://localhost:3000', changeOrigin: true }

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      // Веб-фронт ходит с префиксом /api
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Мобильное приложение ходит без префикса
      '/auth': backend,
      '/users': backend,
      '/chats': backend,
      '/messages': backend,
      '/bots': backend,
      '/botapi': backend,
      '/motes': backend,
      '/themes': backend,
      '/privacy': backend,
      '/uploads': backend,
      '/socket.io': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
    },
  },
})
