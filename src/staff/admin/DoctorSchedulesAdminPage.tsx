import { useState } from 'react';
import {
  apiCreateDoctorSchedule,
  apiGetDoctorSchedules,
  apiSetDoctorScheduleStatus,
  apiUpdateDoctorSchedule,
} from '../../api/functions/admin';
import useAuth from '../../hooks/useAuth';
import { PERMISSION } from '../permissions';
import { DoctorSelect } from '../components/pickers';
import { WorkingHoursEditor } from '../components/workingHours';
import type { WorkingHoursApi } from '../components/workingHours';
import { EmptyState, PageHeader, Panel } from '../components/ui';

/** Admin khai giờ làm việc cho bất kỳ bác sĩ nào — bác sĩ chưa có khung giờ thì không đặt lịch được. */
const DoctorSchedulesAdminPage = () => {
  const { hasPermission } = useAuth();
  const [doctorId, setDoctorId] = useState<number | null>(null);

  const api: WorkingHoursApi | null = doctorId
    ? {
        list: (includeInactive) => apiGetDoctorSchedules(doctorId, { include_inactive: includeInactive || undefined }),
        create: (payload) => apiCreateDoctorSchedule(doctorId, payload),
        update: (scheduleId, payload) => apiUpdateDoctorSchedule(doctorId, scheduleId, payload),
        setStatus: (scheduleId, isActive) => apiSetDoctorScheduleStatus(doctorId, scheduleId, isActive),
      }
    : null;

  return (
    <>
      <PageHeader
        title="Lịch làm việc bác sĩ"
        description="Khung giờ khám hằng tuần của từng bác sĩ. Bác sĩ cũng tự sửa được giờ của mình."
      />

      <div className="st-panel" style={{ padding: '0.85rem 1rem', marginBottom: '1rem', maxWidth: 420 }}>
        <DoctorSelect value={doctorId} onChange={setDoctorId} />
      </div>

      {api && doctorId ? (
        <WorkingHoursEditor
          api={api}
          scopeKey={doctorId}
          affectedLinkBase={hasPermission(PERMISSION.AppointmentsManage) ? '/thu-ngan/lich-hen' : undefined}
        />
      ) : (
        <Panel>
          <EmptyState title="Chọn một bác sĩ" text="Chọn bác sĩ ở trên để xem và sửa khung giờ làm việc." />
        </Panel>
      )}
    </>
  );
};

export default DoctorSchedulesAdminPage;
