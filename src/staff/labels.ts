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
  in_progress: { label: APPOINTMENT_STATUS_LABEL.in_progress, tone: 'progress' },
  completed: { label: APPOINTMENT_STATUS_LABEL.completed, tone: 'success' },
  cancelled: { label: APPOINTMENT_STATUS_LABEL.cancelled, tone: 'neutral' },
  no_show: { label: APPOINTMENT_STATUS_LABEL.no_show, tone: 'danger' },
};

export const PRESCRIPTION_STATUS: LabelMap = {
  pending: { label: 'Chờ soạn', tone: 'warning' },
  prepared: { label: 'Đã soạn', tone: 'info' },
  awaiting_payment: { label: 'Chờ thanh toán', tone: 'warning' },
  partially_delivered: { label: 'Giao một phần', tone: 'progress' },
  delivered: { label: 'Đã giao', tone: 'success' },
  cancelled: { label: 'Đã huỷ', tone: 'neutral' },
};

export const DISPENSE_REQUEST_STATUS: LabelMap = {
  awaiting_payment: { label: 'Chờ lập hoá đơn', tone: 'warning' },
  invoiced: { label: 'Đã lập hoá đơn', tone: 'info' },
  paid: { label: 'Đã thanh toán', tone: 'success' },
  cancelled: { label: 'Đã huỷ', tone: 'neutral' },
};

export const INVOICE_STATUS: LabelMap = {
  draft: { label: 'Nháp', tone: 'neutral' },
  issued: { label: 'Đã phát hành', tone: 'info' },
  partially_paid: { label: 'Thu một phần', tone: 'warning' },
  paid: { label: 'Đã thanh toán', tone: 'success' },
  cancelled: { label: 'Đã huỷ', tone: 'neutral' },
  refunded: { label: 'Đã hoàn tiền', tone: 'danger' },
};

/** invoices.payment_status (InvoicePaymentStatuses). */
export const PAYMENT_STATUS: LabelMap = {
  unpaid: { label: 'Chưa thanh toán', tone: 'warning' },
  partially_paid: { label: 'Thu một phần', tone: 'warning' },
  paid: { label: 'Đã thanh toán', tone: 'success' },
  refunded: { label: 'Đã hoàn tiền', tone: 'neutral' },
};

export const TRANSACTION_TYPE: Record<string, string> = {
  payment: 'Thu tiền',
  refund: 'Hoàn tiền',
};

export const PAYMENT_METHOD: Record<string, string> = {
  cash: 'Tiền mặt',
  card: 'Thẻ',
  bank_transfer: 'Chuyển khoản',
  qr: 'QR',
  internal_support: 'Hỗ trợ nội bộ',
  other: 'Khác',
};

/** Ba phương thức quầy được phép ghi nhận (PaymentRequest). */
export const DESK_PAYMENT_METHODS = ['cash', 'bank_transfer', 'internal_support'] as const;

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Quản trị viên',
  doctor: 'Bác sĩ',
  pharmacist: 'Dược sĩ',
  receptionist: 'Thu ngân / Lễ tân',
  patient: 'Bệnh nhân',
};

export const STAFF_ROLE_CODES = ['admin', 'doctor', 'pharmacist', 'receptionist'] as const;

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

export const VELOCITY_CLASS: LabelMap = {
  fast: { label: 'Bán nhanh', tone: 'progress' },
  medium: { label: 'Trung bình', tone: 'info' },
  slow: { label: 'Bán chậm', tone: 'neutral' },
  unclassified: { label: 'Chưa phân loại', tone: 'neutral' },
};

export const CRITICALITY_LEVEL: LabelMap = {
  critical: { label: 'Thiết yếu', tone: 'danger' },
  non_critical: { label: 'Thông thường', tone: 'neutral' },
};

export const DISCOUNT_TYPE_LABEL: Record<string, string> = {
  percent: 'Phần trăm',
  fixed_amount: 'Số tiền cố định',
};

export const INVOICE_ITEM_TYPE_LABEL: Record<string, string> = {
  consultation_fee: 'Phí khám',
  service: 'Dịch vụ',
  medicine: 'Thuốc',
  other: 'Khác',
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

export const TRANSACTION_STATUS: LabelMap = {
  pending: { label: 'Đang xử lý', tone: 'warning' },
  success: { label: 'Thành công', tone: 'success' },
  failed: { label: 'Thất bại', tone: 'danger' },
  cancelled: { label: 'Đã huỷ', tone: 'neutral' },
};

export const PATIENT_CREATED_VIA_LABEL: Record<string, string> = {
  self_registered: 'Tự đăng ký',
  admin_created: 'Tạo tại quầy',
};
