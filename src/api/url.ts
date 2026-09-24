/**
 * Toàn bộ endpoint của QLPK API, gom về một file như `app/apis/url.js` bên dcv2.
 * Không nơi nào khác trong ứng dụng được ghép URL bằng tay.
 */

import { API_ROOT } from './apiTarget';

// Azure hay localhost do VITE_API_TARGET quyết định — xem apiTarget.ts và .env.
const root = API_ROOT;

export { API_ROOT };

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
  doctorCalendar: (doctorId: number) => `${root}/doctors/${doctorId}/calendar-availability`,
  doctorAlternatives: `${root}/doctors/alternatives`,
  services: `${root}/services`,
  bookingQuote: `${root}/booking/quote`,
  bookingPromotions: `${root}/booking/promotions`,

  // Khu tự phục vụ của bệnh nhân
  patientProfile: `${root}/patient/profile`,
  patientProfileById: (patientId: number) => `${root}/patient/profile/${patientId}`,
  patientAppointments: `${root}/patient/appointments`,
  patientAppointmentById: (appointmentId: number) => `${root}/patient/appointments/${appointmentId}`,
  cancelAppointment: (appointmentId: number) => `${root}/patient/appointments/${appointmentId}/cancel`,
  patientAppointmentAttachments: (appointmentId: number) => `${root}/patient/appointments/${appointmentId}/attachments`,
  patientAppointmentAction: (appointmentId: number, action: 'accept-reschedule' | 'choose-slot') =>
    `${root}/patient/appointments/${appointmentId}/${action}`,

  // Thông báo — mọi tài khoản đã đăng nhập, kể cả nhân viên, dù nằm dưới /patient.
  notifications: `${root}/patient/notifications`,
  notificationsUnreadCount: `${root}/patient/notifications/unread-count`,
  notificationRead: (notificationId: number) => `${root}/patient/notifications/${notificationId}/read`,
  notificationsReadAll: `${root}/patient/notifications/read-all`,

  // ---- Khu nhân viên --------------------------------------------------------------

  // Quản trị (admin)
  adminStaffAccounts: `${root}/admin/staff-accounts`,
  adminStaffAccountById: (accountId: number) => `${root}/admin/staff-accounts/${accountId}`,
  adminStaffAccountStatus: (accountId: number) => `${root}/admin/staff-accounts/${accountId}/status`,
  adminServices: `${root}/admin/services`,
  adminServiceById: (serviceId: number) => `${root}/admin/services/${serviceId}`,
  adminServiceStatus: (serviceId: number) => `${root}/admin/services/${serviceId}/status`,
  adminPromotions: `${root}/admin/promotions`,
  adminPromotionById: (promotionId: number) => `${root}/admin/promotions/${promotionId}`,
  adminPromotionStatus: (promotionId: number) => `${root}/admin/promotions/${promotionId}/status`,
  adminSettingByKey: (settingKey: string) => `${root}/admin/settings/${encodeURIComponent(settingKey)}`,
  adminStaffAccountResetPassword: (accountId: number) => `${root}/admin/staff-accounts/${accountId}/reset-password`,
  adminAppointmentReport: `${root}/admin/reports/appointments`,
  adminAppointmentReportExport: `${root}/admin/reports/appointments/export`,
  adminDoctorSchedules: (doctorId: number) => `${root}/admin/doctors/${doctorId}/schedules`,
  adminDoctorScheduleById: (doctorId: number, scheduleId: number) => `${root}/admin/doctors/${doctorId}/schedules/${scheduleId}`,
  adminDoctorScheduleStatus: (doctorId: number, scheduleId: number) =>
    `${root}/admin/doctors/${doctorId}/schedules/${scheduleId}/status`,
  adminClinicProfile: `${root}/admin/clinic/profile`,
  adminClinicHolidays: `${root}/admin/clinic/holidays`,
  adminClinicHolidayById: (holidayId: number) => `${root}/admin/clinic/holidays/${holidayId}`,
  adminClinicSettings: `${root}/admin/clinic/settings`,
  adminSpecialties: `${root}/admin/specialties`,
  adminSpecialtyById: (specialtyId: number) => `${root}/admin/specialties/${specialtyId}`,

  // Bác sĩ
  doctorAppointments: `${root}/doctor/appointments`,
  doctorDashboard: `${root}/doctor/dashboard`,
  doctorAppointmentAction: (appointmentId: number, action: 'confirm' | 'decline' | 'complete' | 'follow-up') =>
    `${root}/doctor/appointments/${appointmentId}/${action}`,
  doctorWorkingHours: `${root}/doctor/working-hours`,
  doctorTimeOffById: (timeOffId: number) => `${root}/doctor/time-off/${timeOffId}`,
  doctorAppointmentAttachments: (appointmentId: number) => `${root}/doctor/appointments/${appointmentId}/attachments`,
  doctorAttachmentContent: (appointmentId: number, attachmentId: number) =>
    `${root}/doctor/appointments/${appointmentId}/attachments/${attachmentId}/content`,
  doctorTimeOff: `${root}/doctor/time-off`,

  // Quầy lễ tân
  staffAppointments: `${root}/staff/appointments`,
  staffAppointmentsExport: `${root}/staff/appointments/export`,
  staffAppointmentById: (appointmentId: number) => `${root}/staff/appointments/${appointmentId}`,
  staffAppointmentAction: (appointmentId: number, action: string) =>
    `${root}/staff/appointments/${appointmentId}/${action}`,
  staffWalkIns: `${root}/staff/walk-ins`,
  staffCheckIn: `${root}/staff/appointments/check-in`,
  staffDoctorTimeOff: (doctorId: number) => `${root}/staff/doctors/${doctorId}/time-off`,
  staffDoctorTimeOffById: (doctorId: number, timeOffId: number) => `${root}/staff/doctors/${doctorId}/time-off/${timeOffId}`,
  staffTimeOff: `${root}/staff/time-off`,
  staffTimeOffById: (timeOffId: number) => `${root}/staff/time-off/${timeOffId}`,
  staffDoctors: `${root}/staff/doctors`,
  staffDoctorAlternatives: `${root}/staff/doctors/alternatives`,
  staffDoctorSlots: (doctorId: number) => `${root}/staff/doctors/${doctorId}/available-slots`,
  staffDoctorCalendar: (doctorId: number) => `${root}/staff/doctors/${doctorId}/calendar-availability`,
  staffPromotions: `${root}/staff/promotions`,
  staffPatientLinkAccount: (patientId: number) => `${root}/staff/patients/${patientId}/link-account`,
  staffPatientLinkAccountCode: (patientId: number) => `${root}/staff/patients/${patientId}/link-account/request-code`,
  staffPatients: `${root}/staff/patients`,
  staffPatientById: (patientId: number) => `${root}/staff/patients/${patientId}`,

};

export default url;
