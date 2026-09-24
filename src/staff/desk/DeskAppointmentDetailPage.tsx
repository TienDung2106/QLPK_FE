import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgePercent, CalendarClock, Check, CheckCheck, DoorOpen, UserX, X, XCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import {
  apiAcceptReschedule,
  apiApplyDiscount,
  apiApproveDiscount,
  apiChooseRescheduleSlot,
  apiGetStaffAppointment,
  apiMarkNoShow,
  apiSearchStaffPromotions,
  apiStaffConfirmAppointment,
  apiStaffDeclineAppointment,
  apiPostponeAppointment,
  apiStaffCancelAppointment,
  apiStaffCheckIn,
} from '../../api/functions/desk';
import type { ApiResult } from '../../api/helpers';
import type { StaffAppointment } from '../../api/staffTypes';
import { PERMISSION } from '../permissions';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, formatDateTime, formatMoney, formatNumber, formatPercent, formatTime, todayIso } from '../format';
import { APPOINTMENT_STATUS, BOOKING_SOURCE_LABEL, CONSULTATION_MODE_LABEL, labelOf, textOf } from '../labels';
import { useToast } from '../components/toastContext';
import { SlotPicker } from '../components/pickers';
import { DoctorMonthCalendar } from '../components/DoctorMonthCalendar';
import { Alert, Button, ConfirmDialog, Field, PageHeader, Panel, Sheet, StatusBadge } from '../components/ui';

type SheetKind = 'discount' | 'postpone' | 'choose-slot' | null;
type ConfirmKind = 'cancel' | 'no-show' | 'accept' | 'confirm' | 'decline' | null;

const POSTPONABLE = ['pending', 'pending_approval', 'confirmed', 'checked_in'];
const CANCELLABLE = ['pending', 'pending_approval', 'confirmed', 'checked_in'];

const DeskAppointmentDetailPage = () => {
  const appointmentId = Number(useParams().appointmentId);
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const { run, isPending, pending } = useAction();
  const query = useApiQuery(() => apiGetStaffAppointment(appointmentId), [appointmentId]);
  const appointment = query.data;

  const [sheet, setSheet] = useState<SheetKind>(null);
  // Mã khuyến mãi dùng được hôm nay, chỉ tải khi mở form giảm giá.
  const promotions = useApiQuery(() => apiSearchStaffPromotions({ page_size: 50 }), [], {
    enabled: sheet === 'discount' && hasPermission(PERMISSION.DiscountApplyWithinThreshold),
  });
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [discount, setDiscount] = useState({ mode: 'code', promotion_code: '', discount_percent: '', notes: '' });
  const [slotDate, setSlotDate] = useState(todayIso());
  const [slotTime, setSlotTime] = useState<string | null>(null);
  const [postponeReason, setPostponeReason] = useState('');

  const openSheet = (kind: SheetKind) => {
    setError(null);
    setSlotTime(null);
    setSlotDate(appointment?.appointment_date && appointment.appointment_date >= todayIso() ? appointment.appointment_date : todayIso());
    setSheet(kind);
  };

  /** Chạy thao tác trả về lịch hẹn mới, cập nhật trang hoặc báo lỗi vào đúng chỗ. */
  const act = async (key: string, action: () => Promise<ApiResult<StaffAppointment>>, message: string, inSheet = false) => {
    const result = await run(key, action);
    if (result.ok && result.data) {
      // Dời lịch tạo ra một lịch hẹn mới: đi theo nó.
      if (result.data.appointment_id !== appointmentId) {
        navigate(`/thu-ngan/lich-hen/${result.data.appointment_id}`, { replace: true });
      } else {
        query.setData(result.data);
      }
      setSheet(null);
      setConfirm(null);
      toast.success(message);
      return;
    }
    if (inSheet) {
      setError(result.error);
    } else {
      setConfirm(null);
      toast.error(result.error);
    }
  };

  if (!appointment) {
    return (
      <>
        <PageHeader title={query.loading ? 'Đang tải lịch hẹn…' : `Lịch hẹn #${appointmentId}`} backTo="/thu-ngan" backLabel="Lịch hẹn" />
        {query.error && <Alert tone="danger">{query.error}</Alert>}
      </>
    );
  }

  const status = appointment.status;
  const canDiscount = hasPermission(PERMISSION.DiscountApplyWithinThreshold) || hasPermission(PERMISSION.DiscountApproveOverThreshold);
  // backend chỉ cho giảm giá lịch có từ 2 dịch vụ khác nhau trở lên (DiscountService.MinComboServices)
  const isBelowCombo = new Set(appointment.services.map((service) => service.service_id)).size < 2;
  const canApprove = hasPermission(PERMISSION.DiscountApproveOverThreshold);

  const checkIn = async () => {
    if (!appointment.check_in_code) {
      return;
    }
    const result = await run('checkin', () => apiStaffCheckIn(appointment.check_in_code!));
    if (result.ok && result.data) {
      toast.success(`Đã nhận phòng — số thứ tự ${result.data.queue_number}.`);
      query.reload();
    } else {
      toast.error(result.error);
    }
  };

  const applyDiscount = async () => {
    const payload =
      discount.mode === 'code'
        ? { promotion_code: discount.promotion_code.trim(), notes: discount.notes.trim() || undefined }
        : { discount_percent: Number(discount.discount_percent), notes: discount.notes.trim() || undefined };
    if (discount.mode === 'code' ? !payload.promotion_code : !(Number(discount.discount_percent) > 0 && Number(discount.discount_percent) <= 100)) {
      setError(discount.mode === 'code' ? 'Nhập mã khuyến mãi.' : 'Nhập phần trăm giảm từ 0 đến 100.');
      return;
    }
    const result = await run('discount', () => apiApplyDiscount(appointmentId, payload));
    if (result.ok && result.data) {
      setSheet(null);
      toast.success(
        result.data.approval_required
          ? `Đã ghi giảm ${formatPercent(result.data.discount_percent)} — vượt ngưỡng, cần người có quyền duyệt.`
          : `Đã áp giảm ${formatPercent(result.data.discount_percent)}.`,
      );
      query.reload();
    } else {
      setError(result.error);
    }
  };

  const approve = async () => {
    const result = await run('approve', () => apiApproveDiscount(appointmentId));
    if (result.ok) {
      toast.success('Đã duyệt mức giảm giá.');
      query.reload();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <PageHeader
        backTo="/thu-ngan"
        backLabel="Lịch hẹn"
        title={
          <>
            {appointment.patient_full_name} <StatusBadge value={labelOf(APPOINTMENT_STATUS, status)} />
          </>
        }
        description={`${formatDate(appointment.appointment_date)} lúc ${formatTime(appointment.appointment_time)} · Bác sĩ: ${appointment.doctor_full_name} · Lịch hẹn #${appointment.appointment_id}`}
        actions={
          <>
            {status === 'pending' && (
              <>
                <Button icon={<X size={16} />} disabled={Boolean(pending)} onClick={() => setConfirm('decline')}>
                  Từ chối
                </Button>
                <Button variant="primary" icon={<Check size={16} />} disabled={Boolean(pending)} onClick={() => setConfirm('confirm')}>
                  Xác nhận lịch
                </Button>
              </>
            )}
            {status === 'confirmed' && appointment.check_in_code && (
              <Button variant="primary" icon={<DoorOpen size={16} />} loading={isPending('checkin')} onClick={checkIn}>
                Nhận phòng
              </Button>
            )}
          </>
        }
      />

      {appointment.awaiting_reschedule_response && (
        <Alert tone="warning" className="st-alert-gap">
          Lịch này được phòng khám dời{appointment.postponed_at ? ` lúc ${formatDateTime(appointment.postponed_at)}` : ''} và đang chờ bệnh nhân trả lời.
          Ghi nhận câu trả lời thay bệnh nhân:{' '}
          <span className="st-actions" style={{ display: 'inline-flex', marginLeft: 6 }}>
            <Button size="sm" variant="primary" icon={<CheckCheck size={14} />} disabled={Boolean(pending)} onClick={() => setConfirm('accept')}>
              Đồng ý giờ mới
            </Button>
            <Button size="sm" icon={<CalendarClock size={14} />} onClick={() => openSheet('choose-slot')}>
              Chọn giờ khác
            </Button>
          </span>
        </Alert>
      )}
      {status === 'pending' && (
        <Alert tone="warning" className="st-alert-gap">
          Bệnh nhân tự đặt lịch này và chưa ai xác nhận. Bệnh nhân chỉ nhận phòng được sau khi lịch được xác nhận.
        </Alert>
      )}
      {status === 'pending_approval' && appointment.discount_approval_required && (
        <Alert tone="warning" className="st-alert-gap">
          Mức giảm {formatPercent(appointment.discount_percent)} vượt ngưỡng cho phép và đang chờ duyệt.{' '}
          {canApprove && (
            <Button size="sm" variant="primary" loading={isPending('approve')} onClick={approve}>
              Duyệt giảm giá
            </Button>
          )}
        </Alert>
      )}

      <div className="st-grid-main">
        <div className="st-stack">
          <Panel title="Dịch vụ & chi phí" bodyless>
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Dịch vụ</th>
                    <th className="st-num">SL</th>
                    <th className="st-num">Đơn giá</th>
                    <th className="st-num">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {appointment.services.length === 0 && (
                    <tr>
                      <td colSpan={4} className="st-muted">
                        Chỉ phí khám, không kèm dịch vụ.
                      </td>
                    </tr>
                  )}
                  {appointment.services.map((service) => (
                    <tr key={service.service_id}>
                      <td className="st-cell-main">{service.service_name}</td>
                      <td className="st-num">{service.quantity}</td>
                      <td className="st-num">{formatMoney(service.unit_price)}</td>
                      <td className="st-num">{formatMoney(service.line_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="st-panel-body" style={{ borderTop: '1px solid var(--st-line)' }}>
              <dl className="st-totals">
                <dt>Tạm tính</dt>
                <dd>{formatMoney(appointment.subtotal_amount)}</dd>
                <dt>Giảm giá</dt>
                <dd>{appointment.discount_percent > 0 ? formatPercent(appointment.discount_percent) : '—'}</dd>
                <dt className="st-total-row">Tổng cộng</dt>
                <dd className="st-total-row">{formatMoney(appointment.total_amount)}</dd>
              </dl>
            </div>
          </Panel>

          <Panel title="Thao tác khác">
            <div className="st-actions">
              {canDiscount && status !== 'cancelled' && status !== 'completed' && status !== 'no_show' && (
                <Button
                  icon={<BadgePercent size={16} />}
                  onClick={() => openSheet('discount')}
                  disabled={isBelowCombo}
                  title={isBelowCombo ? 'Giảm giá chỉ áp dụng khi lịch có từ 2 dịch vụ trở lên' : undefined}
                >
                  Áp giảm giá
                </Button>
              )}
              {POSTPONABLE.includes(status) && (
                <Button icon={<CalendarClock size={16} />} onClick={() => openSheet('postpone')}>
                  Dời lịch
                </Button>
              )}
              {status === 'confirmed' && (
                <Button icon={<UserX size={16} />} disabled={Boolean(pending)} onClick={() => setConfirm('no-show')}>
                  Đánh dấu không đến
                </Button>
              )}
              {CANCELLABLE.includes(status) && (
                <Button variant="danger" icon={<XCircle size={16} />} disabled={Boolean(pending)} onClick={() => setConfirm('cancel')}>
                  Huỷ lịch
                </Button>
              )}
              {!canDiscount && !POSTPONABLE.includes(status) && !CANCELLABLE.includes(status) && (
                <span className="st-muted">Lịch hẹn ở trạng thái này không còn thao tác nào tại quầy.</span>
              )}
            </div>
          </Panel>
        </div>

        <Panel title="Thông tin lịch hẹn">
          <dl className="st-dl">
            <dt>Bệnh nhân</dt>
            <dd>
              <Link to={`/thu-ngan/benh-nhan/${appointment.patient_id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                {appointment.patient_full_name}
              </Link>
            </dd>
            <dt>Bác sĩ</dt>
            <dd>{appointment.doctor_full_name}</dd>
            <dt>Hình thức</dt>
            <dd>{textOf(CONSULTATION_MODE_LABEL, appointment.consultation_mode)}</dd>
            <dt>Nguồn đặt</dt>
            <dd>{textOf(BOOKING_SOURCE_LABEL, appointment.booking_source)}</dd>
            <dt>Mã check-in</dt>
            <dd className="st-mono">{appointment.check_in_code ?? '—'}</dd>
            <dt>Số thứ tự</dt>
            <dd>{appointment.queue_number ?? '—'}</dd>
            <dt>Nhận phòng lúc</dt>
            <dd>{formatDateTime(appointment.checked_in_at)}</dd>
            {appointment.rescheduled_from_appointment_id && (
              <>
                <dt>Dời từ lịch</dt>
                <dd>
                  <Link to={`/thu-ngan/lich-hen/${appointment.rescheduled_from_appointment_id}`} style={{ color: 'var(--primary)' }}>
                    #{appointment.rescheduled_from_appointment_id}
                  </Link>
                </dd>
              </>
            )}
            {appointment.cancellation_reason && (
              <>
                <dt>Lý do huỷ</dt>
                <dd>{appointment.cancellation_reason}</dd>
              </>
            )}
            <dt>Tạo lúc</dt>
            <dd>{formatDateTime(appointment.created_at)}</dd>
          </dl>
        </Panel>
      </div>

      {/* Giảm giá */}
      <Sheet
        open={sheet === 'discount'}
        title="Áp giảm giá"
        subtitle="Dùng mã khuyến mãi hoặc nhập phần trăm — không dùng cả hai."
        onClose={() => setSheet(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSheet(null)}>
              Huỷ
            </Button>
            <Button variant="primary" loading={isPending('discount')} onClick={applyDiscount}>
              Áp dụng
            </Button>
          </>
        }
      >
        {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}
        <div className="st-tabs" style={{ marginBottom: '0.9rem' }}>
          <button type="button" className={`st-tab ${discount.mode === 'code' ? 'active' : ''}`} onClick={() => setDiscount({ ...discount, mode: 'code' })}>
            Mã khuyến mãi
          </button>
          <button type="button" className={`st-tab ${discount.mode === 'percent' ? 'active' : ''}`} onClick={() => setDiscount({ ...discount, mode: 'percent' })}>
            Phần trăm
          </button>
        </div>
        <div className="st-form-grid">
          {discount.mode === 'code' ? (
            <>
              <Field label="Mã khuyến mãi" required className="st-span-2">
                {(id) => (
                  <input id={id} className="st-input st-mono" maxLength={50} value={discount.promotion_code} onChange={(e) => setDiscount({ ...discount, promotion_code: e.target.value.toUpperCase() })} />
                )}
              </Field>
              {(promotions.data?.items.length ?? 0) > 0 && (
                <div className="st-span-2">
                  <div className="st-label" style={{ marginBottom: 6 }}>
                    Mã đang áp dụng được hôm nay
                  </div>
                  <div className="st-stack" style={{ gap: '0.35rem' }}>
                    {promotions.data!.items.map((promotion) => (
                      <button
                        key={promotion.promotion_id}
                        type="button"
                        className={`st-picker-option st-panel ${discount.promotion_code === promotion.promotion_code ? 'active' : ''}`}
                        style={{ margin: 0, borderColor: discount.promotion_code === promotion.promotion_code ? 'var(--primary)' : undefined }}
                        onClick={() => setDiscount({ ...discount, promotion_code: promotion.promotion_code })}
                      >
                        <span>
                          <span className="st-cell-main st-mono">{promotion.promotion_code}</span>
                          <br />
                          <span className="st-cell-sub">
                            {promotion.description ?? '—'}
                            {promotion.min_booking_amount > 0 ? ` · đơn từ ${formatMoney(promotion.min_booking_amount)}` : ''}
                            {promotion.valid_until ? ` · hết hạn ${formatDateTime(promotion.valid_until)}` : ''}
                          </span>
                        </span>
                        <span className="st-strong st-nowrap">
                          {promotion.discount_type === 'percent'
                            ? `−${formatNumber(promotion.discount_value, 2)}%`
                            : `−${formatMoney(promotion.discount_value)}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Field label="Phần trăm giảm" required className="st-span-2" hint="Vượt ngưỡng trong cài đặt thì lịch hẹn chuyển sang chờ duyệt.">
              {(id) => (
                <input id={id} type="number" min={0} max={100} step="0.5" className="st-input" value={discount.discount_percent} onChange={(e) => setDiscount({ ...discount, discount_percent: e.target.value })} />
              )}
            </Field>
          )}
          <Field label="Ghi chú" className="st-span-2">
            {(id) => <input id={id} className="st-input" maxLength={255} value={discount.notes} onChange={(e) => setDiscount({ ...discount, notes: e.target.value })} />}
          </Field>
        </div>
      </Sheet>

      {/* Dời lịch / chọn giờ khác */}
      <Sheet
        open={sheet === 'postpone' || sheet === 'choose-slot'}
        title={sheet === 'postpone' ? 'Dời lịch hẹn' : 'Chọn giờ khác cho bệnh nhân'}
        subtitle={`Cùng bác sĩ ${appointment.doctor_full_name}. Muốn đổi bác sĩ thì huỷ và đặt lịch mới.`}
        onClose={() => setSheet(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSheet(null)}>
              Huỷ
            </Button>
            <Button
              variant="primary"
              loading={isPending('postpone') || isPending('choose')}
              disabled={!slotTime || (sheet === 'postpone' && !postponeReason.trim())}
              onClick={() =>
                sheet === 'postpone'
                  ? act('postpone', () => apiPostponeAppointment(appointmentId, { reason: postponeReason.trim(), new_date: slotDate, new_time: slotTime! }), 'Đã dời lịch hẹn.', true)
                  : act('choose', () => apiChooseRescheduleSlot(appointmentId, { new_date: slotDate, new_time: slotTime! }), 'Đã đổi sang giờ bệnh nhân chọn.', true)
              }
            >
              {sheet === 'postpone' ? 'Dời lịch' : 'Chốt giờ mới'}
            </Button>
          </>
        }
      >
        {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}
        <div className="st-form-grid">
          <div className="st-span-2">
            <div className="st-label" style={{ marginBottom: 6 }}>
              Ngày mới
            </div>
            <DoctorMonthCalendar
              doctorId={appointment.doctor_id}
              value={slotDate}
              onChange={(date) => {
                setSlotDate(date);
                setSlotTime(null);
              }}
            />
          </div>
          <div className="st-span-2">
            <div className="st-label" style={{ marginBottom: 6 }}>
              Ca khám (lượt khám cần {appointment.duration_minutes} phút)
            </div>
            <SlotPicker
              doctorId={appointment.doctor_id}
              date={slotDate}
              value={slotTime}
              onChange={setSlotTime}
              durationMinutes={appointment.duration_minutes}
            />
          </div>
          {sheet === 'postpone' && (
            <Field label="Lý do (gửi cho bệnh nhân)" required className="st-span-2">
              {(id) => <textarea id={id} className="st-textarea" maxLength={255} value={postponeReason} onChange={(e) => setPostponeReason(e.target.value)} />}
            </Field>
          )}
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirm === 'cancel'}
        title="Huỷ lịch hẹn?"
        text="Khung giờ được mở lại cho bệnh nhân khác."
        reasonLabel="Lý do huỷ"
        confirmLabel="Huỷ lịch"
        tone="danger-solid"
        loading={isPending('cancel')}
        onConfirm={(reason) => act('cancel', () => apiStaffCancelAppointment(appointmentId, reason), 'Đã huỷ lịch hẹn.')}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'confirm'}
        title="Xác nhận lịch hẹn?"
        text="Bệnh nhân nhận được mã nhận phòng. Lịch đang chờ duyệt giảm giá phải được duyệt trước."
        confirmLabel="Xác nhận"
        loading={isPending('confirm')}
        onConfirm={() => act('confirm', () => apiStaffConfirmAppointment(appointmentId), 'Đã xác nhận lịch hẹn.')}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'decline'}
        title="Từ chối lịch hẹn?"
        text="Khung giờ được mở lại cho bệnh nhân khác."
        reasonLabel="Lý do (bệnh nhân sẽ thấy)"
        confirmLabel="Từ chối lịch"
        tone="danger-solid"
        loading={isPending('decline')}
        onConfirm={(reason) =>
          reason.length < 3
            ? toast.error('Lý do từ chối cần ít nhất 3 ký tự.')
            : act('decline', () => apiStaffDeclineAppointment(appointmentId, reason), 'Đã từ chối lịch hẹn.')
        }
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'no-show'}
        title="Đánh dấu bệnh nhân không đến?"
        text="Chỉ làm được sau khi đã hết khung giờ nhận phòng. Khung giờ được giải phóng cho người khác."
        confirmLabel="Đánh dấu không đến"
        tone="danger-solid"
        loading={isPending('no-show')}
        onConfirm={() => act('no-show', () => apiMarkNoShow(appointmentId), 'Đã đánh dấu không đến.')}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'accept'}
        title="Bệnh nhân đồng ý giờ mới?"
        text="Lịch hẹn giữ nguyên giờ phòng khám đã dời sang."
        confirmLabel="Xác nhận đồng ý"
        loading={isPending('accept')}
        onConfirm={() => act('accept', () => apiAcceptReschedule(appointmentId), 'Đã ghi nhận bệnh nhân đồng ý.')}
        onClose={() => setConfirm(null)}
      />
    </>
  );
};

export default DeskAppointmentDetailPage;
