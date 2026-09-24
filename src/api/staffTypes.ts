/**
 * Shape DTO của khu nhân viên (admin, bác sĩ, lễ tân), chép từ QLPK.DataDto.
 *
 * Giữ snake_case như types.ts. Ngày (`DateOnly`) là 'yyyy-MM-dd', giờ (`TimeOnly`) là
 * 'HH:mm:ss', thời điểm (`DateTimeOffset`) là ISO 8601; `decimal` đi trên dây là number.
 */

import type { Appointment, AppointmentListItem, PatientProfile } from './types';

export interface PageQuery {
  page_number?: number;
  page_size?: number;
}

export interface SetActiveStatusPayload {
  is_active: boolean;
}

/* ---------------------------------------------------------------- Appointments (desk) */

export interface StaffAppointment extends Appointment {
  rescheduled_from_appointment_id: number | null;
  postponed_at: string | null;
  awaiting_reschedule_response: boolean;
}

export interface AppointmentQuery extends PageQuery {
  doctor_id?: number;
  from_date?: string;
  to_date?: string;
  status?: string;
}

export interface AppointmentServicePayload {
  service_id: number;
  quantity: number;
}

export interface BookOnBehalfPayload {
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  consultation_mode?: string;
  visit_type?: string;
  reason_for_visit?: string;
  primary_service_id?: number;
  services: AppointmentServicePayload[];
  promotion_code?: string;
}

export interface WalkInPayload {
  patient_id: number;
  doctor_id: number;
  /** Bỏ trống thì backend lấy slot sớm nhất còn trống hôm nay. */
  appointment_time?: string;
  visit_type?: string;
  reason_for_visit?: string;
  primary_service_id?: number;
  services: AppointmentServicePayload[];
  promotion_code?: string;
}

export interface ApplyDiscountPayload {
  promotion_code?: string;
  discount_percent?: number;
  notes?: string;
}

export interface ApplyDiscountResult {
  appointment_id: number;
  discount_percent: number;
  status: string;
  approval_required: boolean;
  discount_approved_by: number | null;
  subtotal_amount: number;
  total_amount: number;
}

export interface NewSlotPayload {
  new_date: string;
  new_time: string;
}

export interface PostponePayload extends NewSlotPayload {
  reason: string;
}

/* ---------------------------------------------------------------- Scheduling */

export interface TimeOff {
  doctor_time_off_id: number;
  doctor_id: number;
  off_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_by: number;
  created_at: string;
  affected_appointments: AppointmentListItem[];
  /** Lịch thay hệ thống tự dời lúc báo nghỉ (sang bác sĩ khác hoặc ca khác); chỉ có trong phản hồi tạo mới. */
  rescheduled_appointments?: AppointmentListItem[];
}

/** Ngày nghỉ lễ tân tự báo; không gắn ca khám nên không có lịch hẹn bị ảnh hưởng. */
export interface StaffTimeOff {
  staff_time_off_id: number;
  off_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

export interface TimeOffQuery {
  from_date?: string;
  to_date?: string;
}

export interface TimeOffPayload {
  off_date: string;
  start_time?: string;
  end_time?: string;
  reason: string;
}

/* ---------------------------------------------------------------- Patients (desk) */

export interface DeskPatient extends PatientProfile {
  account_id: number;
  created_via: string;
  national_id: string | null;
  account_claimed: boolean;
  recent_appointments: AppointmentListItem[];
}

export interface DeskPatientQuery extends PageQuery {
  search?: string;
}

export interface DeskPatientPayload {
  full_name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  occupation?: string | null;
  blood_type?: string | null;
  health_insurance_number?: string | null;
  health_insurance_expiry?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  allergy_notes?: string | null;
  email?: string | null;
  national_id?: string | null;
}

export interface RegisterDeskPatientPayload extends DeskPatientPayload {
  /** Bắt buộc khi không có email. */
  phone_number?: string | null;
}

/* ---------------------------------------------------------------- Admin */

export interface StaffProfile {
  staff_profile_id: number;
  national_id: string;
  hired_date: string;
  contract_end_date: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contract_signed_by: string | null;
  work_position: string | null;
  notes: string | null;
}

export type StaffProfilePayload = Omit<StaffProfile, 'staff_profile_id'>;

export interface StaffDoctorSpecialty {
  specialty_id: number;
  specialty_code: string;
  specialty_name: string;
}

export interface StaffDoctor {
  doctor_id: number;
  specialty_id: number;
  specialty_name: string;
  specialties: StaffDoctorSpecialty[];
  license_number: string | null;
  license_expiry_date: string | null;
  employment_type: string;
  degree: string | null;
  years_of_experience: number;
  consultation_fee: number;
  biography: string | null;
  is_accepting_appointments: boolean;
}

export interface StaffDoctorPayload {
  specialty_id: number;
  additional_specialty_ids: number[];
  license_number?: string | null;
  license_expiry_date?: string | null;
  employment_type: string;
  degree?: string | null;
  years_of_experience: number;
  consultation_fee?: number | null;
  biography?: string | null;
  is_accepting_appointments: boolean;
}

export interface StaffAccountListItem {
  account_id: number;
  full_name: string;
  phone_number: string | null;
  email: string | null;
  role_code: string;
  role_name: string;
  is_active: boolean;
  must_change_password: boolean;
  work_position: string | null;
  hired_date: string | null;
  contract_end_date: string | null;
  employment_type: string | null;
  specialty_name: string | null;
  is_accepting_appointments: boolean | null;
  created_at: string;
}

export interface StaffAccount {
  account_id: number;
  full_name: string;
  phone_number: string | null;
  email: string | null;
  role_code: string;
  role_name: string;
  is_active: boolean;
  must_change_password: boolean;
  created_by: number | null;
  created_at: string;
  profile: StaffProfile | null;
  doctor: StaffDoctor | null;
}

export interface StaffAccountQuery extends PageQuery {
  role_code?: string;
  search?: string;
}

export interface CreateStaffAccountPayload {
  email: string;
  phone_number?: string | null;
  temporary_password: string;
  full_name: string;
  role_code: string;
  profile: StaffProfilePayload;
  doctor?: StaffDoctorPayload | null;
}

export interface UpdateStaffAccountPayload {
  full_name: string;
  email?: string | null;
  profile?: StaffProfilePayload | null;
  doctor?: StaffDoctorPayload | null;
}

export interface AdminService {
  service_id: number;
  service_name: string;
  service_group: string | null;
  description: string | null;
  price: number;
  duration_minutes: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminServiceQuery extends PageQuery {
  search?: string;
  service_group?: string;
  is_active?: boolean;
}

export interface AdminServicePayload {
  service_name: string;
  service_group?: string | null;
  description?: string | null;
  price: number;
  duration_minutes: number;
  image_url?: string | null;
  is_active: boolean;
}

export interface Promotion {
  promotion_id: number;
  promotion_code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_discount_amount: number | null;
  min_booking_amount: number;
  usage_limit_total: number | null;
  usage_limit_per_patient: number;
  times_used: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  is_currently_valid: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface PromotionQuery extends PageQuery {
  search?: string;
  is_active?: boolean;
  currently_valid_only?: boolean;
}

export interface PromotionPayload {
  promotion_code: string;
  description?: string | null;
  discount_type: string;
  discount_value: number;
  max_discount_amount?: number | null;
  min_booking_amount: number;
  usage_limit_total?: number | null;
  usage_limit_per_patient: number;
  valid_from: string;
  valid_until?: string | null;
  is_active: boolean;
}

export interface SystemSetting {
  setting_key: string;
  setting_value: string;
  value_type: string;
  description: string | null;
  updated_by: number | null;
  updated_at: string;
}

export interface UpdateSettingPayload {
  setting_value: string;
  value_type?: string;
  description?: string | null;
}

/* ---------------------------------------------------------------- Notifications (mọi tài khoản) */

export interface Notification {
  notification_id: number;
  title: string;
  content: string;
  notification_type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface NotificationQuery extends PageQuery {
  unread_only?: boolean;
}

export interface UnreadNotificationCount {
  unread_count: number;
}

/* ---------------------------------------------------------------- Dashboards & reports */

export interface DoctorDashboard {
  date: string;
  appointments_today: number;
  awaiting_confirmation: number;
  awaiting_discount_approval: number;
  waiting_to_be_seen: number;
  completed_today: number;
  next_appointment: AppointmentListItem | null;
  unread_notifications: number;
}

export interface AppointmentReportByDoctor {
  doctor_id: number;
  doctor_full_name: string;
  total_appointments: number;
  completed: number;
  cancelled: number;
  no_show: number;
}

export interface AppointmentReport {
  from_date: string;
  to_date: string;
  total_appointments: number;
  by_status: Record<string, number>;
  completed: number;
  cancelled: number;
  no_show: number;
  attrition_percent: number;
  by_doctor: AppointmentReportByDoctor[];
}

/* ---------------------------------------------------------------- Working hours */

export interface DoctorSchedule {
  doctor_schedule_id: number;
  doctor_id: number;
  /** 1 = Thứ Hai … 7 = Chủ nhật (ISO-8601). */
  day_of_week: number;
  consultation_mode: string;
  start_time: string;
  end_time: string;
  max_patients: number;
  /** Độ dài ca (phút) — lượng thời gian các lượt khám đặt vào ca được lấp đầy. */
  capacity_minutes: number;
  is_active: boolean;
  managed_by: number;
  created_at: string;
  updated_at: string;
  /** Lịch rơi ra ngoài ca sau khi sửa/tắt mà hệ thống không tự dời được; quầy dời tay. */
  affected_appointments: AppointmentListItem[];
  /** Lịch thay hệ thống đã tự dời khi sửa/tắt ca; chỉ có trong phản hồi ghi. */
  rescheduled_appointments?: AppointmentListItem[];
  /** Các ngày sắp tới ca đang có nhiều lịch hơn max_patients (vừa giảm trần); lịch cũ vẫn giữ. */
  overbooked_dates?: string[];
}

export interface DoctorSchedulePayload {
  day_of_week: number;
  consultation_mode?: string | null;
  start_time: string;
  end_time: string;
  max_patients: number;
  is_active: boolean;
}

export interface DoctorScheduleQuery {
  include_inactive?: boolean;
}

export interface DoctorCalendarDay {
  date: string;
  /** available | full | off | holiday | past */
  status: string;
  available_slots: number;
  total_slots: number;
}

export interface DoctorCalendar {
  doctor_id: number;
  doctor_full_name: string;
  specialty_name: string;
  from_date: string;
  to_date: string;
  days: DoctorCalendarDay[];
}

/* ---------------------------------------------------------------- Appointment review / follow-up */

export interface FollowUpPayload {
  appointment_date: string;
  appointment_time: string;
  consultation_mode?: string | null;
  reason_for_visit?: string | null;
  services: AppointmentServicePayload[];
  primary_service_id?: number | null;
}

/* ---------------------------------------------------------------- Admin: clinic */

export interface ClinicProfile {
  clinic_name: string;
  tax_code: string | null;
  address: string;
  phone_number: string;
  email: string | null;
  logo_url: string | null;
  business_hours_note: string | null;
  updated_by: number | null;
  updated_at: string;
}

export type ClinicProfilePayload = Omit<ClinicProfile, 'updated_by' | 'updated_at'>;

export interface ClinicHoliday {
  clinic_holiday_id: number;
  holiday_date: string;
  holiday_name: string;
  is_active: boolean;
}

export interface ClinicHolidayPayload {
  holiday_date: string;
  holiday_name: string;
  is_active: boolean;
}

export interface ClinicHolidayQuery {
  from_date?: string;
  to_date?: string;
  include_inactive?: boolean;
}

export interface Specialty {
  specialty_id: number;
  specialty_code: string;
  specialty_name: string;
  doctor_count: number;
}

export interface SpecialtyPayload {
  specialty_code: string;
  specialty_name: string;
}

/* ---------------------------------------------------------------- Desk extras */

export interface StaffPromotion {
  promotion_id: number;
  promotion_code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_discount_amount: number | null;
  min_booking_amount: number;
  usage_limit_per_patient: number;
  valid_from: string;
  valid_until: string | null;
}

export interface LinkPatientAccountPayload {
  account_email: string;
  relationship_to_account?: string | null;
  /** Mã chủ tài khoản nhận qua email (bước request-code); bắt buộc khi liên kết. */
  code?: string;
}
