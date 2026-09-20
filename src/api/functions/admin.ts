import { DeleteData, GetData, PatchData, PostData, PutData } from '../helpers';
import url from '../url';
import type { PagedResponse } from '../types';
import type {
  AdminService,
  AdminServicePayload,
  AdminServiceQuery,
  AppointmentReport,
  ClinicDashboard,
  ClinicHoliday,
  ClinicHolidayPayload,
  ClinicHolidayQuery,
  ClinicProfile,
  ClinicProfilePayload,
  DoctorSchedule,
  DoctorSchedulePayload,
  DoctorScheduleQuery,
  Specialty,
  SpecialtyPayload,
  CreateStaffAccountPayload,
  Promotion,
  PromotionPayload,
  PromotionQuery,
  RevenueReport,
  StaffAccount,
  StaffAccountListItem,
  StaffAccountQuery,
  SystemSetting,
  UpdateSettingPayload,
  UpdateStaffAccountPayload,
} from '../staffTypes';

/* Tài khoản nhân viên — accounts.manage_staff */

export const apiSearchStaffAccounts = (query: StaffAccountQuery = {}) =>
  GetData<PagedResponse<StaffAccountListItem>>(url.adminStaffAccounts, query);

export const apiGetStaffAccount = (accountId: number) =>
  GetData<StaffAccount>(url.adminStaffAccountById(accountId));

/** Tài khoản mới luôn bị buộc đổi mật khẩu ở lần đăng nhập đầu. */
export const apiCreateStaffAccount = (payload: CreateStaffAccountPayload) =>
  PostData<StaffAccount>(url.adminStaffAccounts, payload);

export const apiUpdateStaffAccount = (accountId: number, payload: UpdateStaffAccountPayload) =>
  PutData<StaffAccount>(url.adminStaffAccountById(accountId), payload);

/** Buộc đổi mật khẩu ở lần đăng nhập tới và đăng xuất mọi phiên. Không dùng cho chính mình. */
export const apiResetStaffPassword = (accountId: number, temporaryPassword: string) =>
  PostData<StaffAccount>(url.adminStaffAccountResetPassword(accountId), { temporary_password: temporaryPassword });

export const apiSetStaffAccountStatus = (accountId: number, isActive: boolean) =>
  PatchData<StaffAccount>(url.adminStaffAccountStatus(accountId), { is_active: isActive });

/* Dịch vụ — services.manage */

export const apiSearchAdminServices = (query: AdminServiceQuery = {}) =>
  GetData<PagedResponse<AdminService>>(url.adminServices, query);

export const apiCreateAdminService = (payload: AdminServicePayload) =>
  PostData<AdminService>(url.adminServices, payload);

export const apiUpdateAdminService = (serviceId: number, payload: AdminServicePayload) =>
  PutData<AdminService>(url.adminServiceById(serviceId), payload);

export const apiSetAdminServiceStatus = (serviceId: number, isActive: boolean) =>
  PatchData<AdminService>(url.adminServiceStatus(serviceId), { is_active: isActive });

/* Khuyến mãi — promotions.manage */

export const apiSearchPromotions = (query: PromotionQuery = {}) =>
  GetData<PagedResponse<Promotion>>(url.adminPromotions, query);

export const apiCreatePromotion = (payload: PromotionPayload) =>
  PostData<Promotion>(url.adminPromotions, payload);

export const apiUpdatePromotion = (promotionId: number, payload: PromotionPayload) =>
  PutData<Promotion>(url.adminPromotionById(promotionId), payload);

export const apiSetPromotionStatus = (promotionId: number, isActive: boolean) =>
  PatchData<Promotion>(url.adminPromotionStatus(promotionId), { is_active: isActive });

/* Cài đặt — settings.manage. Liệt kê qua /admin/clinic/settings, ghi từng khoá. */

export const apiListSettings = () => GetData<SystemSetting[]>(url.adminClinicSettings);

export const apiUpdateSetting = (settingKey: string, payload: UpdateSettingPayload) =>
  PutData<SystemSetting>(url.adminSettingByKey(settingKey), payload);

/* Báo cáo — reports.view_revenue. Cả hai ngày bắt buộc, tối đa 366 ngày. */

export const apiGetRevenueReport = (fromDate: string, toDate: string) =>
  GetData<RevenueReport>(url.adminRevenueReport, { from_date: fromDate, to_date: toDate });

export const apiGetAppointmentReport = (fromDate: string, toDate: string) =>
  GetData<AppointmentReport>(url.adminAppointmentReport, { from_date: fromDate, to_date: toDate });

/** Bỏ trống ngày = hôm nay. */
export const apiGetClinicDashboard = (date?: string) => GetData<ClinicDashboard>(url.adminDashboard, { date });

/* Giờ làm việc của bác sĩ — doctor_schedules.manage */

export const apiGetDoctorSchedules = (doctorId: number, query: DoctorScheduleQuery = {}) =>
  GetData<DoctorSchedule[]>(url.adminDoctorSchedules(doctorId), query);

export const apiCreateDoctorSchedule = (doctorId: number, payload: DoctorSchedulePayload) =>
  PostData<DoctorSchedule>(url.adminDoctorSchedules(doctorId), payload);

export const apiUpdateDoctorSchedule = (doctorId: number, scheduleId: number, payload: DoctorSchedulePayload) =>
  PutData<DoctorSchedule>(url.adminDoctorScheduleById(doctorId, scheduleId), payload);

export const apiSetDoctorScheduleStatus = (doctorId: number, scheduleId: number, isActive: boolean) =>
  PatchData<DoctorSchedule>(url.adminDoctorScheduleStatus(doctorId, scheduleId), { is_active: isActive });

/* Phòng khám — settings.manage */

export const apiGetClinicProfile = () => GetData<ClinicProfile>(url.adminClinicProfile);

export const apiUpdateClinicProfile = (payload: ClinicProfilePayload) =>
  PutData<ClinicProfile>(url.adminClinicProfile, payload);

export const apiSearchHolidays = (query: ClinicHolidayQuery = {}) =>
  GetData<ClinicHoliday[]>(url.adminClinicHolidays, query);

export const apiCreateHoliday = (payload: ClinicHolidayPayload) => PostData<ClinicHoliday>(url.adminClinicHolidays, payload);

export const apiUpdateHoliday = (holidayId: number, payload: ClinicHolidayPayload) =>
  PutData<ClinicHoliday>(url.adminClinicHolidayById(holidayId), payload);

/** Mở cửa lại ngày đó; bản ghi được giữ với is_active = false. */
export const apiWithdrawHoliday = (holidayId: number) => DeleteData<ClinicHoliday>(url.adminClinicHolidayById(holidayId));

/* Chuyên khoa — services.manage */

export const apiListSpecialties = () => GetData<Specialty[]>(url.adminSpecialties);

export const apiCreateSpecialty = (payload: SpecialtyPayload) => PostData<Specialty>(url.adminSpecialties, payload);

export const apiUpdateSpecialty = (specialtyId: number, payload: SpecialtyPayload) =>
  PutData<Specialty>(url.adminSpecialtyById(specialtyId), payload);

/** Bị từ chối (409) khi còn bác sĩ thuộc chuyên khoa. */
export const apiDeleteSpecialty = (specialtyId: number) => DeleteData<void>(url.adminSpecialtyById(specialtyId));
