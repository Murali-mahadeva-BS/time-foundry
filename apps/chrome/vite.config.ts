import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      // Platform overrides: Chrome's own timer + settings stores
      '@ui/stores/timer.store': path.resolve(__dirname, './src/stores/timer.store'),
      '@ui/stores/settings.store': path.resolve(__dirname, './src/stores/settings.store'),
      '@': path.resolve(__dirname, './src'),
      '@time-foundry/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
})
