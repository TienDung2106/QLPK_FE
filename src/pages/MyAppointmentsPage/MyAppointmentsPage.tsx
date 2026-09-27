import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer/Footer';
import {
  apiCancelAppointment,
  apiGetMyAppointments,
} from '../../api/functions/appointments';
import type { AppointmentListItem } from '../../api/types';
import { APPOINTMENT_STATUS, APPOINTMENT_STATUS_LABEL } from '../../api/types';
import { AppointmentDetail } from './AppointmentDetail';
import './MyAppointmentsPage.css';

/** Trạng thái mà bệnh nhân còn huỷ được. Sau khi đã vào khám thì không còn là việc của họ. */
const CANCELLABLE = new Set<string>([
  APPOINTMENT_STATUS.Pending,
  APPOINTMENT_STATUS.PendingApproval,
  APPOINTMENT_STATUS.Confirmed,
]);

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: APPOINTMENT_STATUS.Pending, label: 'Chờ xác nhận' },
  { value: APPOINTMENT_STATUS.Confirmed, label: 'Đã xác nhận' },
  { value: APPOINTMENT_STATUS.Completed, label: 'Đã hoàn thành' },
  { value: APPOINTMENT_STATUS.Cancelled, label: 'Đã huỷ' },
];

/** Lịch đã khép lại, hiện mờ để lịch sắp tới nổi lên. */
const DONE = new Set<string>([
  APPOINTMENT_STATUS.Completed,
  APPOINTMENT_STATUS.Cancelled,
  APPOINTMENT_STATUS.NoShow,
]);

const THIS_YEAR = String(new Date().getFullYear());

/** Backend trả TimeOnly dạng 'HH:mm:ss'; chỉ cần giờ và phút. */
function formatTime(time: string): string {
  return time.slice(0, 5);
}

/** Đã tới giờ hẹn. Từ lúc này bệnh nhân không tự huỷ được nữa. */
function hasStarted(appointment: AppointmentListItem): boolean {
  return new Date(`${appointment.appointment_date}T${appointment.appointment_time}`) <= new Date();
}

/**
 * Đã hết giờ nhận phòng (số phút được đến muộn, không quá hết ca 1). Hệ thống sẽ tự dời hoặc huỷ
 * lịch trong vài phút; nhãn chỉ để bệnh nhân thấy trong lúc chờ.
 */
function isOverdue(appointment: AppointmentListItem): boolean {
  const deadline = appointment.check_in_deadline ?? appointment.appointment_time;
  return new Date(`${appointment.appointment_date}T${deadline}`) < new Date();
}

export const MyAppointmentsPage = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  // Lịch hẹn đang được hỏi lý do huỷ, và lý do đang gõ dở.
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Tăng lên để buộc nạp lại sau khi huỷ hoặc dời lịch. Một con số thay vì gọi thẳng
  // hàm nạp, để mọi thao tác với state đều nằm trong effect bên dưới.
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await apiGetMyAppointments({
        status: status || undefined,
        page_size: 50,
      });

      if (cancelled) {
        return;
      }

      if (!result.ok || !result.data) {
        setError(result.error);
        setAppointments([]);
      } else {
        setAppointments(result.data.items);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [status, reloadToken]);

  const openCancel = (appointmentId: number) => {
    setCancelTargetId(appointmentId);
    setCancelReason('');
    setError(null);
    setNotice(null);
  };

  const handleCancel = async (appointmentId: number, reason: string) => {
    if (reason.length < 3) {
      setError('Lý do huỷ phải có ít nhất 3 ký tự.');
      return;
    }

    setBusyId(appointmentId);
    setError(null);
    setNotice(null);

    const result = await apiCancelAppointment(appointmentId, reason);

    setBusyId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setCancelTargetId(null);
    setCancelReason('');
    setNotice('Đã huỷ lịch hẹn.');
    reload();
  };

  return (
    <div className="account-page">
      <Header />

      <main className="container account-main">
        <div className="account-heading">
          <div>
            <h1 className="account-title">Lịch hẹn của tôi</h1>
            {/* Nhận phòng chỉ làm tại quầy: bệnh nhân đưa mã, lễ tân nhập và in số thứ tự. */}
            <p className="account-subtitle">
              Khi tới khám, đưa <strong>mã nhận phòng</strong> (trong Chi tiết) cho lễ tân để lấy số thứ tự.
            </p>
          </div>

          <button type="button" className="btn btn-primary" onClick={() => navigate('/booking')}>
            <CalendarPlus size={18} />
            <span>Đặt lịch mới</span>
          </button>
        </div>

        {error && (
          <div className="account-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="account-alert success" role="status">
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

        <div className="appointment-filters" role="tablist" aria-label="Lọc theo trạng thái">
          {FILTERS.map((filter) => (
            <button
              key={filter.value || 'all'}
              type="button"
              role="tab"
              aria-selected={status === filter.value}
              className={`appointment-filter ${status === filter.value ? 'active' : ''}`}
              onClick={() => {
                setStatus(filter.value);
                setLoading(true);
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="full-page-loader">
            <Loader2 className="full-page-loader-icon" size={32} />
            <span>Đang tải lịch hẹn...</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="appointment-empty">
            <CalendarDays size={40} />
            <h3>Chưa có lịch hẹn nào</h3>
            <p>Đặt lịch khám để bắt đầu theo dõi tại đây.</p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/booking')}>
              <CalendarPlus size={18} />
              <span>Đặt lịch ngay</span>
            </button>
          </div>
        ) : (
          <ul className="appointment-list">
            {appointments.map((appointment) => {
              const [year, month, day] = appointment.appointment_date.split('-');
              const isOpen = openId === appointment.appointment_id;
              const canCancel = CANCELLABLE.has(appointment.status) && !hasStarted(appointment);
              return (
                <li key={appointment.appointment_id} className={`appointment-card ${DONE.has(appointment.status) ? 'is-done' : ''}`}>
                  <div className="appointment-date" aria-label={`Ngày ${day}/${month}/${year}`}>
                    <strong>{Number(day)}</strong>
                    <span>TH {Number(month)}</span>
                    {year !== THIS_YEAR && <span>{year}</span>}
                  </div>

                  <div className="appointment-body">
                    <div className="appointment-title">
                      <h3 className="appointment-doctor">{appointment.doctor_full_name}</h3>
                      <span className={`appointment-status status-${appointment.status}`}>
                        {APPOINTMENT_STATUS_LABEL[appointment.status] ?? appointment.status}
                      </span>
                      {CANCELLABLE.has(appointment.status) && isOverdue(appointment) && (
                        <span className="appointment-status status-overdue">Đã quá hạn</span>
                      )}
                    </div>
                    <p className="appointment-meta">
                      <Clock size={14} />
                      {formatTime(appointment.appointment_time)} · {appointment.duration_minutes} phút · {appointment.patient_full_name}
                      {appointment.queue_number !== null && <> · STT <strong>{appointment.queue_number}</strong></>}
                    </p>
                  </div>

                  <div className="appointment-actions">
                    <button
                      type="button"
                      className="appointment-action"
                      aria-expanded={isOpen}
                      onClick={() => setOpenId(isOpen ? null : appointment.appointment_id)}
                    >
                      <span>{isOpen ? 'Thu gọn' : 'Chi tiết'}</span>
                      {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                    {canCancel && cancelTargetId !== appointment.appointment_id && (
                      <button
                        type="button"
                        className="appointment-action danger"
                        onClick={() => openCancel(appointment.appointment_id)}
                      >
                        <X size={15} />
                        <span>Huỷ</span>
                      </button>
                    )}
                  </div>

                  {canCancel && cancelTargetId === appointment.appointment_id && (
                    <div className="appointment-cancel-form">
                      <label className="form-label" htmlFor={`cancel-reason-${appointment.appointment_id}`}>
                        Lý do huỷ lịch hẹn
                      </label>
                      <input
                        id={`cancel-reason-${appointment.appointment_id}`}
                        className="form-input"
                        type="text"
                        placeholder="Ví dụ: Bận đột xuất"
                        value={cancelReason}
                        onChange={(event) => setCancelReason(event.target.value)}
                        disabled={busyId === appointment.appointment_id}
                      />
                      <div className="appointment-cancel-actions">
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setCancelTargetId(null)}
                          disabled={busyId === appointment.appointment_id}
                        >
                          Giữ lịch
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleCancel(appointment.appointment_id, cancelReason.trim())}
                          disabled={busyId === appointment.appointment_id}
                        >
                          {busyId === appointment.appointment_id ? (
                            <Loader2 className="spin" size={16} />
                          ) : (
                            <X size={16} />
                          )}
                          <span>Xác nhận huỷ</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isOpen && (
                    <AppointmentDetail
                      appointmentId={appointment.appointment_id}
                      onChanged={(message) => {
                        setOpenId(null);
                        setNotice(message);
                        reload();
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
};
