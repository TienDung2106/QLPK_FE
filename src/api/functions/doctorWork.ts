import { DeleteData, GetBlob, GetData, PostData } from '../helpers';
import url from '../url';
import type { Appointment, AppointmentAttachment, AppointmentListItem, PagedResponse } from '../types';
import type {
  AppointmentQuery,
  DoctorDashboard,
  DoctorSchedule,
  DoctorScheduleQuery,
  FollowUpPayload,
  TimeOff,
  TimeOffPayload,
  TimeOffQuery,
} from '../staffTypes';

/** Lịch của chính bác sĩ đang đăng nhập — appointments.view_own_schedule. */
export const apiGetDoctorSchedule = (query: AppointmentQuery = {}) =>
  GetData<PagedResponse<AppointmentListItem>>(url.doctorAppointments, query);

/** Các con số đầu trang của bác sĩ: hôm nay, chờ xác nhận, đang chờ, người kế tiếp. */
export const apiGetDoctorDashboard = () => GetData<DoctorDashboard>(url.doctorDashboard);

/** Ảnh bệnh nhân gửi kèm lịch hẹn của chính bác sĩ — appointments.view_own_schedule. */
export const apiGetDoctorAttachments = (appointmentId: number) =>
  GetData<AppointmentAttachment[]>(url.doctorAppointmentAttachments(appointmentId));

export const apiGetDoctorAttachmentContent = (appointmentId: number, attachmentId: number) =>
  GetBlob(url.doctorAttachmentContent(appointmentId, attachmentId));

/** Đánh dấu đã khám xong lịch đã nhận phòng — examinations.perform. Sau đó mới hẹn tái khám được. */
export const apiCompleteAppointment = (appointmentId: number) =>
  PostData<Appointment>(url.doctorAppointmentAction(appointmentId, 'complete'));

/** Hẹn tái khám — appointments.book_follow_up. Xác nhận luôn. */
export const apiBookFollowUp = (appointmentId: number, payload: FollowUpPayload) =>
  PostData<Appointment>(url.doctorAppointmentAction(appointmentId, 'follow-up'), payload);

/* Giờ làm việc — doctor_schedules.manage_own */

export const apiGetOwnWorkingHours = (query: DoctorScheduleQuery = {}) =>
  GetData<DoctorSchedule[]>(url.doctorWorkingHours, query);

/* Báo nghỉ — doctor_time_off.report_own */

export const apiGetOwnTimeOff = (query: TimeOffQuery = {}) => GetData<TimeOff[]>(url.doctorTimeOff, query);

export const apiReportOwnTimeOff = (payload: TimeOffPayload) => PostData<TimeOff>(url.doctorTimeOff, payload);

/** Chỉ rút được ngày nghỉ chưa tới; slot mở lại ngay. */
export const apiWithdrawOwnTimeOff = (timeOffId: number) => DeleteData<void>(url.doctorTimeOffById(timeOffId));
