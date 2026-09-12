import { useEffect, useRef } from 'react';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * Site key. Mặc định là test key luôn-pass mà Cloudflare công bố, khớp với test secret
 * backend dùng ở môi trường Development.
 */
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'error-callback'?: (code?: string) => void;
      'expired-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
    },
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

/** Nạp script đúng một lần cho cả ứng dụng, dù có bao nhiêu widget cùng mở. */
function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  scriptPromise =
    scriptPromise ??
    new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        // Cho lần sau thử lại — trình chặn quảng cáo chặn hẳn domain này khá thường xuyên.
        scriptPromise = null;
        reject(new Error('Không tải được Cloudflare Turnstile'));
      };
      document.head.appendChild(script);
    });

  return scriptPromise;
}

interface TurnstileWidgetProps {
  /** Nhận token của widget; đem đổi lấy token xác minh của backend ngay trước khi submit. */
  onVerify: (token: string) => void;
  /**
   * Token đã hết hạn. Lấy một ô mới là đúng việc phải làm, vì lần sau vẫn có cơ hội thành công.
   */
  onExpire?: () => void;
  /**
   * Widget báo lỗi, kèm mã lỗi của Cloudflare (ví dụ 110200 = tên miền chưa được cấp phép).
   *
   * Tách khỏi <see cref="onExpire"/> có chủ đích: gộp hai thứ này lại thì một lỗi dai dẳng
   * sẽ thành vòng lặp vô tận — vẽ lại ô, lại lỗi, lại vẽ lại — và người dùng chỉ thấy ô
   * "đang xác minh" quay mãi không dừng.
   */
  onError?: (code?: string) => void;
  /** Script bị chặn hoặc không tải được. */
  onUnavailable?: () => void;
}

/**
 * Ô kiểm tra chống bot của Cloudflare Turnstile.
 *
 * Token widget dùng được một lần. Sau mỗi lần submit hỏng, gắn lại component bằng một
 * `key` mới để vẽ widget mới — `useCaptcha` bên dưới lo việc đó.
 */
export const TurnstileWidget = ({
  onVerify,
  onExpire,
  onError,
  onUnavailable,
}: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Giữ callback trong ref để việc component cha vẽ lại không khiến widget bị dựng lại —
  // dựng lại sẽ xoá mất ô người dùng vừa giải.
  const handlersRef = useRef({ onVerify, onExpire, onError, onUnavailable });

  useEffect(() => {
    handlersRef.current = { onVerify, onExpire, onError, onUnavailable };
  }, [onVerify, onExpire, onError, onUnavailable]);

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: 'light',
          callback: (token) => handlersRef.current.onVerify(token),
          'error-callback': (code) => handlersRef.current.onError?.(code),
          'expired-callback': () => handlersRef.current.onExpire?.(),
        });
      })
      .catch(() => {
        if (!cancelled) {
          handlersRef.current.onUnavailable?.();
        }
      });

    return () => {
      cancelled = true;

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  return <div className="captcha-widget" ref={containerRef} />;
};
