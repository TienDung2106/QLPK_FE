import type { ReactNode } from 'react';
import {
  Activity,
  BadgePercent,
  Building,
  CalendarRange,
  FileSignature,
  LayoutDashboard,
  Layers,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  CalendarPlus,
  ClipboardList,
  FileText,
  History,
  PieChart,
  Pill,
  Receipt,
  Settings,
  ShoppingCart,
  Stethoscope,
  Truck,
  Users,
  UserCog,
  Wallet,
} from 'lucide-react';
import { PERMISSION } from '../permissions';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  permission: string;
  /** Chỉ sáng khi đúng đường dẫn, không sáng cho trang con. */
  end?: boolean;
}

export interface NavSection {
  key: 'admin' | 'doctor' | 'desk' | 'pharmacy';
  title: string;
  base: string;
  items: NavItem[];
}

const ICON = 17;

export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'admin',
    title: 'Quản trị',
    base: '/quan-tri',
    items: [
      { to: '/quan-tri', label: 'Tổng quan', icon: <LayoutDashboard size={ICON} />, permission: PERMISSION.ReportsViewRevenue, end: true },
      { to: '/quan-tri/doanh-thu', label: 'Doanh thu', icon: <BarChart3 size={ICON} />, permission: PERMISSION.ReportsViewRevenue },
      { to: '/quan-tri/bao-cao-lich-hen', label: 'Báo cáo lịch hẹn', icon: <CalendarRange size={ICON} />, permission: PERMISSION.ReportsViewRevenue },
      { to: '/quan-tri/tai-khoan', label: 'Tài khoản nhân viên', icon: <UserCog size={ICON} />, permission: PERMISSION.AccountsManageStaff },
      { to: '/quan-tri/hop-dong', label: 'Hợp đồng', icon: <FileSignature size={ICON} />, permission: PERMISSION.ContractsManage },
      { to: '/quan-tri/lich-lam-viec', label: 'Lịch làm việc bác sĩ', icon: <CalendarClock size={ICON} />, permission: PERMISSION.DoctorSchedulesManage },
      { to: '/quan-tri/dich-vu', label: 'Dịch vụ', icon: <ClipboardList size={ICON} />, permission: PERMISSION.ServicesManage },
      { to: '/quan-tri/chuyen-khoa', label: 'Chuyên khoa', icon: <Layers size={ICON} />, permission: PERMISSION.ServicesManage },
      { to: '/quan-tri/khuyen-mai', label: 'Khuyến mãi', icon: <BadgePercent size={ICON} />, permission: PERMISSION.PromotionsManage },
      { to: '/quan-tri/phong-kham', label: 'Phòng khám', icon: <Building size={ICON} />, permission: PERMISSION.SettingsManage },
      { to: '/quan-tri/cai-dat', label: 'Cài đặt hệ thống', icon: <Settings size={ICON} />, permission: PERMISSION.SettingsManage },
      { to: '/quan-tri/tac-vu', label: 'Tác vụ nền', icon: <Activity size={ICON} />, permission: PERMISSION.SettingsManage },
    ],
  },
  {
    key: 'doctor',
    title: 'Bác sĩ',
    base: '/bac-si',
    items: [
      { to: '/bac-si', label: 'Lịch khám của tôi', icon: <Stethoscope size={ICON} />, permission: PERMISSION.AppointmentsViewOwnSchedule, end: true },
      { to: '/bac-si/gio-lam', label: 'Giờ làm việc', icon: <CalendarClock size={ICON} />, permission: PERMISSION.DoctorSchedulesManageOwn },
      { to: '/bac-si/bao-nghi', label: 'Báo nghỉ', icon: <CalendarOff size={ICON} />, permission: PERMISSION.DoctorTimeOffReportOwn },
    ],
  },
  {
    key: 'desk',
    title: 'Thu ngân & Lễ tân',
    base: '/thu-ngan',
    items: [
      { to: '/thu-ngan', label: 'Lịch hẹn', icon: <CalendarDays size={ICON} />, permission: PERMISSION.AppointmentsManage, end: true },
      { to: '/thu-ngan/dat-lich', label: 'Đặt lịch / Vãng lai', icon: <CalendarPlus size={ICON} />, permission: PERMISSION.AppointmentsManage },
      { to: '/thu-ngan/benh-nhan', label: 'Bệnh nhân', icon: <Users size={ICON} />, permission: PERMISSION.PatientsManage },
      { to: '/thu-ngan/cho-thanh-toan', label: 'Chờ thanh toán', icon: <Wallet size={ICON} />, permission: PERMISSION.PaymentsManage },
      { to: '/thu-ngan/hoa-don', label: 'Hoá đơn', icon: <Receipt size={ICON} />, permission: PERMISSION.PaymentsManage },
      { to: '/thu-ngan/lich-nghi', label: 'Lịch nghỉ bác sĩ', icon: <CalendarClock size={ICON} />, permission: PERMISSION.AppointmentsManage },
    ],
  },
  {
    key: 'pharmacy',
    title: 'Nhà thuốc',
    base: '/nha-thuoc',
    items: [
      { to: '/nha-thuoc', label: 'Đơn thuốc', icon: <FileText size={ICON} />, permission: PERMISSION.PrescriptionsDispense, end: true },
      { to: '/nha-thuoc/kho', label: 'Tồn kho', icon: <Pill size={ICON} />, permission: PERMISSION.InventoryViewAdjust },
      { to: '/nha-thuoc/bao-cao', label: 'Báo cáo kho', icon: <PieChart size={ICON} />, permission: PERMISSION.InventoryViewAdjust },
      { to: '/nha-thuoc/goi-y-nhap', label: 'Gợi ý nhập hàng', icon: <ShoppingCart size={ICON} />, permission: PERMISSION.InventoryViewAdjust },
      { to: '/nha-thuoc/nha-cung-cap', label: 'Nhà cung cấp', icon: <Truck size={ICON} />, permission: PERMISSION.InventoryViewAdjust },
      { to: '/nha-thuoc/lich-su-kho', label: 'Lịch sử kho', icon: <History size={ICON} />, permission: PERMISSION.InventoryViewAdjust },
    ],
  },
];

