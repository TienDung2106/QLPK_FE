import { useState } from 'react';
import {
  apiCreateDoctorSchedule,
  apiGetDoctorSchedules,
  apiSetDoctorScheduleStatus,
  apiUpdateDoctorSchedule,
} from '../../api/functions/admin';
import { apiGetStaffDoctors } from '../../api/functions/desk';
import useAuth from '../../hooks/useAuth';
import { DAY_SHORT, SESSION_LABEL, mergeDayRanges, sessionOf } from '../../utils/workingHours';
import type { SessionKey } from '../../utils/workingHours';
import { PERMISSION } from '../permissions';
import { useApiQuery } from '../hooks';
import { DoctorSelect } from '../components/pickers';
import { WorkingHoursEditor } from '../components/workingHours';
import type { WorkingHoursApi } from '../components/workingHours';
import { Alert, EmptyState, PageHeader, Panel, TableSkeleton } from '../components/ui';

interface OverviewEntry {
  doctorId: number;
  name: string;
  hours: string;
}

/**
 * Cả tuần của mọi bác sĩ đang nhận lịch trên một bảng: cột là thứ, dòng là buổi, mỗi ô là các bác sĩ
 * làm buổi đó. Để admin thấy buổi nào đông, buổi nào trống trước khi sửa ca của một người.
 */
const ScheduleOverview = ({
  version,
  selectedId,
  onPick,
}: {
  version: number;
  selectedId: number | null;
  onPick: (doctorId: number) => void;
}) => {
  const query = useApiQuery(() => apiGetStaffDoctors(), [version]);
  const doctors = query.data?.items ?? [];

  const cells = new Map<string, OverviewEntry[]>();
  const sessions = new Set<SessionKey>(['sang', 'chieu']);
  const days = new Set([1, 2, 3, 4, 5, 6]);
  for (const doctor of doctors) {
    for (let day = 1; day <= 7; day++) {
      for (const [start, end] of mergeDayRanges(doctor.working_hours ?? [], day)) {
        const session = sessionOf(start, end);
        sessions.add(session);
        days.add(day);
        const key = `${session}|${day}`;
        cells.set(key, [
          ...(cells.get(key) ?? []),
          { doctorId: doctor.doctor_id, name: doctor.full_name, hours: `${start.slice(0, 5)}–${end.slice(0, 5)}` },
        ]);
      }
    }
  }
  const dayList = [...days].sort();
  const sessionList = (['sang', 'chieu', 'ca-ngay'] as SessionKey[]).filter((session) => sessions.has(session));

  return (
    <Panel
      title="Tổng quan tuần"
      subtitle="Bác sĩ đang nhận lịch theo từng buổi. Bấm tên để mở ca của bác sĩ đó."
      bodyless
    >
      {query.error && (
        <div className="st-panel-body">
          <Alert tone="danger">{query.error}</Alert>
        </div>
      )}
      <div className="st-table-wrap">
        <table className="st-table">
          <thead>
            <tr>
              <th>Buổi</th>
              {dayList.map((day) => (
                <th key={day}>{DAY_SHORT[day]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {query.loading && doctors.length === 0 ? (
              <TableSkeleton columns={dayList.length + 1} rows={2} />
            ) : (
              sessionList.map((session) => (
                <tr key={session}>
                  <td className="st-strong st-nowrap" style={{ verticalAlign: 'top' }}>
                    {SESSION_LABEL[session]}
                  </td>
                  {dayList.map((day) => {
                    const entries = cells.get(`${session}|${day}`) ?? [];
                    return (
                      <td key={day} style={{ verticalAlign: 'top', minWidth: 120 }}>
                        {entries.length === 0 ? (
                          <span className="st-muted">Trống</span>
                        ) : (
                          entries.map((entry) => (
                            <button
                              key={`${entry.doctorId}|${entry.hours}`}
                              type="button"
                              onClick={() => onPick(entry.doctorId)}
                              title={`${entry.name} · ${entry.hours}`}
                              style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                marginBottom: 4,
                                padding: '2px 6px',
                                borderRadius: 6,
                                border: '1px solid transparent',
                                background: entry.doctorId === selectedId ? 'var(--primary-light, #eff6ff)' : 'transparent',
                                borderColor: entry.doctorId === selectedId ? 'var(--primary, #1877f2)' : 'transparent',
                                cursor: 'pointer',
                              }}
                            >
                              <span className="st-cell-main">{entry.name}</span>
                              <br />
                              <span className="st-cell-sub">{entry.hours}</span>
                            </button>
                          ))
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};

/** Admin khai giờ làm việc cho bất kỳ bác sĩ nào — bác sĩ chưa có khung giờ thì không đặt lịch được. */
const DoctorSchedulesAdminPage = () => {
  const { hasPermission } = useAuth();
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [version, setVersion] = useState(0);

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

      {hasPermission(PERMISSION.AppointmentsManage) && (
        <div style={{ marginBottom: '1rem' }}>
          <ScheduleOverview version={version} selectedId={doctorId} onPick={setDoctorId} />
        </div>
      )}

      {api && doctorId ? (
        <WorkingHoursEditor
          api={api}
          scopeKey={doctorId}
          affectedLinkBase={hasPermission(PERMISSION.AppointmentsManage) ? '/thu-ngan/lich-hen' : undefined}
          onChanged={() => setVersion((current) => current + 1)}
        />
      ) : (
        <Panel>
          <EmptyState title="Chọn một bác sĩ" text="Chọn bác sĩ ở trên hoặc bấm tên trong bảng để sửa khung giờ làm việc." />
        </Panel>
      )}
    </>
  );
};

export default DoctorSchedulesAdminPage;
