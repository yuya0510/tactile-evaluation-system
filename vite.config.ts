import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/tactile-evaluation-system/', // ★この行を追加してください
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})