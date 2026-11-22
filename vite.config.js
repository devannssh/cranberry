import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// /api goes to the Express server (cd server && npm run dev) so the session cookie stays same-origin.
export default defineConfig({ plugins: [react()], server: { proxy: { '/api': 'http://localhost:4000' } } })
