import KEY from '../constants/storageKeys';
import { localStorageService, sessionStorageService } from '../services/localStorageService';

/** Đúng shape `AuthenticatedAccountResponse` của backend (snake_case trên dây). */
export interface AuthenticatedAccount {
  account_id: number;
  full_name: string;
  phone_number: string;
  role_code: string;
  role_name: string;
  permissions: string[];
  must_change_password: boolean;
}

/** Đúng shape `AuthTokenResponse` mà login / refresh / verify-registration trả về. */
export interface AuthTokens {
  access_token: string;
  expires_in_seconds: number;
  refresh_token: string;
  refresh_token_expires_at: string;
  account: AuthenticatedAccount;
}

/**
 * Phiên đăng nhập, tách khỏi React.
 *
 * Interceptor của axios cần đọc và ghi token nhưng chạy ngoài cây component, còn
 * AuthContext thì cần biết khi phiên chết để đưa người dùng về trang đăng nhập. Để
 * httpClient import AuthContext sẽ tạo vòng import; nên chỗ giao nhau đặt ở đây.
 *
 * Phiên nằm ở một trong hai kho tuỳ ô "Ghi nhớ": localStorage thì sống qua lần đóng
 * trình duyệt, sessionStorage thì chết theo tab. Mọi lượt đọc hỏi sessionStorage trước,
 * vì đăng nhập gần nhất mới là phiên đang dùng.
 */

let sessionExpiredHandler: (() => void) | null = null;

/** AuthContext đăng ký một lần lúc mount; gọi khi refresh token cũng đã hỏng. */
export function onSessionExpired(handler: () => void): void {
  sessionExpiredHandler = handler;
}

function read<T>(key: string): T | null {
  return sessionStorageService.getItem<T>(key) ?? localStorageService.getItem<T>(key);
}

export function getAccessToken(): string | null {
  return read<string>(KEY.ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  return read<string>(KEY.REFRESH_TOKEN);
}

export function getStoredAccount(): AuthenticatedAccount | null {
  return read<AuthenticatedAccount>(KEY.ACCOUNT);
}

/** Kho mà phiên hiện tại đang nằm, để refresh token ghi đè đúng chỗ. */
function activeStore() {
  return sessionStorageService.getItem<string>(KEY.ACCESS_TOKEN) !== null
    ? sessionStorageService
    : localStorageService;
}

/**
 * @param remember true thì phiên sống qua lần đóng trình duyệt. Bỏ trống khi ghi lại sau
 * một lần refresh — lúc đó giữ nguyên kho mà phiên đang nằm.
 */
export function saveSession(tokens: AuthTokens, remember?: boolean): void {
  const store = remember === undefined ? activeStore() : remember ? localStorageService : sessionStorageService;

  // Xoá ở kho kia trước, nếu không một phiên cũ còn sót lại sẽ bị `read` nhặt lên trước.
  clearSession();

  store.setItem(KEY.ACCESS_TOKEN, tokens.access_token);
  store.setItem(KEY.REFRESH_TOKEN, tokens.refresh_token);
  store.setItem(KEY.ACCOUNT, tokens.account);
}

export function saveAccount(account: AuthenticatedAccount): void {
  activeStore().setItem(KEY.ACCOUNT, account);
}

export function clearSession(): void {
  for (const key of [KEY.ACCESS_TOKEN, KEY.REFRESH_TOKEN, KEY.ACCOUNT]) {
    sessionStorageService.removeItem(key);
    localStorageService.removeItem(key);
  }
}

/** Xoá phiên rồi báo cho AuthContext. Gọi khi backend đã từ chối cả refresh token. */
export function expireSession(): void {
  clearSession();
  sessionExpiredHandler?.();
}
