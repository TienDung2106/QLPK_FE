import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ROLE } from '../api/types';
import { resolveLandingPath } from './landing';
import { FullPageLoader } from '../components/FullPageLoader/FullPageLoader';

/** Nơi tài khoản bị bắt buộc đổi mật khẩu được đẩy tới, và là trang duy nhất nó vào được. */
export const FORCED_PASSWORD_CHANGE_PATH = '/doi-mat-khau';

interface AuthGuardProps {
  children: ReactNode;
  /** Đặt true cho chính trang đổi mật khẩu, để nó không tự chuyển hướng về chính nó. */
  allowWhenPasswordChangeRequired?: boolean;
}

/**
 * Chặn các trang chỉ dành cho người đã đăng nhập.
 *
 * Phải chờ `isInitialised` rồi mới quyết định. Nếu không, lần tải đầu tiên sẽ đá người
 * dùng về trang đăng nhập trong khoảnh khắc /api/auth/me còn đang bay — nhìn ra ngoài là
 * mở lại tab thì bị đăng xuất.
 */
export const AuthGuard = ({ children, allowWhenPasswordChangeRequired = false }: AuthGuardProps) => {
  const { isInitialised, isAuthenticated, account } = useAuth();
  const location = useLocation();

  if (!isInitialised) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    // Nhớ lại nơi định tới, để sau khi đăng nhập quay về đúng đó thay vì về trang chủ.
    return <Navigate to="/login" replace state={{ redirectTo: location.pathname }} />;
  }

  // Khi must_change_password còn bật, backend cấp token với **danh sách quyền rỗng**
  // (QLPK/Authentication/AccessTokenValidationEvents.cs), nên mọi trang khác chỉ nhận về
  // 403. Đưa thẳng tới chỗ gỡ được tình trạng đó.
  if (account?.must_change_password && !allowWhenPasswordChangeRequired) {
    return <Navigate to={FORCED_PASSWORD_CHANGE_PATH} replace />;
  }

  return <>{children}</>;
};

/**
 * Chặn một trang trong khu nhân viên theo **quyền** (không theo tên vai trò): admin mang cả
 * quyền thu ngân lẫn nhà thuốc nên tự vào được các trang đó. Có một trong `anyOf` là đủ.
 * Backend vẫn là nơi quyết định cuối; guard này chỉ để không dẫn người dùng tới trang 403.
 */
export const PermissionGuard = ({ anyOf, children }: { anyOf: string[]; children: ReactNode }) => {
  const { hasPermission } = useAuth();

  if (!anyOf.some((permission) => hasPermission(permission))) {
    return (
      <div className="st-denied">
        <div>
          <h1 className="st-page-title">Không có quyền truy cập</h1>
          <p className="st-page-desc">
            Tài khoản của bạn không được cấp quyền dùng trang này. Liên hệ quản trị viên nếu bạn cần.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Khu công khai của phòng khám chỉ dành cho khách chưa đăng nhập và bệnh nhân. Nhân viên
 * đã đăng nhập bị đưa thẳng về khu làm việc, kể cả khi tự gõ URL.
 *
 * Vẫn phải chờ `isInitialised`: chặn ở đây mà quyết định sớm thì nhân viên tải lại trang sẽ
 * thấy trang chủ nháy lên một nhịp. Khách chưa đăng nhập không phải chờ lâu vì
 * `AuthProvider` báo INIT ngay khi không có access token, không đợi /api/auth/me.
 */
export const PublicSiteGuard = ({ children }: { children: ReactNode }) => {
  const { isInitialised, isAuthenticated, account } = useAuth();

  if (!isInitialised) {
    return <FullPageLoader />;
  }

  if (isAuthenticated && account && account.role_code !== ROLE.Patient) {
    const landing = resolveLandingPath(account);

    // Vai trò lạ (chưa có trong LANDING_BY_ROLE) cũng nhận về '/' — chuyển hướng tiếp là lặp
    // vô tận, nên để họ ở lại trang công khai.
    if (landing !== '/') {
      return <Navigate to={landing} replace />;
    }
  }

  return <>{children}</>;
};

/**
 * Ngược lại: đăng nhập / đăng ký / quên mật khẩu thì người đã đăng nhập không cần xem nữa.
 *
 * Đây cũng là nơi duy nhất quyết định trang đích sau khi đăng nhập. Trang đăng nhập chỉ
 * lưu phiên rồi thôi: ngay lượt render sau, guard này thấy `isAuthenticated` và chuyển
 * hướng. Nếu trang đó cũng tự gọi navigate thì hai bên tranh nhau và đích nào thắng là
 * tuỳ thứ tự render — đúng lỗi đã gặp: đăng ký xong lại rơi về trang chủ.
 */
export const GuestGuard = ({ children }: { children: ReactNode }) => {
  const { isInitialised, isAuthenticated, account } = useAuth();
  const location = useLocation();

  if (!isInitialised) {
    return <FullPageLoader />;
  }

  if (isAuthenticated) {
    const redirectTo = (location.state as { redirectTo?: string } | null)?.redirectTo;

    return <Navigate to={resolveLandingPath(account, redirectTo)} replace />;
  }

  return <>{children}</>;
};
