/**
 * Toàn bộ endpoint của QLPK API, gom về một file như `app/apis/url.js` bên dcv2.
 * Không nơi nào khác trong ứng dụng được ghép URL bằng tay.
 */

import { API_ROOT } from './apiTarget';

// Azure hay localhost do VITE_API_TARGET quyết định — xem apiTarget.ts và .env.
const root = API_ROOT;

export { API_ROOT };

export type BatchAction = 'adjustments' | 'write-off' | 'return-to-supplier' | 'stock-out';

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
  adminRevenueReport: `${root}/admin/reports/revenue`,
  adminAppointmentReport: `${root}/admin/reports/appointments`,
  adminDashboard: `${root}/admin/reports/dashboard`,
  adminDoctorSchedules: (doctorId: number) => `${root}/admin/doctors/${doctorId}/schedules`,
  adminDoctorScheduleById: (doctorId: number, scheduleId: number) => `${root}/admin/doctors/${doctorId}/schedules/${scheduleId}`,
  adminDoctorScheduleStatus: (doctorId: number, scheduleId: number) =>
    `${root}/admin/doctors/${doctorId}/schedules/${scheduleId}/status`,
  adminContracts: `${root}/admin/contracts`,
  adminContractById: (contractId: number) => `${root}/admin/contracts/${contractId}`,
  adminClinicProfile: `${root}/admin/clinic/profile`,
  adminClinicHolidays: `${root}/admin/clinic/holidays`,
  adminClinicHolidayById: (holidayId: number) => `${root}/admin/clinic/holidays/${holidayId}`,
  adminClinicSettings: `${root}/admin/clinic/settings`,
  adminJobRuns: `${root}/admin/clinic/job-runs`,
  adminSpecialties: `${root}/admin/specialties`,
  adminSpecialtyById: (specialtyId: number) => `${root}/admin/specialties/${specialtyId}`,

  // Bác sĩ
  doctorAppointments: `${root}/doctor/appointments`,
  doctorDashboard: `${root}/doctor/dashboard`,
  doctorAppointmentAction: (appointmentId: number, action: 'confirm' | 'decline' | 'follow-up') =>
    `${root}/doctor/appointments/${appointmentId}/${action}`,
  doctorWorkingHours: `${root}/doctor/working-hours`,
  doctorWorkingHoursById: (scheduleId: number) => `${root}/doctor/working-hours/${scheduleId}`,
  doctorWorkingHoursStatus: (scheduleId: number) => `${root}/doctor/working-hours/${scheduleId}/status`,
  doctorTimeOffById: (timeOffId: number) => `${root}/doctor/time-off/${timeOffId}`,
  doctorStartExamination: (appointmentId: number) => `${root}/doctor/appointments/${appointmentId}/start`,
  doctorMedicalRecord: (appointmentId: number) => `${root}/doctor/appointments/${appointmentId}/medical-record`,
  doctorPrescription: (appointmentId: number) => `${root}/doctor/appointments/${appointmentId}/prescription`,
  doctorCompleteExamination: (appointmentId: number) => `${root}/doctor/appointments/${appointmentId}/complete`,
  doctorPatientHistory: (patientId: number) => `${root}/doctor/patients/${patientId}/medical-records`,
  doctorMedicines: `${root}/doctor/medicines`,
  doctorTimeOff: `${root}/doctor/time-off`,

  // Quầy lễ tân / thu ngân
  staffAppointments: `${root}/staff/appointments`,
  staffAppointmentById: (appointmentId: number) => `${root}/staff/appointments/${appointmentId}`,
  staffAppointmentAction: (appointmentId: number, action: string) =>
    `${root}/staff/appointments/${appointmentId}/${action}`,
  staffWalkIns: `${root}/staff/walk-ins`,
  staffCheckIn: `${root}/staff/appointments/check-in`,
  staffDoctorTimeOff: (doctorId: number) => `${root}/staff/doctors/${doctorId}/time-off`,
  staffDoctorTimeOffById: (doctorId: number, timeOffId: number) => `${root}/staff/doctors/${doctorId}/time-off/${timeOffId}`,
  staffDoctorSlots: (doctorId: number) => `${root}/staff/doctors/${doctorId}/available-slots`,
  staffDoctorCalendar: (doctorId: number) => `${root}/staff/doctors/${doctorId}/calendar-availability`,
  staffPromotions: `${root}/staff/promotions`,
  staffPatientLinkAccount: (patientId: number) => `${root}/staff/patients/${patientId}/link-account`,
  staffInvoicePdf: (invoiceId: number) => `${root}/staff/invoices/${invoiceId}/pdf`,
  staffPatients: `${root}/staff/patients`,
  staffPatientById: (patientId: number) => `${root}/staff/patients/${patientId}`,
  staffDispenseRequests: `${root}/staff/dispense-requests`,
  staffSettlementInvoice: (appointmentId: number) => `${root}/staff/appointments/${appointmentId}/settlement-invoice`,
  staffInvoices: `${root}/staff/invoices`,
  staffInvoiceById: (invoiceId: number) => `${root}/staff/invoices/${invoiceId}`,
  staffInvoicePayments: (invoiceId: number) => `${root}/staff/invoices/${invoiceId}/payments`,
  staffInvoiceRefunds: (invoiceId: number) => `${root}/staff/invoices/${invoiceId}/refunds`,

  // Nhà thuốc
  pharmacyMedicines: `${root}/pharmacist/inventory/medicines`,
  pharmacyReorderSuggestions: `${root}/pharmacist/inventory/reorder-suggestions`,
  pharmacyMedicineBatches: (medicineId: number) => `${root}/pharmacist/inventory/medicines/${medicineId}/batches`,
  pharmacyMedicineClassification: (medicineId: number) =>
    `${root}/pharmacist/inventory/medicines/${medicineId}/classification`,
  pharmacyMedicineCatalog: `${root}/pharmacist/medicines`,
  pharmacyMedicineCatalogById: (medicineId: number) => `${root}/pharmacist/medicines/${medicineId}`,
  pharmacyMedicineCatalogStatus: (medicineId: number) => `${root}/pharmacist/medicines/${medicineId}/status`,
  pharmacyExpiringBatches: `${root}/pharmacist/inventory/expiring-batches`,
  pharmacyStockLogs: `${root}/pharmacist/inventory/logs`,
  pharmacyInventoryReport: `${root}/pharmacist/inventory/report`,
  pharmacyBatchAction: (batchId: number, action: BatchAction) => `${root}/pharmacist/inventory/batches/${batchId}/${action}`,
  pharmacyPrescriptions: `${root}/pharmacist/prescriptions`,
  pharmacyPrescriptionById: (prescriptionId: number) => `${root}/pharmacist/prescriptions/${prescriptionId}`,
  pharmacyPrescriptionAction: (prescriptionId: number, action: 'prepare' | 'cancel-preparation' | 'deliver') =>
    `${root}/pharmacist/prescriptions/${prescriptionId}/${action}`,
  pharmacySuppliers: `${root}/pharmacist/suppliers`,
  pharmacySupplierById: (supplierId: number) => `${root}/pharmacist/suppliers/${supplierId}`,
};

export default url;
