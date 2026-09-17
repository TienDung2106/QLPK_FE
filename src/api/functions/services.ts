import { GetData, PostData } from '../helpers';
import url from '../url';
import type {
  AvailablePromotion,
  BookingQuote,
  ClinicService,
  PagedResponse,
} from '../types';

export interface ServiceQuery {
  search?: string;
  service_group?: string;
  page_number?: number;
  page_size?: number;
}

/**
 * Danh mục dịch vụ đang hoạt động. Giá ở đây chính là giá backend đọc lại lúc chốt hoá
 * đơn, nên hiển thị thẳng con số này là hiển thị đúng số tiền sẽ bị tính (FR-BOOK-05).
 */
export const apiGetServices = (query: ServiceQuery = {}) =>
  GetData<PagedResponse<ClinicService>>(url.services, { page_size: 50, ...query });

export interface BookingQuoteLine {
  service_id: number;
  quantity: number;
}

/**
 * Báo giá giỏ dịch vụ: tạm tính, voucher tốt nhất được tự áp (chỉ một), tổng tiền, số phút
 * lượt khám chiếm trong ca và mức voucher kế tiếp. Server tính lại y hệt khi đặt lịch.
 */
export const apiGetBookingQuote = (services: BookingQuoteLine[], patientId?: number | null) =>
  PostData<BookingQuote>(url.bookingQuote, { services, patient_id: patientId ?? undefined });

/** Voucher đang chạy, mức chi tiêu thấp nhất trước. Chỉ để xem — hệ thống tự áp mã tốt nhất. */
export const apiGetBookingPromotions = (patientId?: number | null) =>
  GetData<AvailablePromotion[]>(url.bookingPromotions, { patient_id: patientId ?? undefined });
