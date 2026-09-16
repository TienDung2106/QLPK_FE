import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard, GuestGuard, PublicSiteGuard } from './auth/AuthGuard';
import { HomePage } from './pages/HomePage';
import { BookingPage } from './pages/BookingPage/BookingPage';
import { ClinicDetailPage } from './pages/ClinicDetailPage/ClinicDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { ProfilePage } from './pages/ProfilePage';
import { staffRoutes } from './staff/StaffRoutes';

/**
 * Các trang công khai vốn nhận callback điều hướng qua prop (từ thời App.tsx chuyển trang
 * bằng useState). Giữ nguyên chữ ký prop của chúng và chỉ đổi phần ruột sang useNavigate,
 * nên các component con không phải sửa gì.
 */
const HomeRoute = () => {
  const navigate = useNavigate();

  return (
    <HomePage
      onNavigateToBooking={() => navigate('/booking')}
      onNavigateToClinicDetail={() => navigate('/clinic-detail')}
    />
  );
};

const BookingRoute = () => {
  const navigate = useNavigate();

  return <BookingPage onBackToHome={() => navigate('/')} />;
};

const ClinicDetailRoute = () => {
  const navigate = useNavigate();

  return (
    <ClinicDetailPage
      onBackToHome={() => navigate('/')}
      onOpenBooking={() => navigate('/booking')}
    />
  );
};

function App() {
  return (
    // basename lấy từ Vite, nên đổi `base` trong vite.config.ts là router tự theo — không
    // phải nhớ sửa hai chỗ.
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <div className="app-container">
          <Routes>
            {/* Khu công khai + khu bệnh nhân: nhân viên đã đăng nhập bị PublicSiteGuard
                đưa về khu làm việc, kể cả khi tự gõ URL. */}
            <Route
              path="/"
              element={
                <PublicSiteGuard>
                  <HomeRoute />
                </PublicSiteGuard>
              }
            />
            <Route
              path="/clinic-detail"
              element={
                <PublicSiteGuard>
                  <ClinicDetailRoute />
                </PublicSiteGuard>
              }
            />

            <Route
              path="/login"
              element={
                <GuestGuard>
                  <LoginPage />
                </GuestGuard>
              }
            />
            <Route
              path="/dang-ky"
              element={
                <GuestGuard>
                  <RegisterPage />
                </GuestGuard>
              }
            />
            <Route
              path="/quen-mat-khau"
              element={
                <GuestGuard>
                  <ForgotPasswordPage />
                </GuestGuard>
              }
            />

            {/* Đặt lịch nằm sau cổng đăng nhập vì chính backend bắt buộc: cả việc xem slot
                trống lẫn việc ghi lịch đều cần quyền appointments.book_own. */}
            <Route
              path="/booking"
              element={
                <AuthGuard>
                  <PublicSiteGuard>
                    <BookingRoute />
                  </PublicSiteGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/lich-hen-cua-toi"
              element={
                <AuthGuard>
                  <PublicSiteGuard>
                    <MyAppointmentsPage />
                  </PublicSiteGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/ho-so"
              element={
                <AuthGuard>
                  <PublicSiteGuard>
                    <ProfilePage />
                  </PublicSiteGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/doi-mat-khau"
              element={
                <AuthGuard allowWhenPasswordChangeRequired>
                  <ChangePasswordPage />
                </AuthGuard>
              }
            />

            {/* Khu nhân viên: admin /quan-tri, bác sĩ /bac-si, thu ngân /thu-ngan, nhà thuốc /nha-thuoc. */}
            {staffRoutes()}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
