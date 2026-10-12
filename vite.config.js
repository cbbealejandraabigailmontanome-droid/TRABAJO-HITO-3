import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Use the site root locally and the repository path on GitHub Pages.
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/TRABAJO-HITO-3/',
  plugins: [react()],
}))
