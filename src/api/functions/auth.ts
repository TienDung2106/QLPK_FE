import { GetData, PostData, PostNonToken, PostWithCaptcha } from '../helpers';
import url from '../url';
import type { AuthTokens, AuthenticatedAccount } from '../session';
import type { OtpChallengeResponse } from '../types';

export interface LoginPayload {
  /** Số điện thoại hoặc email — backend nhận cả hai (LoginRequest.Login). */
  login: string;
  password: string;
  device_info?: string;
}

export interface RegisterPayload {
  phone_number: string;
  email: string;
  password: string;
  full_name: string;
  date_of_birth?: string | null;
  gender?: string | null;
}

/**
 * Đăng nhập. `captchaToken` chỉ cần từ lần sai thứ N trở đi — backend bật yêu cầu này
 * theo setting captcha_after_failed_login_attempts, nên phía này cứ gửi null cho tới khi
 * nhận được lỗi đòi CAPTCHA.
 */
export const apiLogin = (payload: LoginPayload, captchaToken: string | null = null) =>
  PostWithCaptcha<AuthTokens>(url.login, payload, captchaToken, { skipAuth: true });

export const apiRefresh = (refreshToken: string) =>
  PostNonToken<AuthTokens>(url.refresh, { refresh_token: refreshToken });

export const apiLogout = (refreshToken: string, allDevices = false) =>
  PostNonToken<void>(url.logout, { refresh_token: refreshToken, all_devices: allDevices });

export const apiGetMe = () => GetData<AuthenticatedAccount>(url.me);

export const apiChangePassword = (currentPassword: string, newPassword: string) =>
  PostData<void>(url.changePassword, {
    current_password: currentPassword,
    new_password: newPassword,
  });

/** Bước 1 của tự đăng ký: gửi mã về email, chưa tạo tài khoản nào cả. */
export const apiRegister = (payload: RegisterPayload, captchaToken: string | null) =>
  PostWithCaptcha<OtpChallengeResponse>(url.register, payload, captchaToken, { skipAuth: true });

/** Bước 2: đúng mã thì tài khoản được tạo và đăng nhập luôn. */
export const apiVerifyRegistration = (destination: string, code: string, deviceInfo?: string) =>
  PostNonToken<AuthTokens>(url.verifyRegistration, {
    destination,
    code,
    device_info: deviceInfo,
  });

export const apiResendRegistrationOtp = (destination: string, captchaToken: string | null) =>
  PostWithCaptcha<OtpChallengeResponse>(
    url.resendRegistrationOtp,
    { destination },
    captchaToken,
    { skipAuth: true },
  );

/** Bước 1 của quên mật khẩu. Email không tồn tại cũng trả về y hệt, không báo gì khác. */
export const apiForgotPassword = (destination: string, captchaToken: string | null) =>
  PostWithCaptcha<OtpChallengeResponse>(
    url.forgotPassword,
    { destination },
    captchaToken,
    { skipAuth: true },
  );

/** Bước 2: đặt mật khẩu mới. Trả 204, và thu hồi mọi phiên đang mở của tài khoản. */
export const apiResetPassword = (destination: string, code: string, newPassword: string) =>
  PostNonToken<void>(url.resetPassword, {
    destination,
    code,
    new_password: newPassword,
  });
