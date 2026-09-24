import { DeleteData, GetBlob, GetData, PostData, PutData } from '../helpers';
import url from '../url';
import type { Appointment, AppointmentAttachment, AppointmentListItem, PagedResponse } from '../types';
import type {
  AppointmentQuery,
  DoctorDashboard,
  DoctorSchedule,
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

/** Hẹn tái khám — appointments.book_follow_up. Xác nhận luôn, mang theo liệu trình nếu có. */
export const apiBookFollowUp = (appointmentId: number, payload: FollowUpPayload) =>
  PostData<Appointment>(url.doctorAppointmentAction(appointmentId, 'follow-up'), payload);

/* Giờ làm việc — doctor_schedules.manage_own */

export const apiGetOwnWorkingHours = (query: DoctorScheduleQuery = {}) =>
  GetData<DoctorSchedule[]>(url.doctorWorkingHours, query);

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

export const apiSearchPrescribableMedicines = (
  query: { search?: string; medicine_group?: string; in_stock_only?: boolean } & PageQuery = {},
) => GetData<PagedResponse<PrescribableMedicine>>(url.doctorMedicines, query);

/** Các nhóm thuốc đang có, cho dropdown lọc khi kê đơn. */
export const apiGetPrescribableMedicineGroups = () => GetData<string[]>(url.doctorMedicineGroups);

/* Báo nghỉ — doctor_time_off.report_own */

export const apiGetOwnTimeOff = (query: TimeOffQuery = {}) => GetData<TimeOff[]>(url.doctorTimeOff, query);

export const apiReportOwnTimeOff = (payload: TimeOffPayload) => PostData<TimeOff>(url.doctorTimeOff, payload);

/** Chỉ rút được ngày nghỉ chưa tới; slot mở lại ngay. */
export const apiWithdrawOwnTimeOff = (timeOffId: number) => DeleteData<void>(url.doctorTimeOffById(timeOffId));

/** Ảnh bệnh nhân gửi kèm lịch hẹn của chính bác sĩ. */
export const apiGetDoctorAttachments = (appointmentId: number) =>
  GetData<AppointmentAttachment[]>(url.doctorAppointmentAttachments(appointmentId));

export const apiGetDoctorAttachmentContent = (appointmentId: number, attachmentId: number) =>
  GetBlob(url.doctorAttachmentContent(appointmentId, attachmentId));
