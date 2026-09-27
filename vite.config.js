import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Repositorio GitHub Pages: github.com/<usuario>/SICE
  base: '/SICE/',
})
