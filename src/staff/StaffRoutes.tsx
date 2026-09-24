/* eslint-disable react-refresh/only-export-components -- file chỉ khai báo route và trang tải lười, không phải nơi cần hot reload. */
import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { AuthGuard, PermissionGuard } from '../auth/AuthGuard';
import { FullPageLoader } from '../components/FullPageLoader/FullPageLoader';
import { PERMISSION as P } from './permissions';

/*
 * Mọi trang nhân viên tải lười: bệnh nhân mở trang chủ không phải tải mã quản trị
 * hay lễ tân. Chỉ file này nằm trong bundle chính, và nó chỉ chứa khai báo.
 */

const StaffLayout = lazy(() => import('./layout/StaffLayout'));
const NotificationsPage = lazy(() => import('./common/NotificationsPage'));

// Quản trị
const AppointmentReportPage = lazy(() => import('./admin/AppointmentReportPage'));
const DoctorSchedulesAdminPage = lazy(() => import('./admin/DoctorSchedulesAdminPage'));
const SpecialtiesPage = lazy(() => import('./admin/SpecialtiesPage'));
const ClinicPage = lazy(() => import('./admin/ClinicPage'));
const StaffAccountsPage = lazy(() => import('./admin/StaffAccountsPage'));
const ServicesAdminPage = lazy(() => import('./admin/ServicesAdminPage'));
const PromotionsPage = lazy(() => import('./admin/PromotionsPage'));
const SettingsPage = lazy(() => import('./admin/SettingsPage'));

// Bác sĩ
const DoctorSchedulePage = lazy(() => import('./doctor/DoctorSchedulePage'));
const DoctorTimeOffPage = lazy(() => import('./doctor/DoctorTimeOffPage'));
const DoctorWorkingHoursPage = lazy(() => import('./doctor/DoctorWorkingHoursPage'));

// Lễ tân
const DeskAppointmentsPage = lazy(() => import('./desk/DeskAppointmentsPage'));
const DeskAppointmentDetailPage = lazy(() => import('./desk/DeskAppointmentDetailPage'));
const DeskBookingPage = lazy(() => import('./desk/DeskBookingPage'));
const PatientsPage = lazy(() => import('./desk/PatientsPage'));
const PatientDetailPage = lazy(() => import('./desk/PatientDetailPage'));
const DoctorTimeOffDeskPage = lazy(() => import('./desk/DoctorTimeOffDeskPage'));
const StaffTimeOffPage = lazy(() => import('./desk/StaffTimeOffPage'));

/** Chờ tải một trang con: chỉ vùng nội dung, sidebar vẫn đứng yên. */
const PageLoading = () => (
  <div className="st-page-loading" role="status" aria-live="polite">
    Đang tải…
  </div>
);

const guard = (anyOf: string[], page: ReactNode) => (
  <PermissionGuard anyOf={anyOf}>
    <Suspense fallback={<PageLoading />}>{page}</Suspense>
  </PermissionGuard>
);

/** Trả về các `<Route>` để đặt thẳng trong `<Routes>` của App. */
export function staffRoutes() {
  return (
    <Route
      element={
        <AuthGuard>
          <Suspense fallback={<FullPageLoader />}>
            <StaffLayout />
          </Suspense>
        </AuthGuard>
      }
    >
      {/* Mọi tài khoản nhân viên đều có thông báo: không cần quyền riêng. */}
      <Route
        path="/thong-bao"
        element={
          <Suspense fallback={<PageLoading />}>
            <NotificationsPage />
          </Suspense>
        }
      />

      {/* Trang đầu của admin là báo cáo lịch hẹn; giữ /quan-tri làm khu của admin cho landing.ts. */}
      <Route path="/quan-tri" element={<Navigate to="/quan-tri/bao-cao-lich-hen" replace />} />
      <Route path="/quan-tri/bao-cao-lich-hen" element={guard([P.ReportsView], <AppointmentReportPage />)} />
      <Route path="/quan-tri/lich-lam-viec" element={guard([P.DoctorSchedulesManage], <DoctorSchedulesAdminPage />)} />
      <Route path="/quan-tri/chuyen-khoa" element={guard([P.ServicesManage], <SpecialtiesPage />)} />
      <Route path="/quan-tri/phong-kham" element={guard([P.SettingsManage], <ClinicPage />)} />
      <Route path="/quan-tri/tai-khoan" element={guard([P.AccountsManageStaff], <StaffAccountsPage />)} />
      <Route path="/quan-tri/dich-vu" element={guard([P.ServicesManage], <ServicesAdminPage />)} />
      <Route path="/quan-tri/khuyen-mai" element={guard([P.PromotionsManage], <PromotionsPage />)} />
      <Route path="/quan-tri/cai-dat" element={guard([P.SettingsManage], <SettingsPage />)} />

      <Route path="/bac-si" element={guard([P.AppointmentsViewOwnSchedule], <DoctorSchedulePage />)} />
      <Route path="/bac-si/bao-nghi" element={guard([P.DoctorTimeOffReportOwn], <DoctorTimeOffPage />)} />
      <Route path="/bac-si/gio-lam" element={guard([P.DoctorSchedulesManageOwn], <DoctorWorkingHoursPage />)} />

      <Route path="/thu-ngan" element={guard([P.AppointmentsManage], <DeskAppointmentsPage />)} />
      <Route
        path="/thu-ngan/lich-hen/:appointmentId"
        element={guard([P.AppointmentsManage], <DeskAppointmentDetailPage />)}
      />
      <Route path="/thu-ngan/dat-lich" element={guard([P.AppointmentsManage], <DeskBookingPage />)} />
      <Route path="/thu-ngan/benh-nhan" element={guard([P.PatientsManage], <PatientsPage />)} />
      <Route path="/thu-ngan/benh-nhan/:patientId" element={guard([P.PatientsManage], <PatientDetailPage />)} />
      <Route path="/thu-ngan/lich-nghi" element={guard([P.AppointmentsManage], <DoctorTimeOffDeskPage />)} />
      <Route path="/thu-ngan/bao-nghi" element={guard([P.StaffTimeOffReportOwn], <StaffTimeOffPage />)} />

    </Route>
  );
}
