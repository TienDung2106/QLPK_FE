import { DeleteData, GetData, PostData, PutData } from '../helpers';
import url from '../url';
import type { AppointmentListItem, PagedResponse } from '../types';
import type {
  AppointmentQuery,
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
