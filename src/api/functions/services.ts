import { GetData } from '../helpers';
import url from '../url';
import type { ClinicService, PagedResponse } from '../types';

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
