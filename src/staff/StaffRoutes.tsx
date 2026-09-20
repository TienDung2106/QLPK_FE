/* eslint-disable react-refresh/only-export-components -- file chỉ khai báo route và trang tải lười, không phải nơi cần hot reload. */
import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Route } from 'react-router-dom';
import { AuthGuard, PermissionGuard } from '../auth/AuthGuard';
import { FullPageLoader } from '../components/FullPageLoader/FullPageLoader';
import { PERMISSION as P } from './permissions';

/*
 * Mọi trang nhân viên tải lười: bệnh nhân mở trang chủ không phải tải mã quản trị, nhà thuốc
 * hay thu ngân. Chỉ file này nằm trong bundle chính, và nó chỉ chứa khai báo.
 */

const StaffLayout = lazy(() => import('./layout/StaffLayout'));
const NotificationsPage = lazy(() => import('./common/NotificationsPage'));

// Quản trị
const AdminDashboardPage = lazy(() => import('./admin/AdminDashboardPage'));
const RevenuePage = lazy(() => import('./admin/RevenuePage'));
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
const ExaminationPage = lazy(() => import('./doctor/ExaminationPage'));
const DoctorTimeOffPage = lazy(() => import('./doctor/DoctorTimeOffPage'));
const DoctorWorkingHoursPage = lazy(() => import('./doctor/DoctorWorkingHoursPage'));

// Thu ngân / lễ tân
const DeskAppointmentsPage = lazy(() => import('./desk/DeskAppointmentsPage'));
const DeskAppointmentDetailPage = lazy(() => import('./desk/DeskAppointmentDetailPage'));
const DeskBookingPage = lazy(() => import('./desk/DeskBookingPage'));
const PatientsPage = lazy(() => import('./desk/PatientsPage'));
const PatientDetailPage = lazy(() => import('./desk/PatientDetailPage'));
const SettlementQueuePage = lazy(() => import('./desk/SettlementQueuePage'));
const InvoicesPage = lazy(() => import('./desk/InvoicesPage'));
const InvoiceDetailPage = lazy(() => import('./desk/InvoiceDetailPage'));
const DoctorTimeOffDeskPage = lazy(() => import('./desk/DoctorTimeOffDeskPage'));

// Nhà thuốc
const PrescriptionsPage = lazy(() => import('./pharmacy/PrescriptionsPage'));
const PrescriptionDetailPage = lazy(() => import('./pharmacy/PrescriptionDetailPage'));
const InventoryPage = lazy(() => import('./pharmacy/InventoryPage'));
const MedicineDetailPage = lazy(() => import('./pharmacy/MedicineDetailPage'));
const ReorderPage = lazy(() => import('./pharmacy/ReorderPage'));
const SuppliersPage = lazy(() => import('./pharmacy/SuppliersPage'));
const InventoryReportPage = lazy(() => import('./pharmacy/InventoryReportPage'));
const StockHistoryPage = lazy(() => import('./pharmacy/StockHistoryPage'));

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

      <Route path="/quan-tri" element={guard([P.ReportsViewRevenue], <AdminDashboardPage />)} />
      <Route path="/quan-tri/doanh-thu" element={guard([P.ReportsViewRevenue], <RevenuePage />)} />
      <Route path="/quan-tri/bao-cao-lich-hen" element={guard([P.ReportsViewRevenue], <AppointmentReportPage />)} />
      <Route path="/quan-tri/lich-lam-viec" element={guard([P.DoctorSchedulesManage], <DoctorSchedulesAdminPage />)} />
      <Route path="/quan-tri/chuyen-khoa" element={guard([P.ServicesManage], <SpecialtiesPage />)} />
      <Route path="/quan-tri/phong-kham" element={guard([P.SettingsManage], <ClinicPage />)} />
      <Route path="/quan-tri/tai-khoan" element={guard([P.AccountsManageStaff], <StaffAccountsPage />)} />
      <Route path="/quan-tri/dich-vu" element={guard([P.ServicesManage], <ServicesAdminPage />)} />
      <Route path="/quan-tri/khuyen-mai" element={guard([P.PromotionsManage], <PromotionsPage />)} />
      <Route path="/quan-tri/cai-dat" element={guard([P.SettingsManage], <SettingsPage />)} />

      <Route path="/bac-si" element={guard([P.AppointmentsViewOwnSchedule], <DoctorSchedulePage />)} />
      <Route path="/bac-si/kham/:appointmentId" element={guard([P.ExaminationsPerform], <ExaminationPage />)} />
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
      <Route path="/thu-ngan/cho-thanh-toan" element={guard([P.PaymentsManage], <SettlementQueuePage />)} />
      <Route path="/thu-ngan/hoa-don" element={guard([P.PaymentsManage], <InvoicesPage />)} />
      <Route path="/thu-ngan/hoa-don/:invoiceId" element={guard([P.PaymentsManage], <InvoiceDetailPage />)} />
      <Route path="/thu-ngan/lich-nghi" element={guard([P.AppointmentsManage], <DoctorTimeOffDeskPage />)} />

      <Route path="/nha-thuoc" element={guard([P.PrescriptionsDispense], <PrescriptionsPage />)} />
      <Route
        path="/nha-thuoc/don-thuoc/:prescriptionId"
        element={guard([P.PrescriptionsDispense], <PrescriptionDetailPage />)}
      />
      <Route path="/nha-thuoc/kho" element={guard([P.InventoryViewAdjust], <InventoryPage />)} />
      <Route path="/nha-thuoc/kho/:medicineId" element={guard([P.InventoryViewAdjust], <MedicineDetailPage />)} />
      <Route path="/nha-thuoc/goi-y-nhap" element={guard([P.InventoryViewAdjust], <ReorderPage />)} />
      <Route path="/nha-thuoc/nha-cung-cap" element={guard([P.InventoryViewAdjust], <SuppliersPage />)} />
      <Route path="/nha-thuoc/bao-cao" element={guard([P.InventoryViewAdjust], <InventoryReportPage />)} />
      <Route path="/nha-thuoc/lich-su-kho" element={guard([P.InventoryViewAdjust], <StockHistoryPage />)} />
    </Route>
  );
}
