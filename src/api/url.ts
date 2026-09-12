/**
 * Toàn bộ endpoint của QLPK API, gom về một file như `app/apis/url.js` bên dcv2.
 * Không nơi nào khác trong ứng dụng được ghép URL bằng tay.
 */

// Vite thay thế import.meta.env lúc build, nên giá trị này cố định trong bundle.
// Xem .env.development / .env.production.
const rawRoot = import.meta.env.VITE_API_ROOT || 'http://localhost:5131/api';

// Chịu được dấu / thừa ở cuối, vì gõ thêm một dấu / vào file .env là lỗi rất dễ mắc
// mà biểu hiện lại là 404 ở mọi request.
const root = rawRoot.replace(/\/+$/, '');

export const API_ROOT = root;

const url = {
  // Auth (chương 10.4)
  login: `${root}/auth/login`,
  refresh: `${root}/auth/refresh`,
  logout: `${root}/auth/logout`,
  me: `${root}/auth/me`,
  changePassword: `${root}/auth/change-password`,
  register: `${root}/auth/register`,
  verifyRegistration: `${root}/auth/verify-registration`,
  resendRegistrationOtp: `${root}/auth/resend-registration-otp`,
  forgotPassword: `${root}/auth/forgot-password`,
  resetPassword: `${root}/auth/reset-password`,

  // Chống bot (UC-04-CAPTCHA)
  verifyCaptcha: `${root}/captcha/verify`,

  // Danh mục
  doctors: `${root}/doctors`,
  doctorAvailableSlots: (doctorId: number) => `${root}/doctors/${doctorId}/available-slots`,
  services: `${root}/services`,

  // Khu tự phục vụ của bệnh nhân
  patientProfile: `${root}/patient/profile`,
  patientProfileById: (patientId: number) => `${root}/patient/profile/${patientId}`,
  patientAppointments: `${root}/patient/appointments`,
  patientAppointmentById: (appointmentId: number) => `${root}/patient/appointments/${appointmentId}`,
  cancelAppointment: (appointmentId: number) => `${root}/patient/appointments/${appointmentId}/cancel`,
  checkIn: `${root}/patient/appointments/check-in`,
};

export default url;
