import type { AuthenticatedAccount } from '../api/session';
import { ROLE } from '../api/types';

/** Nơi mỗi vai trò được đưa tới sau khi đăng nhập. */
const LANDING_BY_ROLE: Record<string, string> = {
  [ROLE.Patient]: '/lich-hen-cua-toi',
  [ROLE.Doctor]: '/',
  [ROLE.Receptionist]: '/',
  [ROLE.Pharmacist]: '/',
  [ROLE.Admin]: '/',
};

/**
 * Trang mà một người vừa đăng nhập nên nhìn thấy.
 *
 * Chỉ có một nơi quyết định việc này, và đó là `GuestGuard` — nếu trang đăng nhập tự gọi
 * navigate sau khi lưu phiên thì hai bên sẽ tranh nhau: guard nhìn thấy `isAuthenticated`
 * bật lên và chuyển hướng ngay ở lượt render kế tiếp, đè lên đích mà trang vừa chọn.
 */
export function resolveLandingPath(
  account: AuthenticatedAccount | null,
  redirectTo?: string,
): string {
  // Token lúc này mang danh sách quyền rỗng, nên mọi trang khác chỉ trả về 403.
  if (account?.must_change_password) {
    return '/doi-mat-khau';
  }

  // Nơi họ định tới trước khi bị chặn lại; bỏ qua nếu chính nó là một trang khách.
  if (redirectTo && !['/login', '/dang-ky', '/quen-mat-khau'].includes(redirectTo)) {
    return redirectTo;
  }

  return (account && LANDING_BY_ROLE[account.role_code]) ?? '/';
}
