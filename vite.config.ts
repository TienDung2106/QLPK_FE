import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Bản build production gọi Azure mà thiếu site key thì apiTarget.ts âm thầm rơi về test key
  // luôn-pass, và CAPTCHA thật hỏng. Chặn ngay lúc build thay vì để lộ ra trên production.
  if (command === 'build' && mode === 'production') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    const key =
      env.VITE_API_TARGET === 'local'
        ? null
        : env.VITE_TURNSTILE_SITE_KEY || env.VITE_TURNSTILE_SITE_KEY_SERVER
    if (key !== null && (!key || key.startsWith('1x0000') || key.startsWith('2x0000') || key.startsWith('3x0000'))) {
      throw new Error('VITE_TURNSTILE_SITE_KEY_SERVER chưa đặt hoặc đang là test key của Cloudflare.')
    }
  }

  return {
    plugins: [react()],
    // Azure Static Web Apps phục vụ site ở gốc domain. Trước đây là '/QLPK_FE/' vì deploy
    // bằng GitHub Pages; đổi lại thì `npm run deploy` (gh-pages) sẽ hỏng đường dẫn asset.
    base: '/',
  }
})
