import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import httpClient from './httpClient';

/**
 * Kết quả đã chuẩn hoá của một lời gọi API.
 *
 * Mọi helper dưới đây bắt lỗi và trả về shape này thay vì ném ra, nên tầng view không
 * phải try/catch — giống `app/apis/helpers.js` bên dcv2. Khác một điểm quan trọng:
 * QLPK API không bọc kết quả trong envelope `{code, data}`; nó dùng HTTP status thật và
 * trả lỗi theo chuẩn ProblemDetails (mục 9.5). Nên `ok` đọc từ status, còn `error` lấy
 * từ ProblemDetails.
 */
export interface ApiResult<T> {
  ok: boolean;
  /** undefined khi request còn chưa đi tới nơi (mất mạng, timeout, CORS chặn). */
  status?: number;
  data: T | null;
  /** Câu tiếng Việt để hiện thẳng cho người dùng. */
  error: string | null;
  /** Mã lỗi ổn định của backend, ví dụ 'slot_taken' — dùng để rẽ nhánh, đừng parse `error`. */
  errorCode: string | null;
  /** Chỉ có ở 429, đọc từ header Retry-After. */
  retryAfterSeconds?: number;
}

/** Lỗi xác thực của ASP.NET: mỗi field một mảng thông điệp. */
interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

const NETWORK_ERROR =
  'Không kết nối được tới máy chủ. Kiểm tra đường truyền rồi thử lại.';
const UNEXPECTED_ERROR = 'Đã có lỗi xảy ra. Vui lòng thử lại.';

/**
 * Câu tiếng Việt cho những thất bại backend có gắn mã lỗi ổn định
 * (QLPK.Service/Common/Exceptions/ErrorCodes.cs).
 *
 * Backend viết `detail` bằng tiếng Anh, và dịch toàn bộ chuỗi đó ở phía server là một
 * thay đổi lớn hơn nhiều. Mã lỗi thì đã được thiết kế để client rẽ nhánh mà không phải
 * đọc văn bản — nên dịch theo mã, và những lỗi chưa có mã thì vẫn hiện nguyên văn
 * backend trả về, chứ không đoán bừa.
 */
const MESSAGE_BY_ERROR_CODE: Record<string, string> = {
  captcha_required: 'Vui lòng hoàn tất ô kiểm tra bảo mật rồi thử lại.',
  slot_taken: 'Khung giờ này vừa có người đặt mất.',
  slot_not_bookable: 'Khung giờ này không nằm trong lịch làm việc của bác sĩ.',
  insufficient_stock: 'Thuốc trong kho không đủ cho yêu cầu này.',
  reservation_expired: 'Phần thuốc giữ chỗ đã hết hạn. Vui lòng đặt lại.',
  discount_approval_required: 'Mức giảm giá này cần phòng khám duyệt.',
  already_checked_in: 'Lịch hẹn này đã được nhận phòng rồi.',
  checkin_window_closed: 'Ngoài khung giờ nhận phòng. Vui lòng liên hệ quầy lễ tân.',
  account_locked: 'Tài khoản đang tạm khoá do đăng nhập sai nhiều lần.',
  invalid_credentials: 'Số điện thoại/email hoặc mật khẩu không đúng.',
  password_policy: 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và chữ số.',
  registration_code_invalid: 'Mã xác thực không đúng hoặc đã hết hạn. Vui lòng lấy mã mới.',
  password_reset_code_invalid: 'Mã đặt lại không đúng hoặc đã hết hạn. Vui lòng lấy mã mới.',
  otp_resend_too_soon: 'Mã vừa được gửi. Vui lòng đợi một lát rồi thử lại.',
  verification_code_not_sent: 'Không gửi được mã xác thực. Vui lòng thử lại sau ít phút.',
};

function describe(problem: ProblemDetails | undefined, status: number | undefined): string {
  if (problem?.errorCode && MESSAGE_BY_ERROR_CODE[problem.errorCode]) {
    return MESSAGE_BY_ERROR_CODE[problem.errorCode];
  }

  // Lỗi validate của [ApiController] nằm trong `errors`, không nằm ở `detail`; lấy thông
  // điệp đầu tiên vì form chỉ có một chỗ để hiện.
  if (problem?.errors) {
    const first = Object.values(problem.errors).flat().find((message) => Boolean(message));
    if (first) {
      return first;
    }
  }

  if (problem?.detail) {
    return problem.detail;
  }

  if (problem?.title) {
    return problem.title;
  }

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (status === 403) {
    return 'Tài khoản của bạn không có quyền thực hiện thao tác này.';
  }

  return UNEXPECTED_ERROR;
}

function toSuccess<T>(status: number, data: T): ApiResult<T> {
  return { ok: true, status, data, error: null, errorCode: null };
}

function toFailure<T>(error: unknown): ApiResult<T> {
  if (!axios.isAxiosError(error)) {
    return { ok: false, status: undefined, data: null, error: UNEXPECTED_ERROR, errorCode: null };
  }

  const status = error.response?.status;

  if (status === undefined) {
    // Không có response: mất mạng, timeout, hoặc trình duyệt chặn vì CORS. Ba trường hợp
    // này không phân biệt được từ phía JavaScript — trình duyệt cố tình giấu chi tiết.
    return { ok: false, status: undefined, data: null, error: NETWORK_ERROR, errorCode: null };
  }

  const problem = error.response?.data as ProblemDetails | undefined;
  const retryAfter = Number(error.response?.headers?.['retry-after']);

  return {
    ok: false,
    status,
    data: null,
    error: describe(problem, status),
    errorCode: problem?.errorCode ?? null,
    retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
  };
}

export async function GetData<T>(
  endpoint: string,
  params?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResult<T>> {
  try {
    const response = await httpClient.get<T>(endpoint, { ...config, params });
    return toSuccess(response.status, response.data);
  } catch (error) {
    return toFailure<T>(error);
  }
}

export async function PostData<T>(
  endpoint: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResult<T>> {
  try {
    const response = await httpClient.post<T>(endpoint, body, config);
    return toSuccess(response.status, response.data);
  } catch (error) {
    return toFailure<T>(error);
  }
}

export async function PutData<T>(
  endpoint: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResult<T>> {
  try {
    const response = await httpClient.put<T>(endpoint, body, config);
    return toSuccess(response.status, response.data);
  } catch (error) {
    return toFailure<T>(error);
  }
}

export async function DeleteData<T>(
  endpoint: string,
  config?: AxiosRequestConfig,
): Promise<ApiResult<T>> {
  try {
    const response = await httpClient.delete<T>(endpoint, config);
    return toSuccess(response.status, response.data);
  } catch (error) {
    return toFailure<T>(error);
  }
}

/** POST không gắn Authorization: đăng nhập, đăng ký, quên mật khẩu. */
export function PostNonToken<T>(endpoint: string, body?: unknown): Promise<ApiResult<T>> {
  return PostData<T>(endpoint, body, { skipAuth: true });
}

/**
 * POST kèm bằng chứng đã qua CAPTCHA. Backend đọc ở header X-Captcha-Token và tiêu thụ
 * token đúng một lần (FR-BOOK-07), nên mỗi request được bảo vệ cần một token mới.
 */
export function PostWithCaptcha<T>(
  endpoint: string,
  body: unknown,
  captchaToken: string | null,
  options: { skipAuth?: boolean } = {},
): Promise<ApiResult<T>> {
  return PostData<T>(endpoint, body, {
    skipAuth: options.skipAuth,
    headers: captchaToken ? { 'X-Captcha-Token': captchaToken } : undefined,
  });
}
