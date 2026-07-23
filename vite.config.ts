import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/fischer60/', // important for GitHub Pages (https://moadh704.github.io/fischer60/)
})
