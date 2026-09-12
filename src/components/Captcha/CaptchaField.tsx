import { AlertCircle } from 'lucide-react';
import { TurnstileWidget } from './TurnstileWidget';
import type useCaptcha from '../../hooks/useCaptcha';

interface CaptchaFieldProps {
  /** Trả về của `useCaptcha(...)`. */
  captcha: ReturnType<typeof useCaptcha>;
  /** 'auth' cho thẻ kính mờ trên nền xanh, 'plain' cho nền trắng trong luồng đặt lịch. */
  tone?: 'auth' | 'plain';
}

/**
 * Ô kiểm tra chống bot kèm thông báo khi chính nó hỏng.
 *
 * Gom hai thứ lại vì chúng luôn đi cùng nhau: nếu widget lỗi mà không nói gì, người dùng
 * chỉ thấy một khoảng trống và một nút submit mãi không chịu chạy.
 */
export const CaptchaField = ({ captcha, tone = 'auth' }: CaptchaFieldProps) => (
  <div className="captcha-field">
    <TurnstileWidget
      key={captcha.resetKey}
      onVerify={captcha.onVerify}
      onExpire={captcha.onExpire}
      onError={captcha.onError}
      onUnavailable={captcha.onUnavailable}
    />

    {captcha.errorMessage && (
      <div className={tone === 'auth' ? 'auth-alert error' : 'account-alert error'} role="alert">
        <AlertCircle size={16} />
        <span>{captcha.errorMessage}</span>
      </div>
    )}
  </div>
);
