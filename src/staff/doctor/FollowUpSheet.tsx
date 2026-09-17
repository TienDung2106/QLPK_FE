import { useMemo, useState } from 'react';
import { apiBookFollowUp, apiGetOwnWorkingHours } from '../../api/functions/doctorWork';
import { apiGetServices } from '../../api/functions/services';
import type { Appointment } from '../../api/types';
import useAuth from '../../hooks/useAuth';
import { PERMISSION } from '../permissions';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, formatMoney, formatTime, nullIfBlank, toApiTime, todayIso } from '../format';
import { CONSULTATION_MODE_LABEL, DAY_OF_WEEK_LABEL, isoDayOfWeek } from '../labels';
import { Alert, Button, Field, Sheet } from '../components/ui';

interface Props {
  open: boolean;
  appointmentId: number;
  patientName: string;
  suggestedDate: string;
  onClose: () => void;
  onBooked: (appointment: Appointment) => void;
}

/**
 * Hẹn lượt tái khám cho bệnh nhân vừa khám xong, với chính bác sĩ này.
 *
 * Bác sĩ không có API slot trống (API đó thuộc quầy và bệnh nhân), nên giờ gợi ý được dựng
 * từ giờ làm việc của chính bác sĩ cho thứ của ngày đã chọn. Máy chủ vẫn là nơi quyết định:
 * giờ đã có người hoặc rơi vào ngày nghỉ sẽ bị từ chối kèm lý do.
 */
export const FollowUpSheet = (props: Props) => (props.open ? <FollowUpSheetBody {...props} /> : null);

const FollowUpSheetBody = ({ appointmentId, patientName, suggestedDate, onClose, onBooked }: Props) => {
  const { hasPermission } = useAuth();
  const { run, isPending } = useAction();
  const [date, setDate] = useState(suggestedDate && suggestedDate > todayIso() ? suggestedDate : todayIso(7));
  const [time, setTime] = useState('');
  const [mode, setMode] = useState('in_clinic');
  const [reason, setReason] = useState('Tái khám');
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [session, setSession] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canReadHours = hasPermission(PERMISSION.DoctorSchedulesManageOwn);
  const hours = useApiQuery(() => apiGetOwnWorkingHours(), [], { enabled: canReadHours });
  const services = useApiQuery(() => apiGetServices({ page_size: 100 }), []);

  const weekday = date ? isoDayOfWeek(date) : null;
  // Lịch hẹn ghi vào ca, nên gợi ý là giờ bắt đầu các ca của bác sĩ trong thứ đó.
  const suggestions = useMemo(
    () =>
      (hours.data ?? [])
        .filter((row) => row.is_active && row.day_of_week === weekday)
        .map((row) => ({ start: formatTime(row.start_time), end: formatTime(row.end_time) }))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [hours.data, weekday],
  );

  const submit = async () => {
    if (!date || !time) {
      setError('Chọn ngày và ca tái khám.');
      return;
    }
    setError(null);
    const result = await run('book', () =>
      apiBookFollowUp(appointmentId, {
        appointment_date: date,
        appointment_time: toApiTime(time),
        consultation_mode: mode,
        reason_for_visit: nullIfBlank(reason),
        services: serviceIds.map((service_id) => ({ service_id, quantity: 1 })),
        primary_service_id: serviceIds[0] ?? null,
        session_number: session ? Number(session) : null,
      }),
    );
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    onBooked(result.data);
  };

  return (
    <Sheet
      open
      title="Hẹn tái khám"
      subtitle={`${patientName} · lịch được xác nhận ngay, không cần quầy duyệt`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button variant="primary" loading={isPending('book')} onClick={submit}>
            Đặt lịch tái khám
          </Button>
        </>
      }
    >
      {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}
      <div className="st-form-grid">
        <Field label="Ngày" required hint={weekday ? DAY_OF_WEEK_LABEL[weekday] : undefined}>
          {(id) => (
            <input
              id={id}
              type="date"
              className="st-input"
              min={todayIso()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime('');
              }}
            />
          )}
        </Field>
        <Field label="Giờ bắt đầu ca" required>
          {(id) => <input id={id} type="time" className="st-input" value={time} onChange={(e) => setTime(e.target.value)} />}
        </Field>

        <div className="st-span-2">
          {canReadHours && hours.data && suggestions.length === 0 && (
            <div className="st-hint">
              Bạn không có ca làm việc vào {weekday ? DAY_OF_WEEK_LABEL[weekday].toLowerCase() : 'ngày này'}
              {date ? ` (${formatDate(date)})` : ''}. Chọn ngày khác.
            </div>
          )}
          {suggestions.length > 0 && (
            <div className="st-chip-row" role="radiogroup" aria-label="Ca làm việc">
              {suggestions.map((shift) => (
                <button
                  key={shift.start}
                  type="button"
                  role="radio"
                  aria-checked={time === shift.start}
                  className={`st-slot ${time === shift.start ? 'active' : ''}`}
                  onClick={() => setTime(shift.start)}
                >
                  {shift.start}–{shift.end}
                </button>
              ))}
            </div>
          )}
        </div>

        <Field label="Hình thức">
          {(id) => (
            <select id={id} className="st-select" value={mode} onChange={(e) => setMode(e.target.value)}>
              {Object.entries(CONSULTATION_MODE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Buổi thứ (liệu trình)" hint="Chỉ điền nếu lượt khám thuộc một liệu trình.">
          {(id) => <input id={id} type="number" min={1} className="st-input" value={session} onChange={(e) => setSession(e.target.value)} />}
        </Field>
        <Field label="Lý do tái khám" className="st-span-2">
          {(id) => <textarea id={id} className="st-textarea" maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />}
        </Field>

        <fieldset className="st-span-2" style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="st-label">Dịch vụ dự kiến</legend>
          {services.loading && !services.data && <div className="st-hint">Đang tải dịch vụ…</div>}
          {services.error && <Alert tone="danger">{services.error}</Alert>}
          <div className="st-stack" style={{ gap: '0.3rem' }}>
            {(services.data?.items ?? []).map((service) => (
              <label key={service.service_id} className="st-check">
                <input
                  type="checkbox"
                  checked={serviceIds.includes(service.service_id)}
                  onChange={(e) =>
                    setServiceIds((current) =>
                      e.target.checked ? [...current, service.service_id] : current.filter((id) => id !== service.service_id),
                    )
                  }
                />
                {service.service_name} <span className="st-muted">· {formatMoney(service.price)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </Sheet>
  );
};
