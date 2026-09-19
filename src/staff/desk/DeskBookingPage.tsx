import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Footprints, X } from 'lucide-react';
import { apiGetBookingQuote, apiGetServices } from '../../api/functions/services';
import type { BookingQuote } from '../../api/types';
import { apiBookOnBehalf, apiBookWalkIn } from '../../api/functions/desk';
import type { DeskPatient } from '../../api/staffTypes';
import { useAction, useApiQuery } from '../hooks';
import { formatMoney, todayIso } from '../format';
import { CONSULTATION_MODE_LABEL, VISIT_TYPE_LABEL } from '../labels';
import { useToast } from '../components/toastContext';
import { DoctorSelect, PatientPicker, SlotPicker } from '../components/pickers';
import { DoctorMonthCalendar } from '../components/DoctorMonthCalendar';
import { Alert, Button, Field, FilterTabs, PageHeader, Panel } from '../components/ui';
import { VoucherStrip } from '../../pages/BookingPage/components/VoucherStrip';
import { describePromotion } from '../../pages/BookingPage/bookingFormat';

type Mode = 'booking' | 'walk-in';

/**
 * Đặt lịch hộ bệnh nhân (chọn ngày giờ) hoặc nhận khách vãng lai (khám ngay hôm nay và
 * nhận phòng luôn). Hai luồng dùng chung một form; chỉ khác ngày và việc giờ có bắt buộc.
 */
const DeskBookingPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { run, isPending } = useAction();

  const [mode, setMode] = useState<Mode>('walk-in');
  const [patient, setPatient] = useState<DeskPatient | null>(null);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState<string | null>(null);
  // Giống luồng bệnh nhân: chọn nhiều dịch vụ, mỗi dịch vụ một lần; dịch vụ chọn đầu tiên là dịch vụ chính.
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [visitType, setVisitType] = useState('new_visit');
  const [consultationMode, setConsultationMode] = useState('in_clinic');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const services = useApiQuery(() => apiGetServices({ page_size: 100 }), []);
  const serviceList = services.data?.items ?? [];
  const chosen = selectedIds
    .map((id) => serviceList.find((service) => service.service_id === id))
    .filter((service) => service !== undefined);
  const subtotal = chosen.reduce((sum, service) => sum + service.price, 0);
  const effectiveDate = mode === 'walk-in' ? todayIso() : date;

  // Báo giá để quầy thấy trước thời lượng (ca nào còn chứa được) và voucher server sẽ tự áp.
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const quoteKey = chosen.map((service) => service.service_id).join(',');
  const patientId = patient?.patient_id ?? null;

  useEffect(() => {
    let cancelled = false;
    const lines = quoteKey ? quoteKey.split(',').map((id) => ({ service_id: Number(id), quantity: 1 })) : [];

    apiGetBookingQuote(lines, patientId).then((result) => {
      if (!cancelled) {
        setQuote(result.ok ? result.data : null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [quoteKey, patientId]);

  // Dropdown chỉ còn dịch vụ chưa chọn (nên không chọn trùng), gom theo nhóm để dễ tìm.
  const serviceGroups = Object.entries(
    serviceList
      .filter((service) => !selectedIds.includes(service.service_id))
      .reduce<Record<string, typeof serviceList>>((groups, service) => {
        const group = service.service_group ?? 'Khác';
        (groups[group] ??= []).push(service);
        return groups;
      }, {}),
  );

  const submit = async () => {
    if (!patient) {
      setError('Chọn bệnh nhân.');
      return;
    }
    if (!doctorId) {
      setError('Chọn bác sĩ.');
      return;
    }
    if (mode === 'booking' && !time) {
      setError('Chọn ca khám.');
      return;
    }
    setError(null);

    const common = {
      patient_id: patient.patient_id,
      doctor_id: doctorId,
      visit_type: visitType,
      reason_for_visit: reason.trim() || undefined,
      primary_service_id: chosen[0]?.service_id,
      // Không gửi mã giảm giá: server tự áp voucher tốt nhất cho giỏ dịch vụ này.
      services: chosen.map((service) => ({ service_id: service.service_id, quantity: 1 })),
    };

    const result = await run('submit', () =>
      mode === 'walk-in'
        ? apiBookWalkIn({ ...common, appointment_time: time ?? undefined })
        : apiBookOnBehalf({ ...common, appointment_date: date, appointment_time: time!, consultation_mode: consultationMode }),
    );

    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }

    const appointment = result.data;
    toast.success(
      appointment.status === 'pending_approval'
        ? 'Đã tạo lịch hẹn — mức giảm giá cần duyệt trước khi xác nhận.'
        : mode === 'walk-in'
          ? `Đã nhận khách vãng lai${appointment.queue_number ? ` — số thứ tự ${appointment.queue_number}` : ''}.`
          : 'Đã đặt lịch hẹn cho bệnh nhân.',
    );
    navigate(`/thu-ngan/lich-hen/${appointment.appointment_id}`);
  };

  return (
    <>
      <PageHeader
        title="Đặt lịch tại quầy"
        description="Khách vãng lai được xếp khung giờ trống sớm nhất hôm nay và nhận phòng ngay."
        backTo="/thu-ngan"
        backLabel="Lịch hẹn"
      />

      <div className="st-panel" style={{ marginBottom: '1rem', padding: '0.6rem 0.75rem' }}>
        <FilterTabs
          label="Loại đặt lịch"
          value={mode}
          onChange={(value) => {
            setMode(value as Mode);
            setTime(null);
          }}
          options={[
            { value: 'walk-in', label: 'Khách vãng lai (khám hôm nay)' },
            { value: 'booking', label: 'Đặt lịch hẹn' },
          ]}
        />
      </div>

      {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}

      <div className="st-grid-main">
        <div className="st-stack">
          <Panel title="Bệnh nhân & bác sĩ">
            <div className="st-form-grid">
              <div className="st-span-2">
                <PatientPicker value={patient} onChange={setPatient} />
              </div>
              <DoctorSelect
                required
                value={doctorId}
                onChange={(value) => {
                  setDoctorId(value);
                  setTime(null);
                }}
              />
              {mode === 'booking' ? (
                <Field label="Ngày khám" required>
                  {(id) => (
                    <input
                      id={id}
                      type="date"
                      min={todayIso()}
                      className="st-input"
                      value={date}
                      onChange={(event) => {
                        setDate(event.target.value);
                        setTime(null);
                      }}
                    />
                  )}
                </Field>
              ) : (
                <Field label="Ngày khám">{(id) => <input id={id} className="st-input" value="Hôm nay" disabled />}</Field>
              )}
              {mode === 'booking' && doctorId && (
                <div className="st-span-2">
                  <DoctorMonthCalendar
                    doctorId={doctorId}
                    value={date}
                    onChange={(value) => {
                      setDate(value);
                      setTime(null);
                    }}
                  />
                </div>
              )}
              <div className="st-span-2">
                <div className="st-label" style={{ marginBottom: 6 }}>
                  Ca khám {mode === 'walk-in' ? '(bỏ trống để lấy ca sớm nhất còn đủ thời gian)' : ''}
                  {quote && <span className="st-cell-sub"> · lượt khám cần {quote.duration_minutes} phút</span>}
                </div>
                <SlotPicker
                  doctorId={doctorId}
                  date={effectiveDate}
                  value={time}
                  onChange={setTime}
                  durationMinutes={quote?.duration_minutes}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Dịch vụ" subtitle="Chọn nhiều dịch vụ, mỗi dịch vụ một lần · bỏ trống nếu chỉ khám">
            {services.error && <Alert tone="danger" className="st-alert-gap">{services.error}</Alert>}
            <Field label="Thêm dịch vụ">
              {(id) => (
                <select
                  id={id}
                  className="st-select"
                  value=""
                  disabled={services.loading || serviceGroups.length === 0}
                  onChange={(event) => {
                    const serviceId = Number(event.target.value);
                    if (serviceId) {
                      setSelectedIds((current) => (current.includes(serviceId) ? current : [...current, serviceId]));
                    }
                  }}
                >
                  <option value="">
                    {!services.loading && serviceList.length === 0
                      ? 'Chưa có dịch vụ đang hoạt động'
                      : serviceGroups.length === 0
                        ? 'Đã chọn hết dịch vụ'
                        : '— Thêm dịch vụ —'}
                  </option>
                  {serviceGroups.map(([group, items]) => (
                    <optgroup key={group} label={group}>
                      {items.map((service) => (
                        <option key={service.service_id} value={service.service_id}>
                          {service.service_name} · {service.duration_minutes} phút · {formatMoney(service.price)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </Field>
            {chosen.length === 0 ? (
              <p className="st-hint" style={{ marginTop: '0.5rem' }}>
                Chưa chọn dịch vụ — chỉ khám.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: '0.6rem 0 0', padding: 0, display: 'grid', gap: 6 }}>
                {chosen.map((service, index) => (
                  <li
                    key={service.service_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '0.4rem 0.4rem 0.4rem 0.7rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="st-cell-main">{service.service_name}</span>
                      <span className="st-cell-sub">
                        {' '}
                        · {service.duration_minutes} phút{index === 0 ? ' · Dịch vụ chính' : ''}
                      </span>
                    </div>
                    <span className="st-strong">{formatMoney(service.price)}</span>
                    <Button
                      size="sm"
                      iconOnly
                      aria-label={`Bỏ ${service.service_name}`}
                      icon={<X size={13} />}
                      onClick={() => setSelectedIds((current) => current.filter((id) => id !== service.service_id))}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <VoucherStrip
            subtotal={quote?.subtotal_amount ?? subtotal}
            appliedPromotionId={quote?.promotion?.promotion_id ?? null}
            patientId={patientId}
          />
        </div>

        <div className="st-stack">
          <Panel title="Chi tiết lượt khám">
            <div className="st-form-grid">
              <Field label="Loại khám">
                {(id) => (
                  <select id={id} className="st-select" value={visitType} onChange={(event) => setVisitType(event.target.value)}>
                    {Object.entries(VISIT_TYPE_LABEL).map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              {mode === 'booking' ? (
                <Field label="Hình thức">
                  {(id) => (
                    <select id={id} className="st-select" value={consultationMode} onChange={(event) => setConsultationMode(event.target.value)}>
                      {['in_clinic', 'video_call', 'chat'].map((code) => (
                        <option key={code} value={code}>
                          {CONSULTATION_MODE_LABEL[code]}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              ) : (
                <Field label="Hình thức">{(id) => <input id={id} className="st-input" value="Tại phòng khám" disabled />}</Field>
              )}
              <Field label="Lý do khám" className="st-span-2">
                {(id) => <textarea id={id} className="st-textarea" maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} />}
              </Field>
            </div>
          </Panel>

          <Panel title="Tóm tắt">
            <dl className="st-totals">
              <dt>Dịch vụ đã chọn</dt>
              <dd>{chosen.length || 'Chỉ khám'}</dd>
              <dt>Tạm tính dịch vụ</dt>
              <dd>{formatMoney(quote?.subtotal_amount ?? subtotal)}</dd>
              {quote && (
                <>
                  <dt>Thời lượng</dt>
                  <dd>{quote.duration_minutes} phút</dd>
                </>
              )}
              {quote?.promotion && (
                <>
                  <dt>Voucher tự áp ({quote.promotion.promotion_code})</dt>
                  <dd>-{formatMoney(quote.discount_amount)}</dd>
                </>
              )}
              <dt className="st-total-row">Tổng dự kiến</dt>
              <dd className="st-total-row">{formatMoney(quote?.total_amount ?? subtotal)}</dd>
            </dl>
            {quote?.next_tier && (
              <p className="st-hint" style={{ marginTop: '0.5rem' }}>
                Chọn thêm {formatMoney(quote.next_tier.amount_needed)} để được {describePromotion(quote.next_tier).toLowerCase()}.
              </p>
            )}
            <p className="st-hint" style={{ marginTop: '0.5rem' }}>
              Hệ thống tự áp 1 voucher giảm nhiều nhất; tổng cuối do backend tính lại khi tạo lịch.
            </p>
            <Button
              variant="primary"
              className="st-span-all"
              style={{ width: '100%', marginTop: '0.9rem', height: 42 }}
              icon={mode === 'walk-in' ? <Footprints size={17} /> : <CalendarPlus size={17} />}
              loading={isPending('submit')}
              onClick={submit}
            >
              {mode === 'walk-in' ? 'Nhận khách & xếp hàng' : 'Đặt lịch hẹn'}
            </Button>
          </Panel>
        </div>
      </div>
    </>
  );
};

export default DeskBookingPage;
