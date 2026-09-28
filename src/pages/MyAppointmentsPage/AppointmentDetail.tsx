import { useEffect, useState } from 'react';
import { AlertCircle, CalendarClock, CheckCircle2, Loader2, Pencil } from 'lucide-react';
import {
  apiAcceptReschedule,
  apiChooseRescheduleSlot,
  apiGetAppointment,
  apiUpdateAppointmentServices,
} from '../../api/functions/appointments';
import { apiGetDoctorSlots } from '../../api/functions/doctors';
import { apiGetBookingQuote, apiGetServices } from '../../api/functions/services';
import type { Appointment, AvailableSlot, BookingQuote, ClinicService } from '../../api/types';
import { APPOINTMENT_STATUS } from '../../api/types';
import { formatDate, formatDateTime, formatMoney, formatTime, todayIso } from '../../staff/format';

interface Props {
  appointmentId: number;
  /** Gọi sau khi đồng ý hoặc chọn giờ khác, để danh sách nạp lại. */
  onChanged: (message: string) => void;
}

/** Trạng thái bệnh nhân còn tự sửa dịch vụ được, giống các trạng thái còn tự huỷ được. */
const EDITABLE = new Set<string>([
  APPOINTMENT_STATUS.Pending,
  APPOINTMENT_STATUS.PendingApproval,
  APPOINTMENT_STATUS.Confirmed,
]);

/**
 * Một buổi chỉ có 2 ca liền nhau (2 × 120 phút), như ở bước chọn dịch vụ khi đặt lịch.
 *
 * ponytail: số chép từ Step2Service, chỉ để nhắc sớm; server vẫn tự từ chối nếu không còn ca nào vừa.
 */
const MAX_VISIT_MINUTES = 240;

/**
 * Chi tiết một lịch hẹn, mở ngay trên thẻ: mã nhận phòng, dịch vụ, chi phí — và khi phòng khám
 * đã dời lịch, chỗ để bệnh nhân tự đồng ý giờ mới hoặc chọn một giờ trống khác.
 */
export const AppointmentDetail = ({ appointmentId, onChanged }: Props) => {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGetAppointment(appointmentId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok && result.data) {
        setAppointment(result.data);
      } else {
        setError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

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

  const choose = async (date: string, time: string) => {
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

  // cùng điều kiện với nút huỷ; hạn số giờ trước khám do server kiểm và báo lỗi như khi huỷ.
  // lịch đang chờ trả lời dời lịch thì trả lời trước, không trộn hai việc trên một thẻ
  const canEdit =
    EDITABLE.has(appointment.status) &&
    new Date(`${appointment.appointment_date}T${appointment.appointment_time}`) > new Date() &&
    !appointment.awaiting_reschedule_response;

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
            <SlotPicker
              appointment={appointment}
              durationMinutes={appointment.duration_minutes}
              busy={busy}
              onBack={() => setChoosing(false)}
              onPick={choose}
            />
          )}
        </div>
      )}

      {editing ? (
        <ServiceEditor appointment={appointment} onCancel={() => setEditing(false)} onSaved={onChanged} />
      ) : (
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
              <dd>
                {appointment.services.map((service) => `${service.service_name} ×${service.quantity}`).join(', ')}
                {canEdit && (
                  <button type="button" className="appointment-action service-edit-open" onClick={() => setEditing(true)}>
                    <Pencil size={14} />
                    <span>Sửa dịch vụ</span>
                  </button>
                )}
              </dd>
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
      )}
    </div>
  );
};

interface SlotPickerProps {
  appointment: Appointment;
  durationMinutes: number;
  busy: boolean;
  onBack: () => void;
  onPick: (date: string, time: string) => void;
}

/**
 * Chọn ngày và một ca trống của cùng bác sĩ, đủ dài cho durationMinutes.
 *
 * ponytail: available-slots vẫn tính cả tải của chính lịch này, nên ca của nó có thể hiện là thiếu chỗ.
 * Chấp nhận được vì server kiểm lại có bỏ qua lịch này; cần chính xác thì thêm excludeAppointmentId
 * vào GetSelfServiceSlotsAsync.
 */
const SlotPicker = ({ appointment, durationMinutes, busy, onBack, onPick }: SlotPickerProps) => {
  // bệnh nhân chỉ chọn được từ ngày mai, khám trong ngày đăng ký tại quầy
  const [date, setDate] = useState(appointment.appointment_date > todayIso() ? appointment.appointment_date : todayIso(1));
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) {
      return;
    }
    let cancelled = false;
    apiGetDoctorSlots(appointment.doctor_id, date, durationMinutes).then((result) => {
      if (!cancelled) {
        setSlots(result.ok && result.data && !result.data.is_clinic_holiday ? result.data.slots : []);
        setError(result.ok ? null : result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [appointment.doctor_id, date, durationMinutes]);

  const inputId = `slot-date-${appointment.appointment_id}`;

  return (
    <div className="reschedule-choose">
      <label className="form-label" htmlFor={inputId}>
        Ngày khám
      </label>
      <input
        id={inputId}
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
      {error && <p className="reschedule-hint">{error}</p>}
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
        <button type="button" className="btn btn-outline" disabled={busy} onClick={onBack}>
          Quay lại
        </button>
        <button type="button" className="btn btn-primary" disabled={busy || !time} onClick={() => time && onPick(date, time)}>
          {busy && <Loader2 className="spin" size={16} />}
          <span>Chốt giờ này</span>
        </button>
      </div>
    </div>
  );
};

interface ServiceEditorProps {
  appointment: Appointment;
  onCancel: () => void;
  onSaved: (message: string) => void;
}

/**
 * Thêm bớt dịch vụ trên lịch đã đặt. Lưu thử với giờ cũ trước; thời lượng mới không còn vừa thì
 * server trả slot_taken và bệnh nhân chọn luôn giờ khác của cùng bác sĩ.
 */
const ServiceEditor = ({ appointment, onCancel, onSaved }: ServiceEditorProps) => {
  const [catalog, setCatalog] = useState<ClinicService[] | null>(null);
  // service_id -> số lượng; dịch vụ giữ lại giữ số lượng cũ, dịch vụ mới là 1 như lúc đặt
  const [selected, setSelected] = useState(
    () => new Map(appointment.services.map((line) => [line.service_id, line.quantity])),
  );
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [needSlot, setNeedSlot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetServices().then((result) => {
      if (!cancelled) {
        setCatalog(result.ok && result.data ? result.data.items : []);
        if (!result.ok) {
          setError(result.error);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selected.size === 0) {
      return;
    }
    let cancelled = false;
    const lines = [...selected].map(([service_id, quantity]) => ({ service_id, quantity }));
    apiGetBookingQuote(lines, appointment.patient_id, appointment.appointment_id).then((result) => {
      if (!cancelled && result.ok && result.data) {
        setQuote(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selected, appointment.patient_id, appointment.appointment_id]);

  const toggle = (serviceId: number) => {
    setNeedSlot(false);
    setError(null);
    setQuote(null);
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.set(serviceId, 1);
      }
      return next;
    });
  };

  const save = async (date?: string, time?: string) => {
    setBusy(true);
    setError(null);
    const lines = [...selected].map(([service_id, quantity]) => ({ service_id, quantity }));
    const result = await apiUpdateAppointmentServices(appointment.appointment_id, lines, date, time);
    setBusy(false);
    if (result.ok) {
      onSaved(date && time ? `Đã cập nhật dịch vụ, lịch mới ${formatDate(date)} lúc ${formatTime(time)}.` : 'Đã cập nhật dịch vụ.');
      return;
    }
    if (result.errorCode === 'slot_taken' && !date) {
      setNeedSlot(true);
      setError('Giờ đã đặt không đủ thời gian cho các dịch vụ mới. Chọn một giờ khác bên dưới.');
      return;
    }
    setError(result.error);
  };

  // dịch vụ đã ngừng nhưng vẫn nằm trên lịch thì vẫn hiện để bệnh nhân bỏ được
  const retired = appointment.services.filter(
    (line) => catalog && !catalog.some((service) => service.service_id === line.service_id),
  );
  const overLimit = (quote?.duration_minutes ?? 0) > MAX_VISIT_MINUTES;

  return (
    <div className="service-edit">
      {error && (
        <div className="account-alert error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {catalog === null ? (
        <Loader2 className="spin" size={18} />
      ) : (
        <ul className="service-edit-list">
          {[
            ...retired.map((line) => ({ id: line.service_id, name: line.service_name, price: line.unit_price, minutes: null })),
            ...catalog.map((service) => ({
              id: service.service_id,
              name: service.service_name,
              price: service.price,
              minutes: service.duration_minutes,
            })),
          ].map((item) => (
            <li key={item.id}>
              <label>
                <input type="checkbox" checked={selected.has(item.id)} disabled={busy} onChange={() => toggle(item.id)} />
                <span className="service-edit-name">{item.name}</span>
                <span className="service-edit-meta">
                  {item.minutes !== null && `${item.minutes} phút · `}
                  {formatMoney(item.price)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {selected.size === 0 ? (
        <p className="reschedule-hint">Chọn ít nhất một dịch vụ. Không khám nữa thì huỷ lịch.</p>
      ) : (
        quote && (
          <p className="service-edit-summary">
            {quote.duration_minutes} phút · <strong>{formatMoney(quote.total_amount)}</strong>
            {quote.discount_amount > 0 && ` (giảm ${formatMoney(quote.discount_amount)})`}
          </p>
        )
      )}

      {overLimit && (
        <p className="reschedule-hint">
          Tổng thời gian vượt quá 2 ca ({MAX_VISIT_MINUTES} phút), không còn ca nào nhận được. Vui lòng bỏ bớt dịch vụ.
        </p>
      )}

      {needSlot && quote ? (
        <SlotPicker
          appointment={appointment}
          durationMinutes={quote.duration_minutes}
          busy={busy}
          onBack={() => setNeedSlot(false)}
          onPick={(date, time) => save(date, time)}
        />
      ) : (
        <div className="appointment-cancel-actions">
          <button type="button" className="btn btn-outline" disabled={busy} onClick={onCancel}>
            Huỷ sửa
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || selected.size === 0 || overLimit}
            onClick={() => save()}
          >
            {busy && <Loader2 className="spin" size={16} />}
            <span>Lưu dịch vụ</span>
          </button>
        </div>
      )}
    </div>
  );
};
