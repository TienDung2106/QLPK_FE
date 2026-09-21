import { GetData } from '../helpers';
import url from '../url';
import type { DoctorAvailability, DoctorListItem, PagedResponse } from '../types';
import type { DoctorCalendar } from '../staffTypes';

export interface DoctorQuery {
  specialty_id?: number;
  search?: string;
  page_number?: number;
  page_size?: number;
}

/**
 * Danh bạ bác sĩ bệnh nhân được đặt — bước 1 của luồng đặt lịch.
 * Cần đăng nhập: backend gắn quyền appointments.book_own, cùng quyền với việc xem slot,
 * nên mọi bác sĩ hiện ở đây đều là người `apiGetDoctorSlots` sẽ trả lời được.
 */
export const apiGetDoctors = (query: DoctorQuery = {}) =>
  GetData<PagedResponse<DoctorListItem>>(url.doctors, query);

/**
 * Các ca của một bác sĩ trong đúng một ngày, kèm mức đầy. `date` dạng 'yyyy-MM-dd'.
 * `durationMinutes` lấy từ báo giá: ca nào không đủ phút cho lượt khám sẽ báo `is_available = false`.
 */
export const apiGetDoctorSlots = (doctorId: number, date: string, durationMinutes?: number) =>
  GetData<DoctorAvailability>(url.doctorAvailableSlots(doctorId), { date, duration_minutes: durationMinutes });

export interface AlternativesQuery {
  specialty_id: number;
  /** 'yyyy-MM-dd'. */
  date: string;
  /** 'HH:mm:ss' — chỉ lấy ca bao trùm giờ này. */
  time?: string;
  duration_minutes?: number;
  exclude_doctor_id?: number;
}

/** Bác sĩ khác cùng chuyên khoa còn ca trống ngày đó — dùng khi ca đã chọn vừa kín (409 slot_taken). */
export const apiGetDoctorAlternatives = (query: AlternativesQuery) =>
  GetData<DoctorAvailability[]>(url.doctorAlternatives, query);

/** Cả tháng chứa `month` ('yyyy-MM-dd' bất kỳ trong tháng): ngày còn ca nhận được lượt khám, kín, nghỉ. */
export const apiGetDoctorCalendar = (doctorId: number, month: string, durationMinutes?: number) =>
  GetData<DoctorCalendar>(url.doctorCalendar(doctorId), { month, duration_minutes: durationMinutes });
