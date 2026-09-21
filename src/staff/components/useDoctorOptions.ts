import { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { apiGetStaffAccount, apiSearchStaffAccounts } from '../../api/functions/admin';
import { apiGetStaffDoctors, apiSearchStaffAppointments } from '../../api/functions/desk';
import type { DoctorWorkingHours } from '../../api/types';
import { PERMISSION } from '../permissions';
import { todayIso } from '../format';

export interface DoctorOption {
  doctor_id: number;
  full_name: string;
  detail?: string;
  specialty_id?: number;
  /** Có khi đọc từ GET /api/staff/doctors; rỗng với bác sĩ lấy từ nguồn khác. */
  working_hours?: DoctorWorkingHours[];
}

/**
 * Danh sách bác sĩ cho quầy.
 *
 *  - ai có appointments.manage (lễ tân, admin) đọc GET /api/staff/doctors: bác sĩ đang nhận lịch,
 *    kèm ca làm việc trong tuần;
 *  - ai có accounts.manage_staff (admin) gộp thêm danh sách tài khoản bác sĩ, để cả bác sĩ đang
 *    tạm ngừng nhận lịch vẫn chọn được (vd trang sửa ca làm việc);
 *  - không có quyền nào ở trên thì gom các bác sĩ xuất hiện trong lịch hẹn 60 ngày quanh hôm nay.
 * Bác sĩ không có trong danh sách vẫn chọn được bằng cách nhập mã bác sĩ.
 */
let doctorCache: { key: string; promise: Promise<DoctorOption[]> } | null = null;

async function loadDoctorsFromAccounts(): Promise<DoctorOption[]> {
  const list = await apiSearchStaffAccounts({ role_code: 'doctor', page_size: 100 });
  if (!list.ok || !list.data) {
    return [];
  }
  const details = await Promise.all(list.data.items.map((item) => apiGetStaffAccount(item.account_id)));
  return details
    .filter((result) => result.ok && result.data?.doctor && result.data.is_active)
    .map((result) => ({
      doctor_id: result.data!.doctor!.doctor_id,
      full_name: result.data!.full_name,
      detail: result.data!.doctor!.specialty_name,
    }));
}

async function loadStaffDoctors(): Promise<DoctorOption[]> {
  const result = await apiGetStaffDoctors();
  return (result.data?.items ?? []).map((item) => ({
    doctor_id: item.doctor_id,
    full_name: item.full_name,
    detail: item.specialty_name,
    specialty_id: item.specialty_id,
    working_hours: item.working_hours,
  }));
}

async function loadDoctors(canManage: boolean, canReadAccounts: boolean): Promise<DoctorOption[]> {
  if (!canManage && !canReadAccounts) {
    return loadDoctorsFromAppointments();
  }
  const [staff, accounts] = await Promise.all([
    canManage ? loadStaffDoctors() : Promise.resolve([]),
    canReadAccounts ? loadDoctorsFromAccounts() : Promise.resolve([]),
  ]);
  const merged = new Map(accounts.map((option) => [option.doctor_id, option]));
  for (const option of staff) {
    merged.set(option.doctor_id, option);
  }
  return [...merged.values()];
}

async function loadDoctorsFromAppointments(): Promise<DoctorOption[]> {
  const result = await apiSearchStaffAppointments({
    from_date: todayIso(-60),
    to_date: todayIso(60),
    page_size: 100,
  });
  const seen = new Map<number, DoctorOption>();
  for (const item of result.data?.items ?? []) {
    if (!seen.has(item.doctor_id)) {
      seen.set(item.doctor_id, { doctor_id: item.doctor_id, full_name: item.doctor_full_name });
    }
  }
  return [...seen.values()];
}

export function useDoctorOptions() {
  const { hasPermission } = useAuth();
  const canReadAccounts = hasPermission(PERMISSION.AccountsManageStaff);
  const canManage = hasPermission(PERMISSION.AppointmentsManage);
  const [options, setOptions] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = `${canManage}|${canReadAccounts}`;
    if (!doctorCache || doctorCache.key !== key) {
      doctorCache = {
        key,
        promise: loadDoctors(canManage, canReadAccounts).then((items) =>
          items.sort((a, b) => a.full_name.localeCompare(b.full_name, 'vi')),
        ),
      };
    }
    let alive = true;
    doctorCache.promise.then((items) => {
      if (alive) {
        setOptions(items);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [canManage, canReadAccounts]);

  return { options, loading };
}
