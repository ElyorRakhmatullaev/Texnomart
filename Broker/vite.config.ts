import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Set by the GitHub Pages deploy workflow (e.g. '/Texnomart/broker/').
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@texnomart/ui': path.resolve(__dirname, '../packages/ui/src'),
      '@texnomart/shared': path.resolve(__dirname, '../packages/shared/src'),
    },
  },
})
