import { DeleteData, GetBlob, GetData, PatchData, PostData, PutData } from '../helpers';
import url from '../url';
import type { AppointmentListItem, CheckInResult, DoctorAvailability, DoctorListItem, PagedResponse } from '../types';
import type { AlternativesQuery } from './doctors';
import type {
  ApplyDiscountPayload,
  ApplyDiscountResult,
  AppointmentQuery,
  BookOnBehalfPayload,
  DeskPatient,
  DoctorCalendar,
  LinkPatientAccountPayload,
  StaffPromotion,
  DeskPatientPayload,
  DeskPatientQuery,
  NewSlotPayload,
  PageQuery,
  PostponePayload,
  RegisterDeskPatientPayload,
  StaffAppointment,
  StaffTimeOff,
  TimeOff,
  TimeOffPayload,
  TimeOffQuery,
  WalkInPayload,
} from '../staffTypes';

/* Lịch hẹn — appointments.manage (lễ tân, admin) */

export const apiSearchStaffAppointments = (query: AppointmentQuery = {}) =>
  GetData<PagedResponse<AppointmentListItem>>(url.staffAppointments, query);

/** Xuất Excel mọi lịch khớp bộ lọc, không chỉ trang đang xem. */
export const apiExportStaffAppointments = (query: AppointmentQuery = {}) =>
  GetBlob(url.staffAppointmentsExport, query);

export const apiGetStaffAppointment = (appointmentId: number) =>
  GetData<StaffAppointment>(url.staffAppointmentById(appointmentId));

/** 201 xong hẳn, 202 khi mức giảm vượt ngưỡng và phải chờ duyệt. */
export const apiBookOnBehalf = (payload: BookOnBehalfPayload) =>
  PostData<StaffAppointment>(url.staffAppointments, payload);

/** Khách vãng lai: đặt lịch hôm nay và nhận phòng luôn. */
export const apiBookWalkIn = (payload: WalkInPayload) => PostData<StaffAppointment>(url.staffWalkIns, payload);

export const apiStaffCheckIn = (checkInCode: string) =>
  PostData<CheckInResult>(url.staffCheckIn, { check_in_code: checkInCode });

export const apiStaffCancelAppointment = (appointmentId: number, reason: string) =>
  PostData<StaffAppointment>(url.staffAppointmentAction(appointmentId, 'cancel'), { reason });

/** Xác nhận lịch bệnh nhân tự đặt để có thể nhận phòng. */
export const apiStaffConfirmAppointment = (appointmentId: number) =>
  PostData<StaffAppointment>(url.staffAppointmentAction(appointmentId, 'confirm'));

/** Từ chối lịch đang chờ và hoàn toàn bộ tiền trả trước. */
export const apiStaffDeclineAppointment = (appointmentId: number, reason: string) =>
  PostData<StaffAppointment>(url.staffAppointmentAction(appointmentId, 'decline'), { reason });

export const apiMarkNoShow = (appointmentId: number) =>
  PostData<StaffAppointment>(url.staffAppointmentAction(appointmentId, 'no-show'));

export const apiPostponeAppointment = (appointmentId: number, payload: PostponePayload) =>
  PostData<StaffAppointment>(url.staffAppointmentAction(appointmentId, 'postpone'), payload);

export const apiAcceptReschedule = (appointmentId: number) =>
  PostData<StaffAppointment>(url.staffAppointmentAction(appointmentId, 'accept-reschedule'));

export const apiChooseRescheduleSlot = (appointmentId: number, payload: NewSlotPayload) =>
  PostData<StaffAppointment>(url.staffAppointmentAction(appointmentId, 'choose-slot'), payload);

/** Mã khuyến mãi HOẶC phần trăm, không gửi cả hai. 202 = cần người có quyền duyệt. */
export const apiApplyDiscount = (appointmentId: number, payload: ApplyDiscountPayload) =>
  PostData<ApplyDiscountResult>(url.staffAppointmentAction(appointmentId, 'apply-discount'), payload);

export const apiApproveDiscount = (appointmentId: number) =>
  PostData<ApplyDiscountResult>(url.staffAppointmentAction(appointmentId, 'approve-discount'));


/* Bác sĩ, nhìn từ quầy */

/** Bác sĩ đang nhận lịch, kèm ca làm việc trong tuần — cho ô chọn bác sĩ ở quầy. */
export const apiGetStaffDoctors = () =>
  GetData<PagedResponse<DoctorListItem>>(url.staffDoctors, { page_size: 100 });

/** Bác sĩ khác cùng chuyên khoa còn ca trống — khi ca đã chọn vừa kín (409 slot_taken). */
export const apiGetStaffDoctorAlternatives = (query: AlternativesQuery) =>
  GetData<DoctorAvailability[]>(url.staffDoctorAlternatives, query);

export const apiGetStaffDoctorSlots = (doctorId: number, date: string, durationMinutes?: number) =>
  GetData<DoctorAvailability>(url.staffDoctorSlots(doctorId), { date, duration_minutes: durationMinutes });

/** Cả tháng chứa `month` ('yyyy-MM-dd' bất kỳ trong tháng), mỗi ngày một trạng thái. */
export const apiGetStaffDoctorCalendar = (doctorId: number, month: string) =>
  GetData<DoctorCalendar>(url.staffDoctorCalendar(doctorId), { month });

export const apiGetDoctorTimeOff = (doctorId: number, query: TimeOffQuery = {}) =>
  GetData<TimeOff[]>(url.staffDoctorTimeOff(doctorId), query);

export const apiRecordDoctorTimeOff = (doctorId: number, payload: TimeOffPayload) =>
  PostData<TimeOff>(url.staffDoctorTimeOff(doctorId), payload);

/** Chỉ admin (doctor_schedules.manage); lễ tân ghi hộ được nhưng không rút được. */
export const apiWithdrawDoctorTimeOff = (doctorId: number, timeOffId: number) =>
  DeleteData<void>(url.staffDoctorTimeOffById(doctorId, timeOffId));

/* Lễ tân tự báo nghỉ — staff_time_off.report_own */

export const apiGetOwnStaffTimeOff = (query: TimeOffQuery = {}) => GetData<StaffTimeOff[]>(url.staffTimeOff, query);

export const apiReportOwnStaffTimeOff = (payload: TimeOffPayload) => PostData<StaffTimeOff>(url.staffTimeOff, payload);

export const apiWithdrawOwnStaffTimeOff = (timeOffId: number) => DeleteData<void>(url.staffTimeOffById(timeOffId));

/** Mã khuyến mãi đang áp dụng được hôm nay — discount.apply_within_threshold. */
export const apiSearchStaffPromotions = (query: { search?: string } & PageQuery = {}) =>
  GetData<PagedResponse<StaffPromotion>>(url.staffPromotions, query);

/* Bệnh nhân — patients.manage */

export const apiSearchDeskPatients = (query: DeskPatientQuery = {}) =>
  GetData<PagedResponse<DeskPatient>>(url.staffPatients, query);

export const apiGetDeskPatient = (patientId: number) => GetData<DeskPatient>(url.staffPatientById(patientId));

export const apiRegisterDeskPatient = (payload: RegisterDeskPatientPayload) =>
  PostData<DeskPatient>(url.staffPatients, payload);

export const apiUpdateDeskPatient = (patientId: number, payload: DeskPatientPayload) =>
  PutData<DeskPatient>(url.staffPatientById(patientId), payload);

/** Gửi mã xác nhận tới email chủ tài khoản đích; phải có mã này mới liên kết được. */
export const apiRequestLinkPatientCode = (patientId: number, payload: LinkPatientAccountPayload) =>
  PostData<void>(url.staffPatientLinkAccountCode(patientId), payload);

/** Chuyển hồ sơ tạo tại quầy sang tài khoản bệnh nhân tự đăng ký sau này. */
export const apiLinkPatientAccount = (patientId: number, payload: LinkPatientAccountPayload) =>
  PatchData<DeskPatient>(url.staffPatientLinkAccount(patientId), payload);
