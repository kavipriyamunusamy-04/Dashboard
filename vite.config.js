import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Dashboard/', // Replace 'Dashboard' with your actual repo name
})
