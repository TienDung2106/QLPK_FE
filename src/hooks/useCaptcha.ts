import { useCallback, useRef, useState } from 'react';
import { apiVerifyCaptcha } from '../api/functions/captcha';
import type { CaptchaPurpose } from '../api/functions/captcha';

const UNAVAILABLE_MESSAGE =
  'Không tải được ô kiểm tra bảo mật. Hãy tắt trình chặn quảng cáo rồi tải lại trang.';
const NOT_SOLVED_MESSAGE = 'Vui lòng hoàn tất ô kiểm tra bảo mật rồi thử lại.';

/**
 * Một lỗi dai dẳng được thử lại đúng một lần. Nhiều hơn thì thành vòng lặp: vẽ lại ô, lại
 * lỗi, lại vẽ lại — và người dùng chỉ thấy "đang xác minh" quay mãi.
 */
const MAX_AUTO_RETRIES = 1;

/**
 * Mã lỗi của Cloudflare Turnstile, dịch sang câu nói được điều cần làm.
 *
 * Mã gốc luôn được ghép vào cuối câu. Hộp lỗi của chính Cloudflare chỉ nói chung chung
 * "không thể kết nối với trang web" cho rất nhiều nguyên nhân khác nhau, nên nếu ta cũng
 * giấu mã đi thì không ai kiểm chứng được chẩn đoán này đúng hay sai.
 */
function describeError(code: string | undefined): string {
  const suffix = code ? ` (mã Cloudflare ${code})` : '';

  // 110200 = hostname đang mở trang không nằm trong danh sách tên miền của widget. Đây là
  // lỗi cấu hình chứ không phải lỗi người dùng, nên nói thẳng ra thay vì bảo họ thử lại.
  if (code?.startsWith('1102')) {
    return `Tên miền ${window.location.hostname} chưa được cấp phép cho ô kiểm tra bảo mật. `
      + `Quản trị viên cần thêm tên miền này vào widget Turnstile trên Cloudflare${suffix}.`;
  }

  if (code?.startsWith('1100')) {
    return `Site key của ô kiểm tra bảo mật không hợp lệ. Vui lòng báo quản trị viên${suffix}.`;
  }

  // 300xxx/600xxx thường là mạng bị chặn — trình chặn quảng cáo hoặc lá chắn của trình
  // duyệt chặn challenges.cloudflare.com là nguyên nhân phổ biến nhất.
  if (code?.startsWith('300') || code?.startsWith('600')) {
    return 'Không kết nối được tới dịch vụ kiểm tra bảo mật. Thử tắt trình chặn quảng cáo / lá '
      + `chắn của trình duyệt cho trang này rồi tải lại${suffix}.`;
  }

  return `Ô kiểm tra bảo mật gặp lỗi. Vui lòng tải lại trang và thử lại${suffix}.`;
}

/**
 * Vòng đời của một lần kiểm tra chống bot.
 *
 * Hai token, đừng nhầm: widget Turnstile sinh ra *provider token*, và chỉ sau khi backend
 * xác minh nó với Cloudflare thì mới có *verification token* — cái sau mới là thứ gửi ở
 * header X-Captcha-Token. Cả hai đều dùng một lần, nên submit hỏng là phải làm lại từ đầu.
 */
export function useCaptcha(purpose: CaptchaPurpose) {
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Đổi `resetKey` là gắn lại TurnstileWidget, tức là vẽ một ô mới.
  const [resetKey, setResetKey] = useState(0);
  const retriesRef = useRef(0);

  const reset = useCallback(() => {
    retriesRef.current = 0;
    setProviderToken(null);
    setErrorMessage(null);
    setResetKey((key) => key + 1);
  }, []);

  /** Token hết hạn: vẽ ô mới là hợp lý, lần sau vẫn có cơ hội qua được. */
  const onExpire = useCallback(() => {
    setProviderToken(null);
    setResetKey((key) => key + 1);
  }, []);

  /**
   * Widget báo lỗi. Thử lại một lần cho các trục trặc thoáng qua, sau đó dừng hẳn và nói
   * ra vấn đề — vẽ lại vô hạn không bao giờ chữa được một lỗi cấu hình.
   */
  const onError = useCallback((code?: string) => {
    setProviderToken(null);

    if (retriesRef.current < MAX_AUTO_RETRIES) {
      retriesRef.current += 1;
      setResetKey((key) => key + 1);
      return;
    }

    setErrorMessage(describeError(code));
  }, []);

  /**
   * Đổi lấy verification token để gửi kèm request. Trả về `{ token, error }` thay vì ném
   * lỗi, cho khớp với cách mọi helper API khác ở đây hành xử.
   */
  const exchange = useCallback(async (): Promise<{ token: string | null; error: string | null }> => {
    if (unavailable) {
      return { token: null, error: UNAVAILABLE_MESSAGE };
    }

    if (errorMessage) {
      return { token: null, error: errorMessage };
    }

    if (!providerToken) {
      return { token: null, error: NOT_SOLVED_MESSAGE };
    }

    const result = await apiVerifyCaptcha(providerToken, purpose);

    // Đã tiêu rồi, dù kết quả thế nào: Cloudflare chỉ nhận mỗi token một lần.
    reset();

    if (!result.ok || !result.data) {
      return { token: null, error: result.error ?? NOT_SOLVED_MESSAGE };
    }

    return { token: result.data.verification_token, error: null };
  }, [providerToken, purpose, reset, unavailable, errorMessage]);

  return {
    resetKey,
    solved: providerToken !== null,
    unavailable,
    /** Lỗi của chính ô kiểm tra, để trang hiện lên mà không cần chờ người dùng bấm submit. */
    errorMessage,
    onVerify: setProviderToken,
    onExpire,
    onError,
    onUnavailable: () => setUnavailable(true),
    exchange,
    reset,
  };
}

export default useCaptcha;
