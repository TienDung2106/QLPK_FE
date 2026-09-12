import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { AuthLayout } from '../AuthLayout';
import { CaptchaField } from '../../components/Captcha/CaptchaField';
import { OtpCountdown } from '../../components/OtpCountdown/OtpCountdown';
import useAuth from '../../hooks/useAuth';
import useCaptcha from '../../hooks/useCaptcha';
import { CAPTCHA_PURPOSE } from '../../api/functions/captcha';
import { apiRegister, apiResendRegistrationOtp, apiVerifyRegistration } from '../../api/functions/auth';
import type { OtpChallengeResponse } from '../../api/types';
import './RegisterPage.css';

interface FormValues {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_FORM: FormValues = {
  fullName: '',
  phoneNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
};

/** Cùng luật với [MeetsPasswordPolicy] ở backend: ≥ 8 ký tự, có hoa, thường và số. */
function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Mật khẩu phải có ít nhất 8 ký tự.';
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Mật khẩu phải có cả chữ hoa, chữ thường và chữ số.';
  }
  return null;
}

function validate(values: FormValues): Partial<Record<keyof FormValues, string>> {
  const errors: Partial<Record<keyof FormValues, string>> = {};

  if (values.fullName.trim().length < 2) {
    errors.fullName = 'Vui lòng nhập họ tên.';
  }

  // Khớp RegularExpression của RegisterRequest.PhoneNumber: chỉ chữ số, cho phép dẫn đầu '+'.
  if (!/^\+?[0-9]{8,15}$/.test(values.phoneNumber.trim())) {
    errors.phoneNumber = 'Số điện thoại chỉ gồm chữ số, 8–15 chữ số.';
  }

  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = 'Email không hợp lệ.';
  }

  const passwordError = validatePassword(values.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Mật khẩu nhập lại không khớp.';
  }

  return errors;
}

export const RegisterPage = () => {
  const { adoptSession } = useAuth();

  const registerCaptcha = useCaptcha(CAPTCHA_PURPOSE.PatientRegistration);
  const resendCaptcha = useCaptcha(CAPTCHA_PURPOSE.OtpResend);

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Có giá trị nghĩa là đã qua bước 1: tài khoản vẫn chưa tồn tại, mới chỉ có một mã đang
  // chờ. Backend giữ dữ liệu đăng ký trong verification_codes.registration_payload cho tới
  // khi mã được xác nhận.
  const [challenge, setChallenge] = useState<OtpChallengeResponse | null>(null);
  const [code, setCode] = useState('');

  const setValue = (key: keyof FormValues, value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const errors = validate(values);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!acceptedTerms) {
      setError('Vui lòng đồng ý với điều khoản và điều kiện.');
      return;
    }

    setSubmitting(true);

    try {
      const exchanged = await registerCaptcha.exchange();

      if (!exchanged.token) {
        setError(exchanged.error);
        return;
      }

      const result = await apiRegister(
        {
          full_name: values.fullName.trim(),
          phone_number: values.phoneNumber.trim(),
          email: values.email.trim(),
          password: values.password,
        },
        exchanged.token,
      );

      if (!result.ok || !result.data) {
        setError(result.error);
        return;
      }

      setChallenge(result.data);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (code.trim().length < 4) {
      setError('Vui lòng nhập mã xác thực đã được gửi tới email của bạn.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await apiVerifyRegistration(
        values.email.trim(),
        code.trim(),
        navigator.userAgent.slice(0, 255),
      );

      if (!result.ok || !result.data) {
        setError(result.error);
        return;
      }

      // Backend tạo tài khoản rồi trả luôn cặp token, nên không cần đăng nhập lại.
      // GuestGuard lo phần điều hướng sang trang lịch hẹn.
      adoptSession(result.data);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const exchanged = await resendCaptcha.exchange();

      if (!exchanged.token) {
        setError(exchanged.error);
        return;
      }

      const result = await apiResendRegistrationOtp(values.email.trim(), exchanged.token);

      if (!result.ok || !result.data) {
        setError(result.error);
        return;
      }

      setChallenge(result.data);
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  if (challenge) {
    return (
      <AuthLayout
        title="Nhập mã xác thực"
        subtitle={
          <>
            Mã gồm 6 chữ số đã được gửi tới <strong>{challenge.masked_destination}</strong>.
            Nếu không thấy, hãy kiểm tra cả hộp thư rác.
          </>
        }
        footer={
          <button type="button" onClick={() => setChallenge(null)}>
            <ArrowLeft size={13} /> Quay lại sửa thông tin
          </button>
        }
      >
        <form className="auth-form" onSubmit={handleVerify} noValidate>
          {error && (
            <div className="auth-alert error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label-sr" htmlFor="register-code">
              Mã xác thực
            </label>
            <input
              id="register-code"
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
              expiredLabel="Mã đã hết hạn"
              prefix="Mã hết hạn sau"
            />
            <span>Tối đa {challenge.max_attempts} lần thử</span>
          </div>

          <CaptchaField captcha={resendCaptcha} />

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting && <Loader2 className="spin" size={18} />}
            {submitting ? 'Đang xác thực...' : 'Xác nhận'}
          </button>

          <button
            type="button"
            className="auth-link register-resend"
            onClick={handleResend}
            disabled={submitting}
          >
            <MailCheck size={14} /> Gửi lại mã
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Đăng ký"
      subtitle="Dành cho bệnh nhân. Tài khoản nhân viên do quản trị viên cấp."
      footer={
        <>
          Đã có tài khoản?
          <Link to="/login">Đăng nhập</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleRegister} noValidate>
        {error && (
          <div className="auth-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="auth-field">
          <label className="auth-label-sr" htmlFor="register-name">
            Họ và tên
          </label>
          <input
            id="register-name"
            className={`auth-input ${fieldErrors.fullName ? 'has-error' : ''}`}
            type="text"
            autoComplete="name"
            placeholder="Họ và tên"
            value={values.fullName}
            onChange={(event) => setValue('fullName', event.target.value)}
            disabled={submitting}
          />
          {fieldErrors.fullName && <span className="auth-field-error">{fieldErrors.fullName}</span>}
        </div>

        <div className="auth-field">
          <label className="auth-label-sr" htmlFor="register-phone">
            Số điện thoại
          </label>
          <input
            id="register-phone"
            className={`auth-input ${fieldErrors.phoneNumber ? 'has-error' : ''}`}
            type="tel"
            autoComplete="tel"
            placeholder="Số điện thoại"
            value={values.phoneNumber}
            onChange={(event) => setValue('phoneNumber', event.target.value)}
            disabled={submitting}
          />
          {fieldErrors.phoneNumber && (
            <span className="auth-field-error">{fieldErrors.phoneNumber}</span>
          )}
        </div>

        <div className="auth-field">
          <label className="auth-label-sr" htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
            className={`auth-input ${fieldErrors.email ? 'has-error' : ''}`}
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={values.email}
            onChange={(event) => setValue('email', event.target.value)}
            disabled={submitting}
          />
          {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
        </div>

        <div className="auth-field">
          <label className="auth-label-sr" htmlFor="register-password">
            Mật khẩu
          </label>
          <input
            id="register-password"
            className={`auth-input ${fieldErrors.password ? 'has-error' : ''}`}
            type="password"
            autoComplete="new-password"
            placeholder="Mật khẩu"
            value={values.password}
            onChange={(event) => setValue('password', event.target.value)}
            disabled={submitting}
          />
          {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
        </div>

        <div className="auth-field">
          <label className="auth-label-sr" htmlFor="register-confirm">
            Nhập lại mật khẩu
          </label>
          <input
            id="register-confirm"
            className={`auth-input ${fieldErrors.confirmPassword ? 'has-error' : ''}`}
            type="password"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            value={values.confirmPassword}
            onChange={(event) => setValue('confirmPassword', event.target.value)}
            disabled={submitting}
          />
          {fieldErrors.confirmPassword && (
            <span className="auth-field-error">{fieldErrors.confirmPassword}</span>
          )}
        </div>

        <CaptchaField captcha={registerCaptcha} />

        <label className="auth-checkbox register-terms">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
          />
          Tôi đồng ý với điều khoản và điều kiện
        </label>

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting && <Loader2 className="spin" size={18} />}
          {submitting ? 'Đang gửi mã...' : 'Đăng ký'}
        </button>
      </form>
    </AuthLayout>
  );
};
