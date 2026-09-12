import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import url from './url';
import type { AuthTokens } from './session';
import { clearSession, expireSession, getAccessToken, getRefreshToken, saveSession } from './session';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Bỏ header Authorization cho request này (login, đăng ký, danh mục công khai). */
    skipAuth?: boolean;
    /** Nội bộ: đánh dấu request đã được thử lại sau khi refresh, để không lặp vô hạn. */
    _retried?: boolean;
  }
}

/**
 * Axios dùng chung cho toàn bộ API.
 *
 * Không đặt `baseURL`: url.ts đã sinh sẵn URL tuyệt đối, giống dcv2 — nhờ vậy chỉ có
 * đúng một chỗ trong ứng dụng biết API nằm ở đâu.
 */
export const httpClient = axios.create({
  timeout: 30 * 1000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Token đọc lại từ localStorage ở mỗi request, không chụp lại lúc tạo instance. Nhờ vậy
// sau khi đăng nhập hay sau khi refresh không phải đồng bộ token vào đâu cả.
httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.skipAuth) {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * Một lần refresh đang chạy, nếu có.
 *
 * Khi một màn hình bắn ba request song song và cả ba cùng gặp 401, ba lần refresh đồng
 * thời sẽ giết nhau: backend xoay vòng refresh token và thu hồi cái cũ (10.4 bước 7),
 * nên cái về đích thứ hai đã cầm token vừa bị thu hồi. Vì thế mọi request cùng chờ
 * chung một promise.
 */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post<AuthTokens>(
      url.refresh,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );

    saveSession(response.data);
    return response.data.access_token;
  } catch {
    // Refresh token hết hạn, đã dùng, hoặc đã bị thu hồi vì đổi mật khẩu.
    clearSession();
    return null;
  }
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;

    // Chỉ 401 mới đáng thử lại. 403 nghĩa là token hợp lệ nhưng thiếu quyền — refresh
    // không đổi được điều đó. Không có `config` thì request còn chưa kịp gửi đi.
    const shouldTryRefresh =
      error.response?.status === 401 &&
      config !== undefined &&
      !config._retried &&
      !config.skipAuth &&
      config.url !== url.refresh;

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    refreshInFlight = refreshInFlight ?? refreshAccessToken();

    let accessToken: string | null;
    try {
      accessToken = await refreshInFlight;
    } finally {
      refreshInFlight = null;
    }

    if (!accessToken) {
      expireSession();
      return Promise.reject(error);
    }

    config._retried = true;
    config.headers.Authorization = `Bearer ${accessToken}`;

    return httpClient(config);
  },
);

export default httpClient;
