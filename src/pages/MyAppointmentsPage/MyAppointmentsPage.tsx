import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Loader2,
  QrCode,
  Stethoscope,
  X,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer/Footer';
import {
  apiCancelAppointment,
  apiCheckIn,
  apiGetMyAppointments,
} from '../../api/functions/appointments';
import type { AppointmentListItem, CheckInResult } from '../../api/types';
import { APPOINTMENT_STATUS, APPOINTMENT_STATUS_LABEL } from '../../api/types';
import './MyAppointmentsPage.css';

/** Trạng thái mà bệnh nhân còn huỷ được. Sau khi đã vào khám thì không còn là việc của họ. */
const CANCELLABLE = new Set<string>([
  APPOINTMENT_STATUS.Pending,
  APPOINTMENT_STATUS.PendingApproval,
  APPOINTMENT_STATUS.Confirmed,
]);

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: APPOINTMENT_STATUS.Confirmed, label: 'Đã xác nhận' },
  { value: APPOINTMENT_STATUS.Completed, label: 'Đã hoàn thành' },
  { value: APPOINTMENT_STATUS.Cancelled, label: 'Đã huỷ' },
];

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/** Backend trả TimeOnly dạng 'HH:mm:ss'; chỉ cần giờ và phút. */
function formatTime(time: string): string {
  return time.slice(0, 5);
}

export const MyAppointmentsPage = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Lịch hẹn đang được hỏi lý do huỷ, và lý do đang gõ dở.
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [checkInCode, setCheckInCode] = useState('');
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  // Tăng lên để buộc nạp lại sau khi huỷ hoặc nhận phòng. Một con số thay vì gọi thẳng
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

  const handleCancel = async (appointmentId: number) => {
    if (cancelReason.trim().length < 3) {
      setError('Lý do huỷ phải có ít nhất 3 ký tự.');
      return;
    }

    setBusyId(appointmentId);
    setError(null);
    setNotice(null);

    const result = await apiCancelAppointment(appointmentId, cancelReason.trim());

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

  const handleCheckIn = async () => {
    setError(null);
    setNotice(null);
    setCheckInResult(null);

    if (!checkInCode.trim()) {
      setError('Vui lòng nhập mã nhận phòng.');
      return;
    }

    setCheckingIn(true);
    const result = await apiCheckIn(checkInCode.trim());
    setCheckingIn(false);

    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }

    setCheckInResult(result.data);
    setCheckInCode('');
    reload();
  };

  return (
    <div className="account-page">
      <Header />

      <main className="container account-main">
        <div className="account-heading">
          <div>
            <h1 className="account-title">Lịch hẹn của tôi</h1>
            <p className="account-subtitle">
              Xem, huỷ và tự nhận phòng cho các lịch khám bạn đã đặt.
            </p>
          </div>

          <button type="button" className="btn btn-primary" onClick={() => navigate('/booking')}>
            <CalendarPlus size={18} />
            <span>Đặt lịch mới</span>
          </button>
        </div>

        {/* Tự nhận phòng: bệnh nhân nhập mã trên lịch hẹn và nhận số thứ tự, không cần
            qua quầy lễ tân (FR-BOOK-14). */}
        <section className="checkin-card">
          <div className="checkin-card-head">
            <QrCode size={18} />
            <h2>Tự nhận phòng khi tới khám</h2>
          </div>

          <div className="checkin-card-body">
            <input
              className="form-input"
              type="text"
              placeholder="Nhập mã nhận phòng trên lịch hẹn"
              value={checkInCode}
              onChange={(event) => setCheckInCode(event.target.value.toUpperCase())}
              disabled={checkingIn}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCheckIn}
              disabled={checkingIn}
            >
              {checkingIn ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
              <span>Nhận phòng</span>
            </button>
          </div>

          {checkInResult && (
            <div className="checkin-result">
              <strong>Số thứ tự của bạn: {checkInResult.queue_number}</strong>
              <span>
                {checkInResult.doctor_full_name} · {checkInResult.specialty_name} ·{' '}
                {formatTime(checkInResult.appointment_time)}
              </span>
            </div>
          )}
        </section>

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
            {appointments.map((appointment) => (
              <li key={appointment.appointment_id} className="appointment-card">
                <div className="appointment-card-main">
                  <span className={`appointment-status status-${appointment.status}`}>
                    {APPOINTMENT_STATUS_LABEL[appointment.status] ?? appointment.status}
                  </span>

                  <h3 className="appointment-doctor">
                    <Stethoscope size={16} />
                    {appointment.doctor_full_name}
                  </h3>

                  <p className="appointment-meta">
                    <CalendarDays size={15} />
                    {formatDate(appointment.appointment_date)}
                    <span className="appointment-meta-divider" />
                    <Clock size={15} />
                    {formatTime(appointment.appointment_time)} · {appointment.duration_minutes} phút
                  </p>

                  <p className="appointment-patient">
                    Bệnh nhân: <strong>{appointment.patient_full_name}</strong>
                    {appointment.queue_number !== null && (
                      <> · Số thứ tự: <strong>{appointment.queue_number}</strong></>
                    )}
                  </p>
                </div>

                {CANCELLABLE.has(appointment.status) &&
                  (cancelTargetId === appointment.appointment_id ? (
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
                          onClick={() => handleCancel(appointment.appointment_id)}
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
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline appointment-cancel"
                      onClick={() => openCancel(appointment.appointment_id)}
                    >
                      <X size={16} />
                      <span>Huỷ lịch</span>
                    </button>
                  ))}
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
};
