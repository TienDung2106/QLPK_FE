import { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { apiGetStaffAccount, apiSearchStaffAccounts } from '../../api/functions/admin';
import { apiSearchStaffAppointments } from '../../api/functions/desk';
import { PERMISSION } from '../permissions';
import { todayIso } from '../format';

export interface DoctorOption {
  doctor_id: number;
  full_name: string;
  detail?: string;
}

/**
 * Danh sách bác sĩ cho quầy.
 *
 * Backend chưa có API liệt kê bác sĩ cho nhân viên: GET /api/doctors chỉ mở cho quyền
 * appointments.book_own của bệnh nhân. Nên:
 *  - ai có accounts.manage_staff (admin) thì đọc từ danh sách tài khoản bác sĩ;
 *  - còn lại gom các bác sĩ xuất hiện trong lịch hẹn 60 ngày quanh hôm nay.
 * Bác sĩ chưa từng có lịch vẫn chọn được bằng cách nhập mã bác sĩ.
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
  const [options, setOptions] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = canReadAccounts ? 'accounts' : 'appointments';
    if (!doctorCache || doctorCache.key !== key) {
      doctorCache = {
        key,
        promise: (canReadAccounts ? loadDoctorsFromAccounts() : loadDoctorsFromAppointments()).then((items) =>
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
  }, [canReadAccounts]);

  return { options, loading };
}
