import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '../AuthLayout';
import { CaptchaField } from '../../components/Captcha/CaptchaField';
import useAuth from '../../hooks/useAuth';
import useCaptcha from '../../hooks/useCaptcha';
import { apiLogin } from '../../api/functions/auth';
import { CAPTCHA_PURPOSE } from '../../api/functions/captcha';
import { ROLE } from '../../api/types';
import './LoginPage.css';

type Audience = 'patient' | 'staff';

export const LoginPage = () => {
  const location = useLocation();
  const { adoptSession } = useAuth();
  const captcha = useCaptcha(CAPTCHA_PURPOSE.LoginAfterFailures);

  const [audience, setAudience] = useState<Audience>('patient');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Backend chỉ đòi CAPTCHA sau vài lần sai (setting captcha_after_failed_login_attempts),
  // nên ô này chỉ hiện khi nó đã thật sự từ chối một lần vì thiếu — chứ không bắt mọi
  // người giải ngay từ lần đầu.
  const [captchaRequired, setCaptchaRequired] = useState(false);

  const routeState = location.state as { redirectTo?: string; notice?: string } | null;

  // Ví dụ: vừa đổi mật khẩu xong nên bị đăng xuất khỏi mọi thiết bị, và được đưa về đây.
  const [notice, setNotice] = useState<string | null>(routeState?.notice ?? null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!identifier.trim() || !password) {
      setError('Vui lòng nhập đầy đủ thông tin đăng nhập.');
      return;
    }

    setSubmitting(true);

    try {
      let captchaToken: string | null = null;

      if (captchaRequired) {
        const exchanged = await captcha.exchange();

        if (!exchanged.token) {
          setError(exchanged.error);
          return;
        }

        captchaToken = exchanged.token;
      }

      // Gọi thẳng API thay vì qua context, để kiểm tra vai trò *trước* khi lưu phiên: đăng
      // nhập nhầm tab mà đã lưu phiên rồi thì guard sẽ cuốn họ đi mất trước khi kịp đọc lỗi.
      const result = await apiLogin(
        {
          login: identifier.trim(),
          password,
          device_info: navigator.userAgent.slice(0, 255),
        },
        captchaToken,
      );

      if (!result.ok) {
        // Tài khoản đã sai nhiều lần: từ đây backend đòi CAPTCHA cho mọi lần thử tiếp theo.
        if (result.errorCode === 'captcha_required') {
          setCaptchaRequired(true);
        }

        if (result.status === 429 && result.retryAfterSeconds) {
          const minutes = Math.ceil(result.retryAfterSeconds / 60);
          setError(
            `Tài khoản đang tạm khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${minutes} phút.`,
          );
          return;
        }

        setError(result.error);
        return;
      }

      const tokens = result.data!;
      const account = tokens.account;

      // Hai tab dùng chung một endpoint; khác nhau ở chỗ người dùng đang mong đợi điều gì.
      // Đăng nhập nhầm tab thì nói thẳng, thay vì im lặng đưa họ tới một màn hình lạ.
      if (audience === 'patient' && account.role_code !== ROLE.Patient) {
        setError('Đây là tài khoản nhân viên. Vui lòng chuyển sang tab "Nhân viên / Bác sĩ".');
        return;
      }

      if (audience === 'staff' && account.role_code === ROLE.Patient) {
        setError('Đây là tài khoản bệnh nhân. Vui lòng chuyển sang tab "Bệnh nhân".');
        return;
      }

      // Không tự điều hướng: GuestGuard bọc trang này sẽ thấy phiên mới và đưa đi đúng chỗ.
      adoptSession(tokens, remember);
    } finally {
      setSubmitting(false);
    }
  };

  const switchAudience = (next: Audience) => {
    setAudience(next);
    setError(null);
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      tabs={
        <div className="auth-tabs" role="tablist" aria-label="Loại tài khoản">
          <button
            type="button"
            role="tab"
            aria-selected={audience === 'patient'}
            className={`auth-tab ${audience === 'patient' ? 'active' : ''}`}
            onClick={() => switchAudience('patient')}
          >
            Bệnh nhân
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={audience === 'staff'}
            className={`auth-tab ${audience === 'staff' ? 'active' : ''}`}
            onClick={() => switchAudience('staff')}
          >
            Nhân viên / Bác sĩ
          </button>
        </div>
      }
      footer={
        audience === 'patient' ? (
          <>
            Chưa có tài khoản?
            <Link to="/dang-ky">Đăng kí</Link>
          </>
        ) : null
      }
    >
      {audience === 'staff' && (
        <div className="auth-alert info login-staff-note">
          <ShieldCheck size={16} />
          <span>
            Tài khoản nhân viên do quản trị viên cấp. Nếu chưa có, hãy liên hệ quản trị viên
            của phòng khám.
          </span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {notice && (
          <div className="auth-alert success" role="status">
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="auth-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="auth-field">
          <label className="auth-label-sr" htmlFor="login-identifier">
            Số điện thoại hoặc email
          </label>
          <input
            id="login-identifier"
            className="auth-input"
            type="text"
            autoComplete="username"
            placeholder="Số điện thoại hoặc email"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="auth-field">
          <label className="auth-label-sr" htmlFor="login-password">
            Mật khẩu
          </label>
          <input
            id="login-password"
            className="auth-input"
            type="password"
            autoComplete="current-password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
          />
        </div>

        {captchaRequired && (
          <CaptchaField captcha={captcha} />
        )}

        <div className="auth-inline-row">
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Ghi nhớ
          </label>

          <Link className="auth-link" to="/quen-mat-khau">
            Quên mật khẩu?
          </Link>
        </div>

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting && <Loader2 className="spin" size={18} />}
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </AuthLayout>
  );
};
