import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Azure Static Web Apps phục vụ site ở gốc domain. Trước đây là '/QLPK_FE/' vì deploy
  // bằng GitHub Pages; đổi lại thì `npm run deploy` (gh-pages) sẽ hỏng đường dẫn asset.
  base: '/',
})