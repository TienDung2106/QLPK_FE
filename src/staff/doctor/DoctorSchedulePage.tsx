import { useMemo, useState } from 'react';
import { CalendarPlus, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { apiCompleteAppointment, apiGetDoctorDashboard, apiGetDoctorSchedule } from '../../api/functions/doctorWork';
import type { AppointmentListItem } from '../../api/types';
import useAuth from '../../hooks/useAuth';
import { PERMISSION } from '../permissions';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, formatTime, todayIso } from '../format';
import { APPOINTMENT_STATUS, CONSULTATION_MODE_LABEL, labelOf, textOf } from '../labels';
import { useToast } from '../components/toastContext';
import { Button, Field, FilterTabs, PageHeader, StatusBadge, TableState } from '../components/ui';
import { FollowUpSheet } from './FollowUpSheet';
import { VisitReasonSheet } from './VisitReasonSheet';

const ACTIVE = ['confirmed', 'checked_in', 'pending', 'pending_approval'];

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

function shiftDate(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Hàng đợi của bác sĩ trong một ngày. Người đã nhận phòng xếp lên đầu theo số thứ tự,
 * vì đó là người đang ngồi chờ ngoài cửa. Khám xong thì bác sĩ bấm "Hoàn thành khám", sau đó
 * mới hẹn tái khám được. Bấm vào một dòng để xem lý do khám và ảnh bệnh nhân gửi kèm. Việc xác nhận/từ chối lịch bệnh nhân tự đặt thuộc về lễ tân hoặc admin.
 */
const DoctorSchedulePage = () => {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const { run, isPending } = useAction();
  const [date, setDate] = useState(todayIso());
  const [tab, setTab] = useState('active');
  const [followUpFor, setFollowUpFor] = useState<AppointmentListItem | null>(null);
  const [viewing, setViewing] = useState<AppointmentListItem | null>(null);
  const canComplete = hasPermission(PERMISSION.ExaminationsPerform);
  const canFollowUp = hasPermission(PERMISSION.AppointmentsBookFollowUp);

  const tabs = [
    { value: 'active', label: 'Cần khám' },
    { value: '', label: 'Tất cả' },
    { value: 'completed', label: 'Đã xong' },
    { value: 'cancelled', label: 'Đã huỷ' },
  ];

  const dashboard = useApiQuery(apiGetDoctorDashboard, []);
  const query = useApiQuery(
    () =>
      apiGetDoctorSchedule({
        from_date: date,
        to_date: date,
        status: tab === 'active' || tab === '' ? undefined : tab,
        page_size: 100,
      }),
    [date, tab],
  );

  const rows = useMemo(() => {
    const items = (query.data?.items ?? []).filter((item) => tab !== 'active' || ACTIVE.includes(item.status));
    const rank = (status: string) => (status === 'checked_in' ? 0 : 1);
    return [...items].sort(
      (a, b) =>
        rank(a.status) - rank(b.status) ||
        (a.queue_number ?? 9999) - (b.queue_number ?? 9999) ||
        a.appointment_time.localeCompare(b.appointment_time),
    );
  }, [query.data, tab]);

  const stats = dashboard.data;
  const isToday = date === todayIso();
  const waiting = stats?.waiting_to_be_seen ?? (query.data?.items ?? []).filter((item) => item.status === 'checked_in').length;

  const reloadAll = () => {
    query.reload();
    dashboard.reload();
  };

  const complete = async (item: AppointmentListItem) => {
    const result = await run(`complete-${item.appointment_id}`, () => apiCompleteAppointment(item.appointment_id));
    if (result.ok) {
      toast.success(`Đã khám xong: ${item.patient_full_name}.`);
      reloadAll();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <PageHeader
        title="Lịch khám của tôi"
        description={
          isToday
            ? waiting > 0
              ? `${waiting} bệnh nhân đã nhận phòng và đang chờ khám.`
              : 'Chưa có bệnh nhân nào đang chờ ngoài phòng.'
            : `Lịch ngày ${formatDate(date)}.`
        }
        actions={
          <Button icon={<RefreshCw size={15} />} onClick={reloadAll}>
            Làm mới
          </Button>
        }
      />

      {stats && (
        <div className="st-stats">
          <div className="st-stat">
            <div className="st-stat-label">Lịch hôm nay</div>
            <div className="st-stat-value">{stats.appointments_today}</div>
            <div className="st-stat-sub">{stats.completed_today} đã khám xong</div>
          </div>
          <button
            type="button"
            className="st-stat"
            onClick={() => {
              setDate(todayIso());
              setTab('active');
            }}
          >
            <div className="st-stat-label">Đang chờ khám</div>
            <div className={`st-stat-value ${stats.waiting_to_be_seen > 0 ? 'progress' : ''}`}>{stats.waiting_to_be_seen}</div>
            <div className="st-stat-sub">đã nhận phòng</div>
          </button>
          {stats.next_appointment ? (
            <div className="st-stat">
              <div className="st-stat-label">Bệnh nhân kế tiếp</div>
              <div className="st-stat-value" style={{ fontSize: '1.05rem', marginTop: '0.3rem' }}>
                {stats.next_appointment.patient_full_name}
              </div>
              <div className="st-stat-sub">
                {formatTime(stats.next_appointment.appointment_time)}
                {stats.next_appointment.queue_number ? ` · STT ${stats.next_appointment.queue_number}` : ''}
              </div>
            </div>
          ) : (
            <div className="st-stat">
              <div className="st-stat-label">Bệnh nhân kế tiếp</div>
              <div className="st-stat-sub" style={{ marginTop: '0.45rem' }}>
                Không còn ai trong hôm nay.
              </div>
            </div>
          )}
        </div>
      )}

      <section className="st-panel">
        <div className="st-toolbar">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.35rem' }}>
            <Button iconOnly variant="ghost" aria-label="Ngày trước" icon={<ChevronLeft size={16} />} onClick={() => setDate(shiftDate(date, -1))} />
            <Field label="Ngày">
              {(id) => <input id={id} type="date" className="st-input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />}
            </Field>
            <Button iconOnly variant="ghost" aria-label="Ngày sau" icon={<ChevronRight size={16} />} onClick={() => setDate(shiftDate(date, 1))} />
            {!isToday && (
              <Button variant="ghost" size="sm" onClick={() => setDate(todayIso())}>
                Hôm nay
              </Button>
            )}
          </div>
          <FilterTabs label="Lọc trạng thái" options={tabs} value={tab} onChange={setTab} />
        </div>

        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Giờ</th>
                <th>Bệnh nhân</th>
                <th>Hình thức</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <TableState
                columns={6}
                loading={query.loading}
                error={query.error}
                isEmpty={rows.length === 0}
                onRetry={query.reload}
                emptyTitle="Không có lịch khám"
                emptyText={tab === 'active' ? 'Không còn bệnh nhân nào cần khám trong ngày này.' : 'Không có lịch hẹn khớp bộ lọc.'}
              />
              {rows.map((item) => {
                return (
                  <tr key={item.appointment_id} className="st-row-link" onClick={() => setViewing(item)}>
                    <td>
                      <span className={`st-queue ${item.queue_number ? '' : 'empty'}`}>{item.queue_number ?? '—'}</span>
                    </td>
                    <td className="st-strong">
                      {formatTime(item.appointment_time)}
                      <div className="st-cell-sub">{item.duration_minutes} phút</div>
                    </td>
                    <td>
                      <div className="st-cell-main">{item.patient_full_name}</div>
                      <div className="st-cell-sub">
                        {item.reason_for_visit ? truncate(item.reason_for_visit, 60) : `Lượt khám #${item.appointment_id}`}
                      </div>
                    </td>
                    <td>{textOf(CONSULTATION_MODE_LABEL, item.consultation_mode)}</td>
                    <td>
                      <StatusBadge value={labelOf(APPOINTMENT_STATUS, item.status)} />
                    </td>
                    <td className="st-num st-nowrap">
                      {canComplete && item.status === 'checked_in' && (
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<CheckCircle2 size={14} />}
                          loading={isPending(`complete-${item.appointment_id}`)}
                          onClick={(event) => {
                            event.stopPropagation();
                            complete(item);
                          }}
                        >
                          Hoàn thành khám
                        </Button>
                      )}
                      {canFollowUp && item.status === 'completed' && (
                        <Button
                          size="sm"
                          icon={<CalendarPlus size={14} />}
                          onClick={(event) => {
                            event.stopPropagation();
                            setFollowUpFor(item);
                          }}
                        >
                          Hẹn tái khám
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <VisitReasonSheet appointment={viewing} onClose={() => setViewing(null)} />

      <FollowUpSheet
        open={followUpFor !== null}
        appointmentId={followUpFor?.appointment_id ?? 0}
        patientName={followUpFor?.patient_full_name ?? ''}
        suggestedDate=""
        onClose={() => setFollowUpFor(null)}
        onBooked={(booked) => {
          setFollowUpFor(null);
          toast.success(`Đã hẹn tái khám ${formatDate(booked.appointment_date)} lúc ${formatTime(booked.appointment_time)}.`);
          reloadAll();
        }}
      />
    </>
  );
};

export default DoctorSchedulePage;
