/**
 * Shape của các DTO backend trả về.
 *
 * Tên field để nguyên snake_case vì đó là những gì thật sự đi trên dây: QLPK đặt
 * `JsonNamingPolicy.SnakeCaseLower` cho cả controller lẫn ProblemDetails
 * (QLPK/Configurations/JsonServiceExtensions.cs). Đổi sang camelCase ở tầng này sẽ
 * thêm một lớp ánh xạ phải bảo trì, và một chỗ nữa để sai.
 */

export interface PagedResponse<T> {
  items: T[];
  page_number: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_previous_page: boolean;
  has_next_page: boolean;
}

/** Trả lời của POST /api/auth/register và /api/auth/forgot-password. */
export interface OtpChallengeResponse {
  masked_destination: string;
  /** ISO 8601. */
  expires_at: string;
  max_attempts: number;
  resend_cooldown_seconds: number;
}

export interface CaptchaVerificationResponse {
  verification_token: string;
  expires_at: string;
}

export interface DoctorSpecialty {
  specialty_id: number;
  specialty_code: string;
  specialty_name: string;
}

export interface DoctorListItem {
  doctor_id: number;
  full_name: string;
  avatar_url: string | null;
  specialty_id: number;
  specialty_name: string;
  specialties: DoctorSpecialty[];
  degree: string | null;
  years_of_experience: number;
  consultation_fee: number;
  /** Backend chưa ghi giá trị thật cho hai trường dưới — đừng dựng UI đánh giá lên chúng. */
  average_rating: number;
  review_count: number;
  is_accepting_appointments: boolean;
}

export interface AvailableSlot {
  /** 'HH:mm:ss'. */
  start_time: string;
  end_time: string;
  duration_minutes: number;
  consultation_mode: string;
}

export interface DoctorAvailability {
  doctor_id: number;
  doctor_full_name: string;
  specialty_name: string;
  /** 'yyyy-MM-dd'. */
  date: string;
  is_clinic_holiday: boolean;
  slots: AvailableSlot[];
}

export interface ClinicService {
  service_id: number;
  service_name: string;
  service_group: string | null;
  description: string | null;
  price: number;
  duration_minutes: number;
  image_url: string | null;
}

export interface PatientProfile {
  patient_id: number;
  patient_code: string;
  relationship_to_account: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  occupation: string | null;
  blood_type: string | null;
  health_insurance_number: string | null;
  health_insurance_expiry: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  allergy_notes: string | null;
  account_phone_number: string;
  account_email: string | null;
  created_at: string;
}

export interface AppointmentServiceLine {
  service_id: number;
  service_name: string;
  quantity: number;
  unit_price: number;
  line_amount: number;
}

export interface AppointmentListItem {
  appointment_id: number;
  patient_id: number;
  patient_full_name: string;
  doctor_id: number;
  doctor_full_name: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: string;
  consultation_mode: string;
  queue_number: number | null;
  discount_percent: number;
  created_at: string;
}

export interface Appointment extends AppointmentListItem {
  booking_source: string;
  check_in_code: string | null;
  checked_in_at: string | null;
  cancellation_reason: string | null;
  discount_approval_required: boolean;
  subtotal_amount: number;
  total_amount: number;
  services: AppointmentServiceLine[];
}

export interface CheckInResult {
  appointment_id: number;
  queue_number: number;
  doctor_full_name: string;
  specialty_name: string;
  appointment_time: string;
  checked_in_at: string;
  self_check_in: boolean;
}

/** Giá trị của appointments.status (QLPK.DataBaseAccess/Constants/AppointmentStatuses.cs). */
export const APPOINTMENT_STATUS = {
  Pending: 'pending',
  PendingApproval: 'pending_approval',
  Confirmed: 'confirmed',
  CheckedIn: 'checked_in',
  InProgress: 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
  NoShow: 'no_show',
} as const;

/** Nhãn tiếng Việt cho từng trạng thái, dùng chung ở mọi màn hình. */
export const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  pending_approval: 'Chờ duyệt giảm giá',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã nhận phòng',
  in_progress: 'Đang khám',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã huỷ',
  no_show: 'Không đến',
};

/** Mã vai trò trong bảng roles (QLPK.DataBaseAccess/Constants/RoleCodes.cs). */
export const ROLE = {
  Admin: 'admin',
  Doctor: 'doctor',
  Pharmacist: 'pharmacist',
  Receptionist: 'receptionist',
  Patient: 'patient',
} as const;
