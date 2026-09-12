/**
 * Tên các khoá trong localStorage. Gom về một chỗ để không có chuỗi nào bị gõ sai ở
 * nơi ghi rồi lệch với nơi đọc — cùng lý do dcv2 gom vào `app/assets/Key.js`.
 */
const KEY = {
  /** Access token JWT, interceptor đọc lại ở mỗi request. */
  ACCESS_TOKEN: 'qlpk_access_token',
  /** Refresh token, chỉ dùng cho /api/auth/refresh và /api/auth/logout. */
  REFRESH_TOKEN: 'qlpk_refresh_token',
  /** Bản sao `AuthenticatedAccount` để vẽ ngay khi mở lại tab, trước khi /me trả về. */
  ACCOUNT: 'qlpk_account',
} as const;

export default KEY;
