import { PostNonToken } from '../helpers';
import url from '../url';
import type { CaptchaVerificationResponse } from '../types';

/**
 * Các bước được CAPTCHA bảo vệ (QLPK.DataBaseAccess/Constants/CaptchaPurposes.cs).
 * Backend từ chối purpose lạ, và khi kiểm tra thì so đúng purpose đã đăng ký — một token
 * lấy cho việc đăng ký không dùng được để đặt lịch.
 */
export const CAPTCHA_PURPOSE = {
  AppointmentBooking: 'appointment_booking',
  PatientRegistration: 'patient_registration',
  OtpResend: 'otp_resend',
  LoginAfterFailures: 'login_after_failures',
  PasswordReset: 'password_reset',
} as const;

export type CaptchaPurpose = (typeof CAPTCHA_PURPOSE)[keyof typeof CAPTCHA_PURPOSE];

/**
 * Đổi token của widget Turnstile lấy token xác minh ngắn hạn của backend, rồi gửi kèm
 * request được bảo vệ ở header X-Captcha-Token. Token đó dùng đúng một lần.
 */
export const apiVerifyCaptcha = (providerToken: string, purpose: CaptchaPurpose) =>
  PostNonToken<CaptchaVerificationResponse>(url.verifyCaptcha, {
    provider_token: providerToken,
    purpose,
  });
