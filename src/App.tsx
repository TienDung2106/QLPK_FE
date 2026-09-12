import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard, GuestGuard } from './auth/AuthGuard';
import { HomePage } from './pages/HomePage';
import { BookingPage } from './pages/BookingPage/BookingPage';
import { ClinicDetailPage } from './pages/ClinicDetailPage/ClinicDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { ProfilePage } from './pages/ProfilePage';

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
            <Route path="/" element={<HomeRoute />} />
            <Route path="/clinic-detail" element={<ClinicDetailRoute />} />

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
                  <BookingRoute />
                </AuthGuard>
              }
            />
            <Route
              path="/lich-hen-cua-toi"
              element={
                <AuthGuard>
                  <MyAppointmentsPage />
                </AuthGuard>
              }
            />
            <Route
              path="/ho-so"
              element={
                <AuthGuard>
                  <ProfilePage />
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

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
