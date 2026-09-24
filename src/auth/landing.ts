import type { AuthenticatedAccount } from '../api/session';
import { ROLE } from '../api/types';

/** Nơi mỗi vai trò được đưa tới sau khi đăng nhập. */
const LANDING_BY_ROLE: Record<string, string> = {
  // Bệnh nhân là vai trò duy nhất còn dùng trang chủ công khai; mọi vai trò khác vào
  // thẳng khu làm việc và bị `PublicSiteGuard` giữ ở đó.
  [ROLE.Patient]: '/',
  [ROLE.Doctor]: '/bac-si',
  [ROLE.Receptionist]: '/thu-ngan',
  [ROLE.Admin]: '/quan-tri',
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

  // Nơi họ định tới trước khi bị chặn lại.
  if (redirectTo && isRedirectAllowed(account, redirectTo)) {
    return redirectTo;
  }

  return (account && LANDING_BY_ROLE[account.role_code]) ?? '/';
}

const GUEST_PATHS = ['/login', '/dang-ky', '/quen-mat-khau'];

/** Các khu làm việc của nhân viên — mỗi vai trò chỉ thuộc về một khu. */
const STAFF_AREAS = ['/quan-tri', '/bac-si', '/thu-ngan'];

/**
 * `redirectTo` được ghi lại lúc phiên *trước* bị xoá (đăng xuất, hết hạn), nên có thể là
 * trang của một tài khoản khác: admin đăng xuất ở `/quan-tri/cai-dat`, lễ tân đăng nhập
 * tiếp thì bị đưa vào đó và chỉ thấy "Không có quyền truy cập". Chỉ tin nó khi nó nằm
 * trong khu của chính vai trò đang đăng nhập.
 */
function isRedirectAllowed(account: AuthenticatedAccount | null, redirectTo: string): boolean {
  if (GUEST_PATHS.includes(redirectTo)) {
    return false;
  }

  const area = STAFF_AREAS.find((prefix) => redirectTo === prefix || redirectTo.startsWith(`${prefix}/`));

  if (!area) {
    // Trang công khai, trang bệnh nhân, /thong-bao…: các guard khác đã lo.
    return true;
  }

  return !!account && LANDING_BY_ROLE[account.role_code] === area;
}
