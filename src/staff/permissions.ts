/** Mã quyền (QLPK.DataBaseAccess/Constants/PermissionCodes.cs). */
export const PERMISSION = {
  AppointmentsManage: 'appointments.manage',
  AppointmentsViewOwnSchedule: 'appointments.view_own_schedule',
  AppointmentsCheckInAssist: 'appointments.checkin_assist',
  ServicesManage: 'services.manage',
  DiscountApplyWithinThreshold: 'discount.apply_within_threshold',
  DiscountApproveOverThreshold: 'discount.approve_over_threshold',
  PromotionsManage: 'promotions.manage',
  InventoryViewAdjust: 'inventory.view_adjust',
  PaymentsManage: 'payments.manage',
  SettingsManage: 'settings.manage',
  AccountsManageStaff: 'accounts.manage_staff',
  ExaminationsPerform: 'examinations.perform',
  PrescriptionsDispense: 'prescriptions.dispense',
  ReportsViewRevenue: 'reports.view_revenue',
  PatientsManage: 'patients.manage',
  DoctorTimeOffReportOwn: 'doctor_time_off.report_own',
} as const;
