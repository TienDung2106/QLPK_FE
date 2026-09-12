import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import { AuthLayout } from '../AuthLayout';
import useAuth from '../../hooks/useAuth';
import { apiChangePassword } from '../../api/functions/auth';
import { clearSession } from '../../api/session';

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

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { account } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forced = account?.must_change_password === true;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại.');
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
      const result = await apiChangePassword(currentPassword, newPassword);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Đổi mật khẩu xong, backend tăng token_version và thu hồi mọi refresh token
      // (10.4 bước 8), nên token đang cầm cũng chết theo. Xoá phiên tại chỗ thay vì để
      // request kế tiếp đâm vào 401 rồi mới biết.
      clearSession();
      navigate('/login', {
        replace: true,
        state: { notice: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Đổi mật khẩu"
      subtitle={
        forced
          ? 'Tài khoản của bạn đang dùng mật khẩu tạm thời. Hãy đặt mật khẩu mới để tiếp tục sử dụng.'
          : 'Sau khi đổi, mọi thiết bị đang đăng nhập sẽ bị đăng xuất.'
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="auth-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {forced && (
          <div className="auth-alert info">
            <KeyRound size={16} />
            <span>Chưa đổi mật khẩu thì tài khoản chưa dùng được chức năng nào khác.</span>
          </div>
        )}

        <div className="auth-field">
          <label className="auth-label-sr" htmlFor="current-password">
            Mật khẩu hiện tại
          </label>
          <input
            id="current-password"
            className="auth-input"
            type="password"
            autoComplete="current-password"
            placeholder="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="auth-field">
          <label className="auth-label-sr" htmlFor="new-password">
            Mật khẩu mới
          </label>
          <input
            id="new-password"
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
          <label className="auth-label-sr" htmlFor="confirm-new-password">
            Nhập lại mật khẩu mới
          </label>
          <input
            id="confirm-new-password"
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
          {submitting ? 'Đang đổi...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </AuthLayout>
  );
};
