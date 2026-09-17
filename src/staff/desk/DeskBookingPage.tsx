import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Footprints, Minus, Plus } from 'lucide-react';
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
import { Alert, Button, EmptyState, Field, FilterTabs, PageHeader, Panel } from '../components/ui';

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
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [primaryServiceId, setPrimaryServiceId] = useState<number | null>(null);
  const [visitType, setVisitType] = useState('new_visit');
  const [consultationMode, setConsultationMode] = useState('in_clinic');
  const [reason, setReason] = useState('');
  const [promotionCode, setPromotionCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const services = useApiQuery(() => apiGetServices({ page_size: 100 }), []);
  const serviceList = services.data?.items ?? [];
  const chosen = serviceList.filter((service) => (quantities[service.service_id] ?? 0) > 0);
  const subtotal = chosen.reduce((sum, service) => sum + service.price * quantities[service.service_id], 0);
  const effectiveDate = mode === 'walk-in' ? todayIso() : date;

  // Báo giá để quầy thấy trước thời lượng (ca nào còn chứa được) và voucher sẽ tự áp khi không nhập mã.
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const quoteKey = chosen.map((service) => `${service.service_id}x${quantities[service.service_id]}`).join(',');
  const patientId = patient?.patient_id ?? null;

  useEffect(() => {
    let cancelled = false;
    const lines = quoteKey
      ? quoteKey.split(',').map((part) => {
          const [id, quantity] = part.split('x').map(Number);
          return { service_id: id, quantity };
        })
      : [];

    apiGetBookingQuote(lines, patientId).then((result) => {
      if (!cancelled) {
        setQuote(result.ok ? result.data : null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [quoteKey, patientId]);

  const setQuantity = (serviceId: number, quantity: number) => {
    setQuantities((current) => ({ ...current, [serviceId]: Math.max(0, quantity) }));
    if (quantity <= 0 && primaryServiceId === serviceId) {
      setPrimaryServiceId(null);
    }
  };

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
      primary_service_id: primaryServiceId ?? chosen[0]?.service_id,
      services: chosen.map((service) => ({ service_id: service.service_id, quantity: quantities[service.service_id] })),
      promotion_code: promotionCode.trim() || undefined,
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

          <Panel title="Dịch vụ" subtitle="Có thể bỏ trống nếu chỉ khám" bodyless>
            {services.error && (
              <div className="st-panel-body">
                <Alert tone="danger">{services.error}</Alert>
              </div>
            )}
            {!services.loading && serviceList.length === 0 && !services.error ? (
              <EmptyState title="Chưa có dịch vụ đang hoạt động" />
            ) : (
              <div className="st-table-wrap">
                <table className="st-table">
                  <thead>
                    <tr>
                      <th>Dịch vụ</th>
                      <th className="st-num">Giá</th>
                      <th>Số lượng</th>
                      <th>Chính</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceList.map((service) => {
                      const quantity = quantities[service.service_id] ?? 0;
                      return (
                        <tr key={service.service_id}>
                          <td>
                            <div className="st-cell-main">{service.service_name}</div>
                            <div className="st-cell-sub">
                              {service.service_group ?? 'Khác'} · {service.duration_minutes} phút
                            </div>
                          </td>
                          <td className="st-num">{formatMoney(service.price)}</td>
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <Button size="sm" iconOnly aria-label="Giảm" icon={<Minus size={13} />} disabled={quantity === 0} onClick={() => setQuantity(service.service_id, quantity - 1)} />
                              <span className="st-strong" style={{ minWidth: 18, textAlign: 'center' }}>
                                {quantity}
                              </span>
                              <Button size="sm" iconOnly aria-label="Tăng" icon={<Plus size={13} />} onClick={() => setQuantity(service.service_id, quantity + 1)} />
                            </div>
                          </td>
                          <td>
                            <input
                              type="radio"
                              name="primary-service"
                              aria-label={`Đặt ${service.service_name} là dịch vụ chính`}
                              disabled={quantity === 0}
                              checked={primaryServiceId === service.service_id}
                              onChange={() => setPrimaryServiceId(service.service_id)}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
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
              <Field
                label="Mã khuyến mãi"
                className="st-span-2"
                hint={
                  quote?.promotion
                    ? `Bỏ trống để tự áp ${quote.promotion.promotion_code} (giảm ${formatMoney(quote.discount_amount)}).`
                    : 'Bỏ trống để tự áp voucher tốt nhất theo tổng tiền.'
                }
              >
                {(id) => (
                  <input id={id} className="st-input st-mono" maxLength={50} value={promotionCode} onChange={(event) => setPromotionCode(event.target.value.toUpperCase())} />
                )}
              </Field>
            </div>
          </Panel>

          <Panel title="Tóm tắt">
            <dl className="st-totals">
              <dt>Dịch vụ đã chọn</dt>
              <dd>{chosen.length}</dd>
              <dt>Tạm tính dịch vụ</dt>
              <dd>{formatMoney(quote?.subtotal_amount ?? subtotal)}</dd>
              {quote && (
                <>
                  <dt>Thời lượng</dt>
                  <dd>{quote.duration_minutes} phút</dd>
                </>
              )}
              {!promotionCode.trim() && quote?.promotion && (
                <>
                  <dt>Voucher tự áp ({quote.promotion.promotion_code})</dt>
                  <dd>-{formatMoney(quote.discount_amount)}</dd>
                </>
              )}
              <dt className="st-total-row">Tổng dự kiến</dt>
              <dd className="st-total-row">
                {formatMoney(promotionCode.trim() ? subtotal : quote?.total_amount ?? subtotal)}
              </dd>
            </dl>
            <p className="st-hint" style={{ marginTop: '0.5rem' }}>
              {promotionCode.trim()
                ? 'Mã nhập tay được kiểm tra khi tạo lịch; tổng cuối do backend tính.'
                : 'Tổng cuối do backend tính lại khi tạo lịch.'}
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
