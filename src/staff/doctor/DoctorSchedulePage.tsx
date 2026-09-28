import { useMemo, useState } from 'react';
import { CalendarPlus, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { apiCompleteAppointment, apiGetDoctorDashboard, apiGetDoctorSchedule } from '../../api/functions/doctorWork';
import type { ApiResult } from '../../api/helpers';
import type { AppointmentQuery } from '../../api/staffTypes';
import type { AppointmentListItem, PagedResponse } from '../../api/types';
import useAuth from '../../hooks/useAuth';
import { PERMISSION } from '../permissions';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, formatTime, todayIso } from '../format';
import { APPOINTMENT_STATUS, CONSULTATION_MODE_LABEL, DAY_OF_WEEK_LABEL, STANDARD_SHIFTS, isoDayOfWeek, labelOf, textOf } from '../labels';
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

const dayMonth = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Lịch hẹn không lưu ca; appointment_time là giờ bắt đầu ca nên suy ra từ bốn ca chuẩn. */
function shiftOf(time: string) {
  const hhmm = formatTime(time);
  const shift = STANDARD_SHIFTS.find((s) => s.start_time <= hhmm && hhmm < s.end_time);
  return shift
    ? {
        key: shift.start_time,
        label: shift.label,
        range: `${shift.start_time}–${shift.end_time}`,
      }
    : { key: hhmm, label: hhmm, range: '' };
}

/** API giới hạn 100 dòng/trang; một tuần có thể nhiều hơn nên tải đủ các trang. */
async function loadAll(query: AppointmentQuery): Promise<ApiResult<PagedResponse<AppointmentListItem>>> {
  const first = await apiGetDoctorSchedule({ ...query, page_size: 100 });
  if (!first.ok || !first.data) return first;
  const items = [...first.data.items];
  for (let page = 2; page <= first.data.total_pages; page++) {
    const next = await apiGetDoctorSchedule({
      ...query,
      page_size: 100,
      page_number: page,
    });
    if (!next.ok || !next.data) return next;
    items.push(...next.data.items);
  }
  return { ...first, data: { ...first.data, items } };
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
  const [view, setView] = useState('day');
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

  const isWeek = view === 'week';
  const weekStart = shiftDate(date, 1 - isoDayOfWeek(date));
  const weekDays = Array.from({ length: 7 }, (_, i) => shiftDate(weekStart, i));
  const weekLabel = `${dayMonth(weekDays[0])} – ${dayMonth(weekDays[6])}`;

  const dashboard = useApiQuery(apiGetDoctorDashboard, []);
  const query = useApiQuery(
    () =>
      loadAll({
        from_date: isWeek ? weekDays[0] : date,
        to_date: isWeek ? weekDays[6] : date,
        status: tab === 'active' || tab === '' ? undefined : tab,
      }),
    [isWeek ? weekStart : date, isWeek, tab],
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

  // Bốn ca chuẩn luôn hiện để thấy ca trống; giờ lẻ (nếu có) thành dòng riêng.
  const shiftRows = useMemo(() => {
    const shifts = new Map(STANDARD_SHIFTS.map((s) => [s.start_time, shiftOf(s.start_time)]));
    for (const item of rows) {
      const shift = shiftOf(item.appointment_time);
      if (!shifts.has(shift.key)) shifts.set(shift.key, shift);
    }
    return [...shifts.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [rows]);
  const cells = useMemo(() => {
    const map = new Map<string, AppointmentListItem[]>();
    for (const item of rows) {
      const key = `${item.appointment_date.slice(0, 10)}|${shiftOf(item.appointment_time).key}`;
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [rows]);

  const stats = dashboard.data;
  const today = todayIso();
  const isToday = date === today;
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
          isWeek
            ? `${rows.length} lịch trong tuần ${weekLabel}.`
            : isToday
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
              setView('day');
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
            <Button
              iconOnly
              variant="ghost"
              aria-label={isWeek ? 'Tuần trước' : 'Ngày trước'}
              icon={<ChevronLeft size={16} />}
              onClick={() => setDate(shiftDate(date, isWeek ? -7 : -1))}
            />
            <Field label={isWeek ? `Tuần ${weekLabel}` : 'Ngày'}>
              {(id) => <input id={id} type="date" className="st-input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />}
            </Field>
            <Button
              iconOnly
              variant="ghost"
              aria-label={isWeek ? 'Tuần sau' : 'Ngày sau'}
              icon={<ChevronRight size={16} />}
              onClick={() => setDate(shiftDate(date, isWeek ? 7 : 1))}
            />
            {!isToday && (
              <Button variant="ghost" size="sm" onClick={() => setDate(todayIso())}>
                Hôm nay
              </Button>
            )}
          </div>
          <FilterTabs
            label="Chế độ xem"
            options={[
              { value: 'day', label: 'Theo ngày' },
              { value: 'week', label: 'Theo tuần' },
            ]}
            value={view}
            onChange={setView}
          />
          <FilterTabs label="Lọc trạng thái" options={tabs} value={tab} onChange={setTab} />
        </div>

        {isWeek ? (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Ca</th>
                  {weekDays.map((day) => (
                    <th key={day} style={{ minWidth: 130 }}>
                      <button
                        type="button"
                        className="st-cell-main"
                        title="Xem chi tiết ngày này"
                        onClick={() => {
                          setDate(day);
                          setView('day');
                        }}
                        style={{
                          background: 'none',
                          border: 0,
                          padding: 0,
                          cursor: 'pointer',
                          textAlign: 'left',
                          color: day === today ? 'var(--primary, #1877f2)' : undefined,
                        }}
                      >
                        {DAY_OF_WEEK_LABEL[isoDayOfWeek(day)]}
                        <br />
                        <span className="st-cell-sub">{day === today ? `Hôm nay · ${dayMonth(day)}` : dayMonth(day)}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TableState
                  columns={8}
                  loading={query.loading}
                  error={query.error}
                  isEmpty={query.loading}
                  onRetry={query.reload}
                  emptyTitle=""
                  emptyText=""
                />
                {!query.loading &&
                  !query.error &&
                  shiftRows.map((shift) => (
                    <tr key={shift.key}>
                      <td className="st-strong st-nowrap" style={{ verticalAlign: 'top' }}>
                        {shift.label}
                        {shift.range && <div className="st-cell-sub">{shift.range}</div>}
                      </td>
                      {weekDays.map((day) => {
                        const entries = cells.get(`${day}|${shift.key}`) ?? [];
                        return (
                          <td
                            key={day}
                            style={{
                              verticalAlign: 'top',
                              background: day === today ? 'var(--primary-light, #eff6ff)' : undefined,
                            }}
                          >
                            {entries.length === 0 ? (
                              <span className="st-muted">—</span>
                            ) : (
                              entries.map((item) => (
                                <button
                                  key={item.appointment_id}
                                  type="button"
                                  onClick={() => setViewing(item)}
                                  title={`${item.patient_full_name} · ${formatTime(item.appointment_time)}`}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    marginBottom: 6,
                                    padding: 0,
                                    background: 'none',
                                    border: 0,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <span className="st-cell-main">
                                    {item.queue_number ? `${item.queue_number}. ` : ''}
                                    {item.patient_full_name}
                                  </span>
                                  <br />
                                  <StatusBadge value={labelOf(APPOINTMENT_STATUS, item.status)} />
                                  {item.consultation_mode !== 'in_clinic' && (
                                    <span className="st-cell-sub"> {textOf(CONSULTATION_MODE_LABEL, item.consultation_mode)}</span>
                                  )}
                                </button>
                              ))
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Giờ</th>
                  <th>Ca</th>
                  <th>Bệnh nhân</th>
                  <th>Hình thức</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <TableState
                  columns={7}
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
                      <td className="st-nowrap">{shiftOf(item.appointment_time).label}</td>
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
        )}
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
