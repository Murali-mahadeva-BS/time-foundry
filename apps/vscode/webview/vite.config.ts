import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, '../dist/webview'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
  resolve: {
    alias: {
      // Platform overrides: VS Code's own timer + settings stores
      '@ui/stores/timer.store': path.resolve(__dirname, './src/timer-store.ts'),
      '@ui/stores/settings.store': path.resolve(__dirname, './src/settings.store.ts'),
      '@': path.resolve(__dirname, './src'),
      '@ui': path.resolve(__dirname, '../../../packages/ui/src'),
      '@time-foundry/core': path.resolve(__dirname, '../../../packages/core/src/index.ts'),
    },
  },
})
