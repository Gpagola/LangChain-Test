import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/sr/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5001'
    }
  }
}))
