import { GetData, PostData, PostWithCaptcha } from '../helpers';
import url from '../url';
import type { Appointment, AppointmentListItem, CheckInResult, PagedResponse } from '../types';

export interface AppointmentQuery {
  doctor_id?: number;
  from_date?: string;
  to_date?: string;
  status?: string;
  page_number?: number;
  page_size?: number;
}

export interface BookAppointmentPayload {
  patient_id: number;
  doctor_id: number;
  /** 'yyyy-MM-dd'. */
  appointment_date: string;
  /** 'HH:mm:ss', phải trùng đúng start_time của một slot còn trống. */
  appointment_time: string;
  consultation_mode?: string;
  visit_type?: string;
  reason_for_visit?: string;
  primary_service_id?: number;
  services: { service_id: number; quantity: number }[];
  promotion_code?: string;
}

export const apiGetMyAppointments = (query: AppointmentQuery = {}) =>
  GetData<PagedResponse<AppointmentListItem>>(url.patientAppointments, query);

export const apiGetAppointment = (appointmentId: number) =>
  GetData<Appointment>(url.patientAppointmentById(appointmentId));

/**
 * Đặt lịch. Trả 201 khi xong hẳn, hoặc **202** khi mức giảm giá vượt ngưỡng và lịch phải
 * chờ người duyệt (UC-04 E3) — người gọi phải phân biệt hai trường hợp qua `status`.
 * 409 nghĩa là slot vừa bị người khác lấy mất.
 */
export const apiBookAppointment = (payload: BookAppointmentPayload, captchaToken: string | null) =>
  PostWithCaptcha<Appointment>(url.patientAppointments, payload, captchaToken);

export const apiCancelAppointment = (appointmentId: number, reason: string) =>
  PostData<Appointment>(url.cancelAppointment(appointmentId), { reason });

/** Tự nhận phòng bằng mã check-in, trả về số thứ tự hàng đợi (FR-BOOK-14). */
export const apiCheckIn = (checkInCode: string) =>
  PostData<CheckInResult>(url.checkIn, { check_in_code: checkInCode });
