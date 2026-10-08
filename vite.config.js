import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/TRABAJO-HITO-3/',
  plugins: [react()],
  server: {
    watch: { ignored: ['**/docs/**'] },
  },
})
