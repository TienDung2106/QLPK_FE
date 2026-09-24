import { Link } from 'react-router-dom';
import type { TimeOff } from '../../api/staffTypes';
import type { TimeOffFormValue } from './timeOffForm';
import { TIME_OFF_PERIODS, timeOffPeriodLabel } from './timeOffForm';
import type { QueryState } from '../hooks';
import { formatDate, formatDateTime, formatTime, todayIso } from '../format';
import { APPOINTMENT_STATUS, labelOf } from '../labels';
import { Button, EmptyState, Field, Panel, StatusBadge, TableSkeleton, Alert } from './ui';

export const TimeOffForm = ({ value, onChange }: { value: TimeOffFormValue; onChange: (value: TimeOffFormValue) => void }) => (
  <div className="st-form-grid">
    <Field label="Ngày nghỉ" required className="st-span-2">
      {(id) => <input id={id} type="date" className="st-input" value={value.off_date} onChange={(e) => onChange({ ...value, off_date: e.target.value })} />}
    </Field>
    <div className="st-span-2">
      <span className="st-label">Nghỉ ca nào</span>
      <div className="st-chip-row" role="radiogroup" aria-label="Nghỉ ca nào">
        {TIME_OFF_PERIODS.map((period) => (
          <button
            key={period.key}
            type="button"
            role="radio"
            aria-checked={value.period === period.key}
            className={`st-slot ${value.period === period.key ? 'active' : ''}`}
            onClick={() => onChange({ ...value, period: period.key })}
          >
            {period.label}
            {period.start && <span className="st-muted"> · {period.start}–{period.end}</span>}
          </button>
        ))}
      </div>
    </div>
    {value.period === 'custom' && (
      <>
        <Field label="Từ giờ" required>
          {(id) => <input id={id} type="time" className="st-input" value={value.start_time} onChange={(e) => onChange({ ...value, start_time: e.target.value })} />}
        </Field>
        <Field label="Đến giờ" required>
          {(id) => <input id={id} type="time" className="st-input" value={value.end_time} onChange={(e) => onChange({ ...value, end_time: e.target.value })} />}
        </Field>
      </>
    )}
    <Field label="Lý do" required className="st-span-2">
      {(id) => <textarea id={id} className="st-textarea" maxLength={255} value={value.reason} onChange={(e) => onChange({ ...value, reason: e.target.value })} />}
    </Field>
  </div>
);

export const TimeOffList = ({
  query,
  emptyText,
  appointmentLinkBase,
  onWithdraw,
}: {
  query: QueryState<TimeOff[]>;
  emptyText: string;
  /** Có thì lịch hẹn bị ảnh hưởng thành liên kết (khu quầy). */
  appointmentLinkBase?: string;
  /** Có thì hiện nút "Rút lại" cho ngày nghỉ chưa tới. */
  onWithdraw?: (item: TimeOff) => void;
}) => {
  const today = todayIso();
  const items = [...(query.data ?? [])].sort((a, b) => b.off_date.localeCompare(a.off_date));

  return (
    <Panel title="Các lần nghỉ" subtitle="Mới nhất trước" bodyless>
      {query.error && (
        <div className="st-panel-body">
          <Alert tone="danger">{query.error}</Alert>
        </div>
      )}
      {query.loading && items.length === 0 ? (
        <table className="st-table">
          <tbody>
            <TableSkeleton columns={3} rows={3} />
          </tbody>
        </table>
      ) : items.length === 0 && !query.error ? (
        <EmptyState title="Chưa có ngày nghỉ" text={emptyText} />
      ) : (
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Ngày nghỉ</th>
                <th>Khung giờ</th>
                <th>Lý do</th>
                <th>Lịch hẹn bị ảnh hưởng</th>
                <th>Ghi nhận lúc</th>
                {onWithdraw && <th />}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.doctor_time_off_id}>
                  <td className="st-strong st-nowrap">{formatDate(item.off_date)}</td>
                  <td className="st-nowrap">
                    {item.start_time && item.end_time
                      ? [timeOffPeriodLabel(item.start_time, item.end_time), `${formatTime(item.start_time)} – ${formatTime(item.end_time)}`]
                          .filter(Boolean)
                          .join(' · ')
                      : 'Cả ngày'}
                  </td>
                  <td>{item.reason ?? '—'}</td>
                  <td>
                    {item.affected_appointments.length === 0 ? (
                      <span className="st-muted">Không có</span>
                    ) : (
                      item.affected_appointments.map((appointment) => (
                        <div key={appointment.appointment_id} className="st-nowrap" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: 2 }}>
                          {appointmentLinkBase ? (
                            <Link to={`${appointmentLinkBase}/${appointment.appointment_id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                              {formatTime(appointment.appointment_time)} · {appointment.patient_full_name}
                            </Link>
                          ) : (
                            <span>
                              {formatTime(appointment.appointment_time)} · {appointment.patient_full_name}
                            </span>
                          )}
                          <StatusBadge value={labelOf(APPOINTMENT_STATUS, appointment.status)} />
                        </div>
                      ))
                    )}
                  </td>
                  <td className="st-nowrap st-muted">{formatDateTime(item.created_at)}</td>
                  {onWithdraw && (
                    <td className="st-num">
                      {item.off_date > today && (
                        <Button size="sm" variant="ghost" onClick={() => onWithdraw(item)}>
                          Rút lại
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
};

/** Kết quả vừa báo nghỉ: bao nhiêu lịch hệ thống đã tự dời, bao nhiêu còn chờ quầy. */
export const TimeOffOutcome = ({ result, pendingText }: { result: TimeOff | null; pendingText: string }) => {
  if (!result) {
    return null;
  }
  const moved = result.rescheduled_appointments ?? [];
  const toOtherDoctor = moved.filter((appointment) => appointment.doctor_id !== result.doctor_id).length;
  const left = result.affected_appointments.length;
  if (moved.length === 0 && left === 0) {
    return null;
  }
  return (
    <Alert tone={left > 0 ? 'warning' : 'success'} className="st-alert-gap">
      {moved.length > 0 &&
        `Đã tự dời ${toOtherDoctor} lịch sang bác sĩ khác và ${moved.length - toOtherDoctor} lịch sang ca khác. Bệnh nhân đã được báo kèm lời xin lỗi và giảm giá đền bù. `}
      {left > 0 && `Còn ${left} lịch chưa tìm được chỗ trống. ${pendingText}`}
    </Alert>
  );
};
