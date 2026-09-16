import { GetData, PostData, PutData } from '../helpers';
import url from '../url';
import type { AppointmentListItem, CheckInResult, DoctorAvailability, PagedResponse } from '../types';
import type {
  ApplyDiscountPayload,
  ApplyDiscountResult,
  AppointmentQuery,
  BookOnBehalfPayload,
  ConfirmPaymentResult,
  DeskPatient,
  DeskPatientPayload,
  DeskPatientQuery,
  Invoice,
  InvoiceListItem,
  InvoiceQuery,
  NewSlotPayload,
  PaymentPayload,
  PostponePayload,
  RegisterDeskPatientPayload,
  SettlementQueueItem,
  SettlementQueueQuery,
  StaffAppointment,
  TimeOff,
  TimeOffPayload,
  TimeOffQuery,
  WalkInPayload,
} from '../staffTypes';

/* Lịch hẹn — appointments.manage (lễ tân / thu ngân, admin) */

export const apiSearchStaffAppointments = (query: AppointmentQuery = {}) =>
  GetData<PagedResponse<AppointmentListItem>>(url.staffAppointments, query);

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

export const apiConfirmAppointmentPayment = (appointmentId: number, payload: PaymentPayload) =>
  PostData<ConfirmPaymentResult>(url.staffAppointmentAction(appointmentId, 'confirm-payment'), payload);

/* Bác sĩ, nhìn từ quầy */

export const apiGetStaffDoctorSlots = (doctorId: number, date: string) =>
  GetData<DoctorAvailability>(url.staffDoctorSlots(doctorId), { date });

export const apiGetDoctorTimeOff = (doctorId: number, query: TimeOffQuery = {}) =>
  GetData<TimeOff[]>(url.staffDoctorTimeOff(doctorId), query);

export const apiRecordDoctorTimeOff = (doctorId: number, payload: TimeOffPayload) =>
  PostData<TimeOff>(url.staffDoctorTimeOff(doctorId), payload);

/* Bệnh nhân — patients.manage */

export const apiSearchDeskPatients = (query: DeskPatientQuery = {}) =>
  GetData<PagedResponse<DeskPatient>>(url.staffPatients, query);

export const apiGetDeskPatient = (patientId: number) => GetData<DeskPatient>(url.staffPatientById(patientId));

export const apiRegisterDeskPatient = (payload: RegisterDeskPatientPayload) =>
  PostData<DeskPatient>(url.staffPatients, payload);

export const apiUpdateDeskPatient = (patientId: number, payload: DeskPatientPayload) =>
  PutData<DeskPatient>(url.staffPatientById(patientId), payload);

/* Thanh toán — payments.manage */

export const apiSearchSettlementQueue = (query: SettlementQueueQuery = {}) =>
  GetData<PagedResponse<SettlementQueueItem>>(url.staffDispenseRequests, query);

/** Lập (hoặc lập lại) hoá đơn quyết toán cho một lượt khám đã xong. */
export const apiBuildSettlementInvoice = (appointmentId: number) =>
  PostData<Invoice>(url.staffSettlementInvoice(appointmentId));

export const apiSearchInvoices = (query: InvoiceQuery = {}) =>
  GetData<PagedResponse<InvoiceListItem>>(url.staffInvoices, query);

export const apiGetInvoice = (invoiceId: number) => GetData<Invoice>(url.staffInvoiceById(invoiceId));

/** Không gửi số tiền: backend thu đúng phần còn nợ. */
export const apiCollectPayment = (invoiceId: number, payload: PaymentPayload) =>
  PostData<Invoice>(url.staffInvoicePayments(invoiceId), payload);

/** Không gửi số tiền: backend hoàn đúng phần thu dư. */
export const apiRefundInvoice = (invoiceId: number, payload: PaymentPayload) =>
  PostData<Invoice>(url.staffInvoiceRefunds(invoiceId), payload);
