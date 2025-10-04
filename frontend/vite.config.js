import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Use '/' for development, '/CrunchyRollAdvancedSearch/' for production
  base: mode === 'production' ? '/CrunchyRollAdvancedSearch/' : '/',
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
}))
