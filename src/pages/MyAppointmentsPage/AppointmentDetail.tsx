import { useEffect, useState } from 'react';
import { AlertCircle, CalendarClock, CheckCircle2, Loader2 } from 'lucide-react';
import { apiAcceptReschedule, apiChooseRescheduleSlot, apiGetAppointment } from '../../api/functions/appointments';
import { apiGetDoctorSlots } from '../../api/functions/doctors';
import type { Appointment, AvailableSlot } from '../../api/types';
import { formatDate, formatDateTime, formatMoney, formatTime, todayIso } from '../../staff/format';

interface Props {
  appointmentId: number;
  /** Gọi sau khi đồng ý hoặc chọn giờ khác, để danh sách nạp lại. */
  onChanged: (message: string) => void;
}

/**
 * Chi tiết một lịch hẹn, mở ngay trên thẻ: mã nhận phòng, dịch vụ, chi phí — và khi phòng khám
 * đã dời lịch, chỗ để bệnh nhân tự đồng ý giờ mới hoặc chọn một giờ trống khác.
 */
export const AppointmentDetail = ({ appointmentId, onChanged }: Props) => {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [choosing, setChoosing] = useState(false);
  // bệnh nhân chỉ chọn được từ ngày mai, khám trong ngày đăng ký tại quầy
  const [date, setDate] = useState(todayIso(1));
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetAppointment(appointmentId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok && result.data) {
        setAppointment(result.data);
        setDate(result.data.appointment_date > todayIso() ? result.data.appointment_date : todayIso(1));
      } else {
        setError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  useEffect(() => {
    if (!choosing || !appointment || !date) {
      return;
    }
    let cancelled = false;
    apiGetDoctorSlots(appointment.doctor_id, date, appointment.duration_minutes).then((result) => {
      if (!cancelled) {
        setSlots(result.ok && result.data && !result.data.is_clinic_holiday ? result.data.slots : []);
        if (!result.ok) {
          setError(result.error);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [choosing, appointment, date]);

  const accept = async () => {
    setBusy(true);
    setError(null);
    const result = await apiAcceptReschedule(appointmentId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChanged('Bạn đã đồng ý giờ khám mới.');
  };

  const choose = async () => {
    if (!time) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await apiChooseRescheduleSlot(appointmentId, date, time);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChanged(`Đã đổi lịch sang ${formatDate(date)} lúc ${formatTime(time)}.`);
  };

  if (!appointment) {
    return (
      <div className="appointment-detail">
        {error ? (
          <div className="account-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : (
          <Loader2 className="spin" size={18} />
        )}
      </div>
    );
  }

  return (
    <div className="appointment-detail">
      {error && (
        <div className="account-alert error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {appointment.awaiting_reschedule_response && (
        <div className="reschedule-box">
          <div className="reschedule-box-head">
            <CalendarClock size={18} />
            <strong>Phòng khám đã dời lịch này sang {formatDate(appointment.appointment_date)} lúc {formatTime(appointment.appointment_time)}</strong>
          </div>
          <p>
            {appointment.postponed_at ? `Thông báo lúc ${formatDateTime(appointment.postponed_at)}. ` : ''}
            Đồng ý giờ mới hoặc chọn một giờ trống khác với cùng bác sĩ.
          </p>
          {!choosing ? (
            <div className="appointment-cancel-actions">
              <button type="button" className="btn btn-primary" disabled={busy} onClick={accept}>
                {busy ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}
                <span>Đồng ý giờ mới</span>
              </button>
              <button type="button" className="btn btn-outline" disabled={busy} onClick={() => setChoosing(true)}>
                <span>Chọn giờ khác</span>
              </button>
            </div>
          ) : (
            <div className="reschedule-choose">
              <label className="form-label" htmlFor={`reschedule-date-${appointmentId}`}>
                Ngày khám
              </label>
              <input
                id={`reschedule-date-${appointmentId}`}
                className="form-input"
                type="date"
                min={todayIso(1)}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setTime(null);
                  setSlots(null);
                }}
              />
              {slots === null ? (
                <Loader2 className="spin" size={16} />
              ) : slots.length === 0 ? (
                <p className="reschedule-hint">Bác sĩ không làm việc ngày này. Chọn ngày khác.</p>
              ) : (
                <div className="reschedule-slots">
                  {slots.map((slot) => (
                    <button
                      key={slot.start_time}
                      type="button"
                      className={`time-slot-btn ${time === slot.start_time ? 'is-selected' : ''} ${slot.is_available ? '' : 'is-disabled'}`}
                      disabled={!slot.is_available}
                      title={slot.is_available ? `Còn ${slot.remaining_minutes} phút` : 'Ca không còn đủ thời gian'}
                      onClick={() => setTime(slot.start_time)}
                    >
                      {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                    </button>
                  ))}
                </div>
              )}
              <div className="appointment-cancel-actions">
                <button type="button" className="btn btn-outline" disabled={busy} onClick={() => setChoosing(false)}>
                  Quay lại
                </button>
                <button type="button" className="btn btn-primary" disabled={busy || !time} onClick={choose}>
                  {busy && <Loader2 className="spin" size={16} />}
                  <span>Chốt giờ này</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <dl className="appointment-detail-list">
        {appointment.check_in_code && (
          <>
            <dt>Mã nhận phòng</dt>
            <dd className="appointment-code">{appointment.check_in_code}</dd>
          </>
        )}
        {appointment.services.length > 0 && (
          <>
            <dt>Dịch vụ</dt>
            <dd>{appointment.services.map((service) => `${service.service_name} ×${service.quantity}`).join(', ')}</dd>
          </>
        )}
        <dt>Chi phí dự kiến</dt>
        <dd>
          {formatMoney(appointment.total_amount)}
          {appointment.discount_percent > 0 ? ` (đã giảm ${appointment.discount_percent}%)` : ''}
        </dd>
        {appointment.cancellation_reason && (
          <>
            <dt>Lý do huỷ / từ chối</dt>
            <dd>{appointment.cancellation_reason}</dd>
          </>
        )}
      </dl>
    </div>
  );
};
