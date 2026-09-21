import { useEffect, useRef, useState } from 'react';
import { Loader2, UserRound } from 'lucide-react';
import { apiGetStaffDoctorSlots, apiSearchDeskPatients } from '../../api/functions/desk';
import type { DoctorAvailability } from '../../api/types';
import type { DeskPatient } from '../../api/staffTypes';
import { DESK_PAYMENT_METHODS, PAYMENT_METHOD } from '../labels';
import { formatDate, formatTime } from '../format';
import { useDoctorOptions } from './useDoctorOptions';
import { formatWorkingHours } from '../../utils/workingHours';
import type { PaymentFormValue } from './payment';
import { useApiQuery, useDebounced } from '../hooks';
import { Alert, Field } from './ui';

/* ---------------------------------------------------------------- Doctors */

interface DoctorSelectProps {
  value: number | null;
  onChange: (doctorId: number | null) => void;
  label?: string;
  required?: boolean;
  allowAll?: boolean;
  /** Dùng làm bộ lọc: bỏ lối nhập mã bác sĩ để ô thẳng hàng với các bộ lọc khác. */
  compact?: boolean;
}

export const DoctorSelect = ({ value, onChange, label = 'Bác sĩ', required, allowAll, compact }: DoctorSelectProps) => {
  const { options, loading } = useDoctorOptions();
  const [manual, setManual] = useState(false);
  const known = value === null || options.some((option) => option.doctor_id === value);
  const selected = compact ? undefined : options.find((option) => option.doctor_id === value);

  return (
    <Field
      label={label}
      required={required}
      hint={
        compact ? undefined : <button type="button" className="st-hint" style={{ textDecoration: 'underline' }} onClick={() => setManual((m) => !m)}>
          {manual ? 'Chọn từ danh sách' : 'Không thấy bác sĩ? Nhập mã bác sĩ'}
        </button>
      }
    >
      {(id) => (
        <>
          {manual || !known ? (
            <input
              id={id}
              className="st-input"
              type="number"
              min={1}
              placeholder="Mã bác sĩ"
              value={value ?? ''}
              onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
            />
          ) : (
            <select
              id={id}
              className="st-select"
              value={value ?? ''}
              disabled={loading}
              onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">{loading ? 'Đang tải…' : allowAll ? 'Tất cả bác sĩ' : 'Chọn bác sĩ'}</option>
              {options.map((option) => (
                <option key={option.doctor_id} value={option.doctor_id}>
                  {option.full_name}
                  {option.detail ? ` — ${option.detail}` : ''}
                </option>
              ))}
            </select>
          )}
          {selected?.working_hours && (
            <div className="st-hint" style={{ marginTop: '0.35rem' }}>
              Lịch làm việc: {formatWorkingHours(selected.working_hours)}
            </div>
          )}
        </>
      )}
    </Field>
  );
};

/* ---------------------------------------------------------------- Patients */

export const PatientPicker = ({
  value,
  onChange,
}: {
  value: DeskPatient | null;
  onChange: (patient: DeskPatient | null) => void;
}) => {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const search = useDebounced(text.trim(), 300);
  const ref = useRef<HTMLDivElement>(null);

  const query = useApiQuery(() => apiSearchDeskPatients({ search, page_size: 8 }), [search], {
    enabled: open && search.length >= 2,
  });

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (value) {
    return (
      <div className="st-alert info" style={{ alignItems: 'center' }}>
        <UserRound size={18} />
        <div style={{ flex: 1 }}>
          <div className="st-cell-main">{value.full_name}</div>
          <div className="st-cell-sub">
            {value.patient_code} · {value.account_phone_number ?? value.account_email ?? 'Chưa có liên hệ'}
            {value.date_of_birth ? ` · Sinh ${formatDate(value.date_of_birth)}` : ''}
          </div>
        </div>
        <button type="button" className="st-btn st-btn-ghost st-btn-sm" onClick={() => onChange(null)}>
          Đổi
        </button>
      </div>
    );
  }

  const items = query.data?.items ?? [];

  return (
    <div className="st-picker" ref={ref}>
      <Field label="Bệnh nhân" required hint="Gõ ít nhất 2 ký tự: tên, mã bệnh nhân, số điện thoại hoặc email.">
        {(id) => (
          <input
            id={id}
            className="st-input"
            value={text}
            autoComplete="off"
            placeholder="Tìm bệnh nhân…"
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setText(event.target.value);
              setOpen(true);
            }}
          />
        )}
      </Field>
      {open && search.length >= 2 && (
        <div className="st-picker-list" role="listbox">
          {query.loading && (
            <div className="st-picker-option st-muted">
              <Loader2 size={14} className="st-spin" /> Đang tìm…
            </div>
          )}
          {!query.loading && items.length === 0 && (
            <div className="st-picker-option st-muted">Không tìm thấy. Đăng ký bệnh nhân mới ở trang Bệnh nhân.</div>
          )}
          {items.map((patient) => (
            <button
              key={patient.patient_id}
              type="button"
              role="option"
              aria-selected={false}
              className="st-picker-option"
              onClick={() => {
                onChange(patient);
                setOpen(false);
                setText('');
              }}
            >
              <span>
                <span className="st-cell-main">{patient.full_name}</span>
                <br />
                <span className="st-cell-sub">{patient.account_phone_number ?? patient.account_email ?? '—'}</span>
              </span>
              <span className="st-cell-sub">{patient.patient_code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------------- Shifts */

interface SlotPickerProps {
  doctorId: number | null;
  date: string;
  value: string | null;
  onChange: (startTime: string | null) => void;
  /** Số phút lượt khám cần; ca không đủ chỗ sẽ bị khoá. Bỏ trống thì chỉ khoá ca đã đầy. */
  durationMinutes?: number;
}

const SHIFT_UNAVAILABLE_LABEL: Record<string, string> = {
  full: 'đã đầy',
  not_enough_time: 'không đủ thời gian',
  past: 'đã qua',
  time_off: 'bác sĩ nghỉ',
};

/** Các ca của một bác sĩ trong một ngày, qua API của quầy, kèm số phút còn trống. */
export const SlotPicker = ({ doctorId, date, value, onChange, durationMinutes }: SlotPickerProps) => {
  const query = useApiQuery<DoctorAvailability>(
    () => apiGetStaffDoctorSlots(doctorId!, date, durationMinutes),
    [doctorId, date, durationMinutes],
    { enabled: Boolean(doctorId && date) },
  );

  if (!doctorId || !date) {
    return <div className="st-hint">Chọn bác sĩ và ngày để xem ca khám.</div>;
  }
  if (query.loading) {
    return (
      <div className="st-hint">
        <Loader2 size={13} className="st-spin" /> Đang tải ca khám…
      </div>
    );
  }
  if (query.error) {
    return <Alert tone="danger">{query.error}</Alert>;
  }
  if (query.data?.is_clinic_holiday) {
    return <Alert tone="warning">Ngày {formatDate(date)} phòng khám nghỉ.</Alert>;
  }
  const slots = query.data?.slots ?? [];
  if (slots.length === 0) {
    return <Alert tone="warning">Bác sĩ không làm việc ngày {formatDate(date)}.</Alert>;
  }

  // Một lượt khám dài hơn một ca nuốt luôn ca kế, nên chỉ bày ca mở đầu mỗi chuỗi: bấm vào ca đã
  // bị chiếm thì chỉ tố thêm một lần bị từ chối.
  const heads: DoctorAvailability['slots'] = [];
  for (let index = 0; index < slots.length; index += Math.max(1, slots[index].shifts_used)) {
    heads.push(slots[index]);
  }

  return (
    <div className="st-chip-row" role="radiogroup" aria-label="Ca khám">
      {heads.map((slot) => (
        <button
          key={slot.start_time}
          type="button"
          role="radio"
          aria-checked={value === slot.start_time}
          disabled={!slot.is_available}
          title={`${slot.booked_count} lượt đã đặt · đã dùng ${slot.used_minutes}/${slot.capacity_minutes} phút`}
          className={`st-slot ${value === slot.start_time ? 'active' : ''}`}
          onClick={() => onChange(value === slot.start_time ? null : slot.start_time)}
        >
          {slot.shift_name} · {formatTime(slot.start_time)}–
          {formatTime(slot.span_end_time ?? slot.end_time)}
          <span className="st-cell-sub" style={{ marginLeft: 6 }}>
            {slot.shifts_used > 1 && `${slot.shifts_used} ca · `}
            {slot.is_available
              ? `còn ${slot.remaining_minutes}′`
              : SHIFT_UNAVAILABLE_LABEL[slot.unavailable_reason ?? ''] ?? 'không nhận'}
          </span>
        </button>
      ))}
    </div>
  );
};

/* ---------------------------------------------------------------- Payment */

export const PaymentMethodFields = ({
  value,
  onChange,
}: {
  value: PaymentFormValue;
  onChange: (value: PaymentFormValue) => void;
}) => (
  <div className="st-form-grid">
    <Field label="Phương thức" required>
      {(id) => (
        <select
          id={id}
          className="st-select"
          value={value.payment_method}
          onChange={(event) => onChange({ ...value, payment_method: event.target.value })}
        >
          {DESK_PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD[method]}
            </option>
          ))}
        </select>
      )}
    </Field>
    <Field
      label="Mã giao dịch ngân hàng"
      required={value.payment_method === 'bank_transfer'}
      hint={value.payment_method === 'bank_transfer' ? 'Bắt buộc để đối soát.' : 'Không bắt buộc.'}
    >
      {(id) => (
        <input
          id={id}
          className="st-input"
          value={value.external_reference}
          maxLength={100}
          onChange={(event) => onChange({ ...value, external_reference: event.target.value })}
        />
      )}
    </Field>
  </div>
);

