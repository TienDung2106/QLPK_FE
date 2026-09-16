/**
 * Backend mà bản build này gọi tới.
 *
 * Cả hai đường dẫn luôn được khai báo trong `.env`; `VITE_API_TARGET` chỉ chọn một. Nhờ vậy
 * đổi qua lại giữa Azure và máy mình không bao giờ phải sửa URL (xem .env, `npm run dev:local`).
 * Vite thay import.meta.env lúc build, nên giá trị cố định trong bundle.
 */

export type ApiTarget = 'server' | 'local';

const env = import.meta.env;

export const API_TARGET: ApiTarget = env.VITE_API_TARGET === 'local' ? 'local' : 'server';

const DEFAULT_ROOT: Record<ApiTarget, string> = {
  server: 'https://app-qlpk-hoangqlpk97.azurewebsites.net/api',
  local: 'http://localhost:5131/api',
};

// Test key luôn-pass của Cloudflare, khớp test secret backend dùng ở Development.
const TEST_SITE_KEY = '1x00000000000000000000AA';

// VITE_API_ROOT / VITE_TURNSTILE_SITE_KEY là kiểu khai báo cũ; còn đặt thì vẫn thắng, để một
// file .env.*.local cũ trên máy ai đó không âm thầm đổi hướng.
const rawRoot =
  env.VITE_API_ROOT ||
  (API_TARGET === 'local' ? env.VITE_API_ROOT_LOCAL : env.VITE_API_ROOT_SERVER) ||
  DEFAULT_ROOT[API_TARGET];

// Chịu được dấu / thừa ở cuối, vì gõ thêm một dấu / vào file .env là lỗi rất dễ mắc
// mà biểu hiện lại là 404 ở mọi request.
export const API_ROOT: string = rawRoot.replace(/\/+$/, '');

export const TURNSTILE_SITE_KEY: string =
  env.VITE_TURNSTILE_SITE_KEY ||
  (API_TARGET === 'local' ? env.VITE_TURNSTILE_SITE_KEY_LOCAL : env.VITE_TURNSTILE_SITE_KEY_SERVER) ||
  TEST_SITE_KEY;

/** Nhãn ngắn cho badge ở khu nhân viên. */
export const API_TARGET_LABEL = API_TARGET === 'local' ? 'Local' : 'Azure';
