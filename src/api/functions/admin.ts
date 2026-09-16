import { GetData, PatchData, PostData, PutData } from '../helpers';
import url from '../url';
import type { PagedResponse } from '../types';
import type {
  AdminService,
  AdminServicePayload,
  AdminServiceQuery,
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

/* Cài đặt — settings.manage. Backend không có API liệt kê: đọc theo từng khoá. */

export const apiGetSetting = (settingKey: string) => GetData<SystemSetting>(url.adminSettingByKey(settingKey));

export const apiUpdateSetting = (settingKey: string, payload: UpdateSettingPayload) =>
  PutData<SystemSetting>(url.adminSettingByKey(settingKey), payload);

/* Báo cáo — reports.view_revenue. Cả hai ngày bắt buộc, tối đa 366 ngày. */

export const apiGetRevenueReport = (fromDate: string, toDate: string) =>
  GetData<RevenueReport>(url.adminRevenueReport, { from_date: fromDate, to_date: toDate });
