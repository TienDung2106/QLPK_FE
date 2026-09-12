import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { AuthLayout } from '../AuthLayout';
import { CaptchaField } from '../../components/Captcha/CaptchaField';
import { OtpCountdown } from '../../components/OtpCountdown/OtpCountdown';
import useCaptcha from '../../hooks/useCaptcha';
import { CAPTCHA_PURPOSE } from '../../api/functions/captcha';
import { apiForgotPassword, apiResetPassword } from '../../api/functions/auth';
import type { OtpChallengeResponse } from '../../api/types';

/** Cùng luật với [MeetsPasswordPolicy] ở backend. */
function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Mật khẩu phải có ít nhất 8 ký tự.';
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Mật khẩu phải có cả chữ hoa, chữ thường và chữ số.';
  }
  return null;
}

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const captcha = useCaptcha(CAPTCHA_PURPOSE.PasswordReset);

  const [destination, setDestination] = useState('');
  const [challenge, setChallenge] = useState<OtpChallengeResponse | null>(null);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleRequestCode = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!destination.trim()) {
      setError('Vui lòng nhập email đã đăng ký.');
      return;
    }

    setSubmitting(true);

    try {
      const exchanged = await captcha.exchange();

      if (!exchanged.token) {
        setError(exchanged.error);
        return;
      }

      const result = await apiForgotPassword(destination.trim(), exchanged.token);

      if (!result.ok || !result.data) {
        setError(result.error);
        return;
      }

      // Backend trả lời y hệt kể cả khi email không có tài khoản nào — cố ý, để không ai
      // dùng trang này dò xem ai đang có tài khoản. Nên ở đây cũng không hứa gì chắc chắn.
      setChallenge(result.data);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (code.trim().length < 4) {
      setError('Vui lòng nhập mã đặt lại mật khẩu.');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await apiResetPassword(destination.trim(), code.trim(), newPassword);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthLayout title="Đã đổi mật khẩu">
        <div className="auth-alert success" role="status">
          <CheckCircle2 size={16} />
          <span>
            Mật khẩu đã được đặt lại. Mọi phiên đăng nhập cũ của tài khoản đã bị đăng xuất.
          </span>
        </div>

        <button
          type="button"
          className="auth-submit"
          onClick={() => navigate('/login', { replace: true })}
        >
          Đăng nhập ngay
        </button>
      </AuthLayout>
    );
  }

  if (challenge) {
    return (
      <AuthLayout
        title="Đặt lại mật khẩu"
        subtitle={
          <>
            Nếu <strong>{challenge.masked_destination}</strong> có tài khoản, mã đặt lại đã
            được gửi tới đó. Hãy kiểm tra cả hộp thư rác.
          </>
        }
        footer={
          <button type="button" onClick={() => setChallenge(null)}>
            <ArrowLeft size={13} /> Nhập email khác
          </button>
        }
      >
        <form className="auth-form" onSubmit={handleReset} noValidate>
          {error && (
            <div className="auth-alert error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label-sr" htmlFor="reset-code">
              Mã đặt lại mật khẩu
            </label>
            <input
              id="reset-code"
              className="auth-input auth-code-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              placeholder="------"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              disabled={submitting}
            />
          </div>

          <div className="auth-otp-meta">
            <OtpCountdown
              expiresAt={challenge.expires_at}
              prefix="Mã hết hạn sau"
              expiredLabel="Mã đã hết hạn"
            />
            <span>Tối đa {challenge.max_attempts} lần thử</span>
          </div>

          <div className="auth-field">
            <label className="auth-label-sr" htmlFor="reset-password">
              Mật khẩu mới
            </label>
            <input
              id="reset-password"
              className="auth-input"
              type="password"
              autoComplete="new-password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label-sr" htmlFor="reset-confirm">
              Nhập lại mật khẩu mới
            </label>
            <input
              id="reset-confirm"
              className="auth-input"
              type="password"
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={submitting}
            />
          </div>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting && <Loader2 className="spin" size={18} />}
            {submitting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle="Nhập email đã đăng ký, chúng tôi sẽ gửi mã đặt lại mật khẩu tới đó."
      footer={
        <>
          Nhớ mật khẩu?
          <Link to="/login">Đăng nhập</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleRequestCode} noValidate>
        {error && (
          <div className="auth-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="auth-field">
          <label className="auth-label-sr" htmlFor="forgot-destination">
            Email đã đăng ký
          </label>
          <input
            id="forgot-destination"
            className="auth-input"
            type="email"
            autoComplete="email"
            placeholder="Nhập email đã đăng kí"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            disabled={submitting}
          />
        </div>

        <CaptchaField captcha={captcha} />

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting && <Loader2 className="spin" size={18} />}
          {submitting ? 'Đang gửi...' : 'Gửi mã đặt lại mật khẩu'}
        </button>
      </form>
    </AuthLayout>
  );
};
