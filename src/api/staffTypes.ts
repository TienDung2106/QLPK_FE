/**
 * Shape DTO của khu nhân viên (admin, bác sĩ, thu ngân, nhà thuốc), chép từ QLPK.DataDto.
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
  compensation_percent: number;
  compensation_reason: string | null;
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

export interface PaymentPayload {
  /** 'cash' | 'bank_transfer' | 'internal_support'. */
  payment_method: string;
  /** Bắt buộc với bank_transfer. */
  external_reference?: string;
}

export interface ConfirmPaymentResult {
  appointment_id: number;
  invoice_id: number;
  invoice_number: string;
  appointment_status: string;
  payment_status: string;
  total_amount: number;
  amount_collected: number;
  paid_at: string;
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

/* ---------------------------------------------------------------- Billing */

export interface SettlementQueueItem {
  dispense_request_id: number;
  appointment_id: number;
  appointment_date: string;
  patient_id: number;
  patient_full_name: string;
  patient_code: string;
  doctor_full_name: string;
  status: string;
  has_prescription: boolean;
  prescription_status: string | null;
  ready_to_settle: boolean;
  invoice_id: number | null;
  total_amount: number | null;
  amount_collected: number | null;
  created_at: string;
}

export interface SettlementQueueQuery extends PageQuery {
  status?: string;
  search?: string;
}

export interface InvoiceListItem {
  invoice_id: number;
  invoice_number: string;
  appointment_id: number;
  patient_id: number;
  patient_full_name: string;
  patient_code: string;
  invoice_status: string;
  payment_status: string;
  total_amount: number;
  amount_collected: number;
  paid_at: string | null;
  created_at: string;
}

export interface InvoiceQuery extends PageQuery {
  payment_status?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}

export interface InvoiceItem {
  invoice_item_id: number;
  item_type: string;
  reference_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface PaymentTransaction {
  payment_transaction_id: number;
  transaction_type: string;
  payment_method: string;
  amount: number;
  external_reference: string | null;
  transaction_status: string;
  created_by: number;
  paid_at: string | null;
}

export interface Invoice {
  invoice_id: number;
  invoice_number: string;
  appointment_id: number;
  appointment_date: string;
  patient_id: number;
  patient_full_name: string;
  patient_code: string;
  doctor_full_name: string;
  invoice_status: string;
  payment_status: string;
  services_subtotal: number;
  medicines_subtotal: number;
  subtotal_amount: number;
  discount_amount: number;
  discount_reason: string | null;
  support_amount: number;
  cancellation_refund_percent: number | null;
  total_amount: number;
  amount_collected: number;
  amount_outstanding: number;
  refund_due: number;
  paid_at: string | null;
  created_at: string;
  items: InvoiceItem[];
  transactions: PaymentTransaction[];
}

/* ---------------------------------------------------------------- Examinations */

export interface ExaminationStatus {
  appointment_id: number;
  status: string;
  examination_started_at: string | null;
  completed_at: string | null;
  dispense_request_id: number | null;
  prescription_id: number | null;
  treatment_sessions_completed: number | null;
  treatment_total_sessions: number | null;
}

export interface PrescriptionAllocation {
  medicine_batch_id: number;
  batch_number: string;
  expiry_date: string | null;
  quantity_reserved: number;
  quantity_delivered: number;
}

export interface PrescriptionItem {
  prescription_item_id: number;
  medicine_id: number;
  medicine_name: string;
  unit_of_measure: string;
  /** Quy cách một đơn vị, vd "Hộp 3 vỉ × 10 viên". */
  packaging: string | null;
  quantity_prescribed: number;
  quantity_reserved: number;
  quantity_delivered: number;
  dosage: string;
  frequency: string;
  duration_days: number | null;
  usage_instructions: string | null;
  unit_price: number;
  allocations: PrescriptionAllocation[];
}

export interface Prescription {
  prescription_id: number;
  medical_record_id: number;
  appointment_id: number;
  patient_id: number;
  patient_full_name: string;
  doctor_id: number;
  doctor_full_name: string;
  status: string;
  /** Tiến độ ở quầy thu ngân: awaiting_payment / invoiced / paid; null khi bác sĩ chưa hoàn tất lượt khám. */
  settlement_status?: string | null;
  notes: string | null;
  created_at: string;
  prepared_at: string | null;
  delivered_at: string | null;
  reserved_amount: number;
  items: PrescriptionItem[];
}

export interface MedicalRecord {
  medical_record_id: number;
  appointment_id: number;
  appointment_date: string;
  appointment_time: string;
  patient_id: number;
  patient_full_name: string;
  doctor_id: number;
  doctor_full_name: string;
  symptoms: string | null;
  examination_findings: string | null;
  diagnosis: string;
  icd10_code: string | null;
  treatment_plan: string | null;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  doctor_notes: string | null;
  created_at: string;
  updated_at: string;
  prescription: Prescription | null;
}

export interface MedicalRecordPayload {
  symptoms?: string | null;
  examination_findings?: string | null;
  diagnosis: string;
  icd10_code?: string | null;
  treatment_plan?: string | null;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
  doctor_notes?: string | null;
}

export interface PrescriptionItemPayload {
  medicine_id: number;
  quantity: number;
  dosage: string;
  frequency: string;
  duration_days?: number | null;
  usage_instructions?: string | null;
}

export interface WritePrescriptionPayload {
  items: PrescriptionItemPayload[];
  notes?: string | null;
}

export interface PrescribableMedicine {
  medicine_id: number;
  medicine_name: string;
  active_ingredient: string | null;
  medicine_group: string | null;
  unit_of_measure: string;
  /** Quy cách một đơn vị, vd "Hộp 3 vỉ × 10 viên". */
  packaging: string | null;
  unit_price: number;
  available_stock: number;
  /** Số lô chưa hết hạn còn hàng; nhà thuốc xuất lô hết hạn sớm nhất trước. */
  batch_count: number;
  earliest_expiry_date: string | null;
}

/* ---------------------------------------------------------------- Pharmacy */

export interface PrescriptionQuery extends PageQuery {
  status?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}

export interface PrescriptionShortfall {
  prescription_item_id: number;
  medicine_id: number;
  medicine_name: string;
  quantity_prescribed: number;
  quantity_reserved: number;
}

export interface PrescriptionPreparation {
  prescription: Prescription;
  shortfalls: PrescriptionShortfall[];
}

export interface MedicineStock {
  medicine_id: number;
  medicine_name: string;
  active_ingredient: string | null;
  medicine_group: string | null;
  unit_of_measure: string;
  /** Quy cách một đơn vị, vd "Hộp 3 vỉ × 10 viên". */
  packaging: string | null;
  current_stock: number;
  usable_stock: number;
  reserved_stock: number;
  available_stock: number;
  earliest_expiry_date: string | null;
  velocity_class: string;
  criticality_level: string;
  avg_daily_usage: number;
  velocity_computed_at: string | null;
  low_stock_threshold: number;
  low_stock_threshold_is_manual: boolean;
  is_below_threshold: boolean;
  suggested_reorder_quantity: number;
}

export interface MedicineStockQuery extends PageQuery {
  search?: string;
  medicine_group?: string;
  velocity_class?: string;
  criticality_level?: string;
  below_threshold_only?: boolean;
}

export interface MedicineBatch {
  medicine_batch_id: number;
  medicine_id: number;
  batch_number: string;
  expiry_date: string | null;
  quantity_imported: number;
  quantity_remaining: number;
  quantity_reserved: number;
  quantity_available: number;
  import_unit_price: number;
  imported_at: string;
  supplier_id: number | null;
  supplier_name: string | null;
  is_active: boolean;
}

export interface ImportBatchPayload {
  batch_number: string;
  expiry_date?: string | null;
  quantity_imported: number;
  import_unit_price: number;
  supplier_id?: number | null;
}

export interface ImportBatchResult {
  batch: MedicineBatch;
  stock: MedicineStock;
}

export interface MedicineClassificationPayload {
  criticality_level: string;
  low_stock_threshold_is_manual: boolean;
  low_stock_threshold?: number | null;
}

export interface Supplier {
  supplier_id: number;
  supplier_name: string;
  contact_person: string | null;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierQuery extends PageQuery {
  search?: string;
  is_active?: boolean;
}

export interface SupplierPayload {
  supplier_name: string;
  contact_person?: string | null;
  phone_number?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active: boolean;
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

export interface RevenueByDay {
  date: string;
  collected: number;
  refunded: number;
  net: number;
}

export interface RevenueByPaymentMethod {
  payment_method: string;
  collected: number;
  refunded: number;
  net: number;
}

export interface RevenueByDoctor {
  doctor_id: number;
  doctor_full_name: string;
  net: number;
  visit_count: number;
}

export interface RevenueReport {
  from_date: string;
  to_date: string;
  total_collected: number;
  total_refunded: number;
  net_revenue: number;
  services_revenue: number;
  medicines_revenue: number;
  payment_count: number;
  refund_count: number;
  by_day: RevenueByDay[];
  by_payment_method: RevenueByPaymentMethod[];
  by_doctor: RevenueByDoctor[];
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
  in_progress: number;
  completed_today: number;
  next_appointment: AppointmentListItem | null;
  unread_notifications: number;
}

export interface ClinicDashboard {
  date: string;
  appointments_today: number;
  awaiting_confirmation: number;
  awaiting_discount_approval: number;
  waiting_to_be_seen: number;
  in_progress: number;
  completed_today: number;
  net_revenue_today: number;
  awaiting_settlement: number;
  medicines_below_threshold: number;
  active_doctors: number;
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

export interface InventoryReport {
  as_of: string;
  medicine_count: number;
  below_threshold_count: number;
  expiring_batch_count: number;
  expiring_within_days: number;
  below_threshold: MedicineStock[];
  expiring_batches: MedicineBatch[];
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
  affected_appointments: AppointmentListItem[];
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
  session_number?: number | null;
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
  invoice_footer_note: string | null;
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

/* ---------------------------------------------------------------- Pharmacy extras */

export interface MedicinePayload {
  medicine_name: string;
  active_ingredient?: string | null;
  medicine_group?: string | null;
  unit_of_measure: string;
  /** Quy cách một đơn vị, vd "Hộp 3 vỉ × 10 viên". */
  packaging?: string | null;
  unit_price: number;
  manufacturer?: string | null;
  storage_condition?: string | null;
  description?: string | null;
}

export interface AdjustBatchPayload {
  counted_quantity: number;
  notes: string;
}

export interface RemoveStockPayload {
  /** Bỏ trống ở write-off = huỷ toàn bộ phần còn lại. */
  quantity?: number | null;
  notes: string;
}

export interface ExpiringBatchQuery extends PageQuery {
  within_days?: number;
}

export interface StockMovement {
  inventory_log_id: number;
  medicine_id: number;
  medicine_name: string;
  medicine_batch_id: number | null;
  batch_number: string | null;
  account_id: number | null;
  account_name: string | null;
  action: string;
  quantity_changed: number;
  quantity_before: number;
  quantity_after: number;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  created_at: string;
}

export interface StockMovementQuery extends PageQuery {
  medicine_id?: number;
  medicine_batch_id?: number;
  action?: string;
  from_date?: string;
  to_date?: string;
}
