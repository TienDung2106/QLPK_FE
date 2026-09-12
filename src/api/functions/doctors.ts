import { GetData } from '../helpers';
import url from '../url';
import type { DoctorAvailability, DoctorListItem, PagedResponse } from '../types';

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

/** Slot còn trống của một bác sĩ trong đúng một ngày. `date` dạng 'yyyy-MM-dd'. */
export const apiGetDoctorSlots = (doctorId: number, date: string) =>
  GetData<DoctorAvailability>(url.doctorAvailableSlots(doctorId), { date });
