/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Production builds: minify + no source maps (defense-in-depth).
// Full JS obfuscation is optional and can break React; keep minify-only for stability.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
  },
})
