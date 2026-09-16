import { DeleteData, GetData, PatchData, PostData, PutData } from '../helpers';
import url from '../url';
import type { Appointment, AppointmentListItem, PagedResponse } from '../types';
import type {
  AppointmentQuery,
  DoctorDashboard,
  DoctorSchedule,
  DoctorSchedulePayload,
  DoctorScheduleQuery,
  FollowUpPayload,
  ExaminationStatus,
  MedicalRecord,
  MedicalRecordPayload,
  PageQuery,
  PrescribableMedicine,
  Prescription,
  TimeOff,
  TimeOffPayload,
  TimeOffQuery,
  WritePrescriptionPayload,
} from '../staffTypes';

/** Lịch của chính bác sĩ đang đăng nhập — appointments.view_own_schedule. */
export const apiGetDoctorSchedule = (query: AppointmentQuery = {}) =>
  GetData<PagedResponse<AppointmentListItem>>(url.doctorAppointments, query);

/** Các con số đầu trang của bác sĩ: hôm nay, chờ xác nhận, đang chờ, người kế tiếp. */
export const apiGetDoctorDashboard = () => GetData<DoctorDashboard>(url.doctorDashboard);

/* Trả lời lịch đặt — appointments.confirm_own; chỉ lịch đặt với chính bác sĩ. */

export const apiDoctorConfirmAppointment = (appointmentId: number) =>
  PostData<Appointment>(url.doctorAppointmentAction(appointmentId, 'confirm'));

/** Hoàn toàn bộ tiền đã trả trước: phòng khám từ chối, bệnh nhân không có lỗi. */
export const apiDoctorDeclineAppointment = (appointmentId: number, reason: string) =>
  PostData<Appointment>(url.doctorAppointmentAction(appointmentId, 'decline'), { reason });

/** Hẹn tái khám — appointments.book_follow_up. Xác nhận luôn, mang theo liệu trình nếu có. */
export const apiBookFollowUp = (appointmentId: number, payload: FollowUpPayload) =>
  PostData<Appointment>(url.doctorAppointmentAction(appointmentId, 'follow-up'), payload);

/* Giờ làm việc — doctor_schedules.manage_own */

export const apiGetOwnWorkingHours = (query: DoctorScheduleQuery = {}) =>
  GetData<DoctorSchedule[]>(url.doctorWorkingHours, query);

export const apiCreateOwnWorkingHours = (payload: DoctorSchedulePayload) =>
  PostData<DoctorSchedule>(url.doctorWorkingHours, payload);

export const apiUpdateOwnWorkingHours = (scheduleId: number, payload: DoctorSchedulePayload) =>
  PutData<DoctorSchedule>(url.doctorWorkingHoursById(scheduleId), payload);

export const apiSetOwnWorkingHoursStatus = (scheduleId: number, isActive: boolean) =>
  PatchData<DoctorSchedule>(url.doctorWorkingHoursStatus(scheduleId), { is_active: isActive });

/* Khám bệnh — examinations.perform; backend chỉ cho khám lịch của chính mình. */

export const apiStartExamination = (appointmentId: number) =>
  PostData<ExaminationStatus>(url.doctorStartExamination(appointmentId));

/** 404 khi chưa ghi bệnh án lần nào — không phải lỗi, chỉ là form trống. */
export const apiGetMedicalRecord = (appointmentId: number) =>
  GetData<MedicalRecord>(url.doctorMedicalRecord(appointmentId));

export const apiSaveMedicalRecord = (appointmentId: number, payload: MedicalRecordPayload) =>
  PutData<MedicalRecord>(url.doctorMedicalRecord(appointmentId), payload);

export const apiWritePrescription = (appointmentId: number, payload: WritePrescriptionPayload) =>
  PutData<Prescription>(url.doctorPrescription(appointmentId), payload);

export const apiDeletePrescription = (appointmentId: number) =>
  DeleteData<void>(url.doctorPrescription(appointmentId));

export const apiCompleteExamination = (appointmentId: number) =>
  PostData<ExaminationStatus>(url.doctorCompleteExamination(appointmentId));

export const apiGetPatientHistory = (patientId: number, query: PageQuery = {}) =>
  GetData<PagedResponse<MedicalRecord>>(url.doctorPatientHistory(patientId), query);

export const apiSearchPrescribableMedicines = (query: { search?: string } & PageQuery = {}) =>
  GetData<PagedResponse<PrescribableMedicine>>(url.doctorMedicines, query);

/* Báo nghỉ — doctor_time_off.report_own */

export const apiGetOwnTimeOff = (query: TimeOffQuery = {}) => GetData<TimeOff[]>(url.doctorTimeOff, query);

export const apiReportOwnTimeOff = (payload: TimeOffPayload) => PostData<TimeOff>(url.doctorTimeOff, payload);

/** Chỉ rút được ngày nghỉ chưa tới; slot mở lại ngay. */
export const apiWithdrawOwnTimeOff = (timeOffId: number) => DeleteData<void>(url.doctorTimeOffById(timeOffId));
