/**
 * Nhãn tiếng Việt và "tông" hiển thị cho các mã trạng thái backend
 * (QLPK.DataBaseAccess/Constants). Mã lạ vẫn hiện nguyên văn thay vì bị giấu.
 */

import { APPOINTMENT_STATUS_LABEL } from '../api/types';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'progress';

export interface LabelTone {
  label: string;
  tone: Tone;
}

type LabelMap = Record<string, LabelTone>;

export const APPOINTMENT_STATUS: LabelMap = {
  pending: { label: APPOINTMENT_STATUS_LABEL.pending, tone: 'warning' },
  pending_approval: { label: APPOINTMENT_STATUS_LABEL.pending_approval, tone: 'warning' },
  confirmed: { label: APPOINTMENT_STATUS_LABEL.confirmed, tone: 'info' },
  checked_in: { label: APPOINTMENT_STATUS_LABEL.checked_in, tone: 'progress' },
  completed: { label: APPOINTMENT_STATUS_LABEL.completed, tone: 'success' },
  cancelled: { label: APPOINTMENT_STATUS_LABEL.cancelled, tone: 'neutral' },
  no_show: { label: APPOINTMENT_STATUS_LABEL.no_show, tone: 'danger' },
};

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Quản trị viên',
  doctor: 'Bác sĩ',
  receptionist: 'Lễ tân',
  patient: 'Bệnh nhân',
};

export const STAFF_ROLE_CODES = ['admin', 'doctor', 'receptionist'] as const;

export const GENDER_LABEL: Record<string, string> = {
  male: 'Nam',
  female: 'Nữ',
  other: 'Khác',
};

export const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  full_time: 'Toàn thời gian',
  contract: 'Hợp đồng',
};

export const VISIT_TYPE_LABEL: Record<string, string> = {
  new_visit: 'Khám mới',
  follow_up: 'Tái khám',
};

export const CONSULTATION_MODE_LABEL: Record<string, string> = {
  in_clinic: 'Tại phòng khám',
  video_call: 'Gọi video',
  chat: 'Nhắn tin',
  both: 'Kết hợp',
};

export const BOOKING_SOURCE_LABEL: Record<string, string> = {
  patient_app: 'Bệnh nhân tự đặt',
  admin: 'Nhân viên đặt',
  doctor: 'Bác sĩ đặt',
};

export const DISCOUNT_TYPE_LABEL: Record<string, string> = {
  percent: 'Phần trăm',
  fixed_amount: 'Số tiền cố định',
};

/** Chuyên khoa có sẵn (SpecialtySeed). Backend chưa có API liệt kê chuyên khoa. */
export const SPECIALTIES = [
  { id: 1, name: 'Da liễu tổng quát' },
  { id: 2, name: 'Da liễu thẩm mỹ' },
];

export function labelOf(map: LabelMap, code: string | null | undefined): LabelTone {
  if (!code) {
    return { label: '—', tone: 'neutral' };
  }
  return map[code] ?? { label: code, tone: 'neutral' };
}

export function textOf(map: Record<string, string>, code: string | null | undefined): string {
  if (!code) {
    return '—';
  }
  return map[code] ?? code;
}

export const PATIENT_CREATED_VIA_LABEL: Record<string, string> = {
  self_registered: 'Tự đăng ký',
  admin_created: 'Tạo tại quầy',
};

/** 4 ca chuẩn của phòng khám: 2 ca sáng, 2 ca chiều, mỗi ca 2 tiếng. */
export const STANDARD_SHIFTS = [
  { label: 'Ca sáng 1', start_time: '07:30', end_time: '09:30' },
  { label: 'Ca sáng 2', start_time: '09:30', end_time: '11:30' },
  { label: 'Ca chiều 1', start_time: '13:30', end_time: '15:30' },
  { label: 'Ca chiều 2', start_time: '15:30', end_time: '17:30' },
];

/** doctor_schedules.day_of_week: 1 = Thứ Hai … 7 = Chủ nhật (ISO-8601). */
export const DAY_OF_WEEK_LABEL: Record<number, string> = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  7: 'Chủ nhật',
};

/** Ngày 'yyyy-MM-dd' → thứ theo ISO (1..7), không lệch múi giờ. */
export function isoDayOfWeek(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

export const CALENDAR_DAY_STATUS: LabelMap = {
  available: { label: 'Còn chỗ', tone: 'success' },
  full: { label: 'Kín lịch', tone: 'warning' },
  off: { label: 'Không làm', tone: 'neutral' },
  holiday: { label: 'Nghỉ lễ', tone: 'danger' },
  past: { label: 'Đã qua', tone: 'neutral' },
};

export const PATIENT_RELATIONSHIP_LABEL: Record<string, string> = {
  self: 'Bản thân',
  child: 'Con',
  parent: 'Bố / mẹ',
  spouse: 'Vợ / chồng',
  other: 'Khác',
};

export const NOTIFICATION_TYPE_LABEL: Record<string, string> = {
  appointment: 'Lịch hẹn',
  system: 'Hệ thống',
  reminder: 'Nhắc nhở',
};
