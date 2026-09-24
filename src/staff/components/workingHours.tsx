import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Plus } from 'lucide-react';
import type { ApiResult } from '../../api/helpers';
import type { AppointmentListItem } from '../../api/types';
import type { DoctorSchedule, DoctorSchedulePayload } from '../../api/staffTypes';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, formatTime, toApiTime } from '../format';
import { CONSULTATION_MODE_LABEL, DAY_OF_WEEK_LABEL, STANDARD_SHIFTS, textOf } from '../labels';
import { TimeOffOutcome } from './timeOff';
import { useToast } from './toastContext';
import { Alert, Button, ConfirmDialog, EmptyState, Field, Panel, Sheet, TableSkeleton } from './ui';

export interface WorkingHoursApi {
  list: (includeInactive: boolean) => Promise<ApiResult<DoctorSchedule[]>>;
  /** Bỏ trống các hàm ghi => chỉ xem (bác sĩ xem ca của mình; chỉ admin được sửa). */
  create?: (payload: DoctorSchedulePayload) => Promise<ApiResult<DoctorSchedule>>;
  update?: (scheduleId: number, payload: DoctorSchedulePayload) => Promise<ApiResult<DoctorSchedule>>;
  setStatus?: (scheduleId: number, isActive: boolean) => Promise<ApiResult<DoctorSchedule>>;
}

interface FormValue {
  day_of_week: string;
  consultation_mode: string;
  start_time: string;
  end_time: string;
  max_patients: string;
  is_active: boolean;
}

const emptyForm: FormValue = {
  day_of_week: '1',
  consultation_mode: 'in_clinic',
  start_time: '07:30',
  end_time: '09:30',
  max_patients: '20',
  is_active: true,
};

const toForm = (row: DoctorSchedule): FormValue => ({
  day_of_week: String(row.day_of_week),
  consultation_mode: row.consultation_mode,
  start_time: formatTime(row.start_time),
  end_time: formatTime(row.end_time),
  max_patients: String(row.max_patients),
  is_active: row.is_active,
});

const MIN_SHIFT_MINUTES = 30;
const MAX_SHIFT_MINUTES = 480;

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

function toPayload(form: FormValue): DoctorSchedulePayload | string {
  if (!form.start_time || !form.end_time) {
    return 'Nhập giờ bắt đầu và giờ kết thúc.';
  }
  const span = toMinutes(form.end_time) - toMinutes(form.start_time);
  if (span <= 0) {
    return 'Giờ kết thúc phải sau giờ bắt đầu.';
  }
  if (span < MIN_SHIFT_MINUTES || span > MAX_SHIFT_MINUTES) {
    return `Một ca dài từ ${MIN_SHIFT_MINUTES} đến ${MAX_SHIFT_MINUTES} phút; ca này dài ${span} phút.`;
  }
  const max = Number(form.max_patients);
  if (!(max >= 1 && max <= 500)) {
    return 'Số bệnh nhân tối đa từ 1 đến 500.';
  }
  return {
    day_of_week: Number(form.day_of_week),
    consultation_mode: form.consultation_mode,
    start_time: toApiTime(form.start_time),
    end_time: toApiTime(form.end_time),
    max_patients: max,
    is_active: form.is_active,
  };
}

/** Các lịch hẹn nằm ngoài khung giờ mới mà hệ thống không tự dời được — quầy phải dời. */
export const AffectedAppointments = ({
  items,
  linkBase,
}: {
  items: AppointmentListItem[];
  linkBase?: string;
}) => (
  <Alert tone="warning" className="st-alert-gap">
    <strong>{items.length} lịch hẹn nằm ngoài khung giờ mới và chưa tự dời được.</strong> Không lịch nào bị huỷ; quầy lễ tân cần
    dời các lịch này.
    <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.1rem' }}>
      {items.map((item) => (
        <li key={item.appointment_id}>
          {linkBase ? (
            <Link to={`${linkBase}/${item.appointment_id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
              {formatDate(item.appointment_date)} {formatTime(item.appointment_time)} · {item.patient_full_name}
            </Link>
          ) : (
            `${formatDate(item.appointment_date)} ${formatTime(item.appointment_time)} · ${item.patient_full_name}`
          )}
        </li>
      ))}
    </ul>
  </Alert>
);

/**
 * Bảng ca làm việc theo tuần, dùng chung cho bác sĩ (chỉ xem ca của mình) và admin (sửa ca của bất kỳ
 * bác sĩ nào). Mỗi dòng là một thứ, các ca trong ngày hiện thành thẻ; admin bấm thẻ để sửa/tắt ca.
 */
export const WorkingHoursEditor = ({
  api,
  scopeKey,
  affectedLinkBase,
  intro,
  onChanged,
}: {
  api: WorkingHoursApi;
  /** Đổi khi đổi bác sĩ để tải lại. */
  scopeKey: string | number;
  affectedLinkBase?: string;
  intro?: string;
  /** Gọi sau mỗi lần thêm/sửa/tắt ca thành công, để màn cha tải lại dữ liệu phụ thuộc. */
  onChanged?: () => void;
}) => {
  const toast = useToast();
  const { run, isPending } = useAction();
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<DoctorSchedule | 'new' | null>(null);
  const [form, setForm] = useState<FormValue>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<DoctorSchedule | null>(null);
  const [lastSaved, setLastSaved] = useState<DoctorSchedule | null>(null);
  const affected = lastSaved?.affected_appointments ?? [];
  const overbooked = lastSaved?.overbooked_dates ?? [];

  const query = useApiQuery(() => api.list(showInactive), [scopeKey, showInactive]);
  const rows = [...(query.data ?? [])].sort(
    (a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time),
  );
  const days = [
    ...rows.reduce(
      (map, row) => map.set(row.day_of_week, [...(map.get(row.day_of_week) ?? []), row]),
      new Map<number, DoctorSchedule[]>(),
    ),
  ];
  const readOnly = !api.create || !api.update || !api.setStatus;
  const weeklyHours = rows.filter((row) => row.is_active).reduce((sum, row) => sum + row.capacity_minutes, 0) / 60;

  const openForm = (row: DoctorSchedule | 'new') => {
    setEditing(row);
    setForm(row === 'new' ? emptyForm : toForm(row));
    setError(null);
  };

  const done = (result: DoctorSchedule, message: string) => {
    setLastSaved(result);
    toast.success(message);
    query.reload();
    onChanged?.();
  };

  const save = async () => {
    const payload = toPayload(form);
    if (typeof payload === 'string') {
      setError(payload);
      return;
    }
    const { create, update } = api;
    if (!create || !update) {
      return;
    }
    const result = await run('save', () =>
      editing === 'new' || editing === null ? create(payload) : update(editing.doctor_schedule_id, payload),
    );
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    setEditing(null);
    done(result.data, editing === 'new' ? 'Đã thêm ca làm việc.' : 'Đã cập nhật ca làm việc.');
  };

  /** Tạo đủ 4 ca chuẩn cho thứ đang chọn; ca nào trùng giờ đã có thì báo lại, ca còn lại vẫn được tạo. */
  const createStandardShifts = async () => {
    const { create } = api;
    if (!create) {
      return;
    }
    const created: DoctorSchedule[] = [];
    const failures: string[] = [];

    await run('standard', async () => {
      for (const shift of STANDARD_SHIFTS) {
        const payload = toPayload({ ...form, start_time: shift.start_time, end_time: shift.end_time, is_active: true });
        if (typeof payload === 'string') {
          failures.push(`${shift.label}: ${payload}`);
          continue;
        }
        const result = await create(payload);
        if (result.ok && result.data) {
          created.push(result.data);
        } else {
          failures.push(`${shift.label}: ${result.error}`);
        }
      }
      return { ok: true, status: 200, data: null, error: null, errorCode: null } satisfies ApiResult<null>;
    });

    if (failures.length > 0) {
      setError(failures.join(' · '));
    } else {
      setEditing(null);
    }
    if (created.length > 0) {
      toast.success(`Đã tạo ${created.length} ca cho ${DAY_OF_WEEK_LABEL[Number(form.day_of_week)]?.toLowerCase() ?? 'ngày này'}.`);
      query.reload();
      onChanged?.();
    }
  };

  const toggle = async () => {
    const { setStatus } = api;
    if (!toggling || !setStatus) {
      return;
    }
    const result = await run('toggle', () => setStatus(toggling.doctor_schedule_id, !toggling.is_active));
    setToggling(null);
    if (!result.ok || !result.data) {
      toast.error(result.error);
      return;
    }
    done(result.data, result.data.is_active ? 'Đã mở lại ca.' : 'Đã tắt ca.');
  };

  const set = (key: keyof FormValue) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const previewMinutes = (() => {
    const span = toMinutes(form.end_time || '0:0') - toMinutes(form.start_time || '0:0');
    return span > 0 ? span : null;
  })();

  return (
    <>
      <TimeOffOutcome result={lastSaved} pendingText="Xem danh sách bên dưới để dời sang giờ khác." />
      {affected.length > 0 && <AffectedAppointments items={affected} linkBase={affectedLinkBase} />}
      {lastSaved && overbooked.length > 0 && (
        <Alert tone="warning" className="st-alert-gap">
          Ca này đang có nhiều hơn {lastSaved.max_patients} lịch vào các ngày: {overbooked.map((date) => formatDate(date)).join(', ')}. Các lịch đã
          đặt vẫn giữ nguyên, ca sẽ không nhận thêm cho đến khi số lịch giảm xuống.
        </Alert>
      )}

      <Panel
        title="Ca làm việc trong tuần"
        subtitle={
          intro ??
          `${rows.filter((row) => row.is_active).length} ca đang mở · ${weeklyHours.toLocaleString('vi-VN')} giờ khám mỗi tuần${
            readOnly ? ' · Chỉ quản trị viên được thay đổi ca' : ''
          }`
        }
        bodyless
        actions={
          <>
            <label className="st-check">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              Hiện ca đã tắt
            </label>
            {!readOnly && (
              <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => openForm('new')}>
                Thêm ca
              </Button>
            )}
          </>
        }
      >
        {query.error && (
          <div className="st-panel-body">
            <Alert tone="danger">{query.error}</Alert>
          </div>
        )}
        {query.loading && rows.length === 0 ? (
          <table className="st-table">
            <tbody>
              <TableSkeleton columns={3} rows={4} />
            </tbody>
          </table>
        ) : rows.length === 0 && !query.error ? (
          <EmptyState
            icon={<CalendarClock size={32} strokeWidth={1.6} />}
            title="Chưa có giờ làm việc"
            text={
              readOnly
                ? 'Bạn chưa được xếp ca nào. Liên hệ quản trị viên để được xếp lịch làm việc.'
                : 'Bệnh nhân chỉ đặt được lịch vào ca làm việc. Thêm ít nhất một ca để mở lịch.'
            }
            action={
              readOnly ? undefined : (
                <Button variant="primary" icon={<Plus size={15} />} onClick={() => openForm('new')}>
                  Thêm ca
                </Button>
              )
            }
          />
        ) : (
          <div className="st-table-wrap">
            <table className="st-table st-week-table">
              <thead>
                <tr>
                  <th>Thứ</th>
                  <th>Ca làm việc</th>
                  <th className="st-num">Giờ khám</th>
                </tr>
              </thead>
              <tbody>
                {days.map(([day, shifts]) => (
                  <tr key={day}>
                    <td className="st-strong st-nowrap">{DAY_OF_WEEK_LABEL[day] ?? day}</td>
                    <td>
                      <div className="st-shift-row">
                        {shifts.map((row) => {
                          const mode = textOf(CONSULTATION_MODE_LABEL, row.consultation_mode);
                          const label = (
                            <>
                              {formatTime(row.start_time)}–{formatTime(row.end_time)}
                              {row.consultation_mode !== 'in_clinic' && <span className="st-shift-meta">{mode}</span>}
                              {!row.is_active && <span className="st-shift-meta">đã tắt</span>}
                            </>
                          );
                          const title = `${mode} · ${row.capacity_minutes} phút · tối đa ${row.max_patients} BN${row.is_active ? '' : ' · đã tắt'}`;
                          const className = `st-shift ${row.is_active ? '' : 'off'}`;
                          return readOnly ? (
                            <span key={row.doctor_schedule_id} className={className} title={title}>
                              {label}
                            </span>
                          ) : (
                            <button
                              key={row.doctor_schedule_id}
                              type="button"
                              className={`${className} editable`}
                              title={`${title} — bấm để sửa`}
                              onClick={() => openForm(row)}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="st-num">
                      {(shifts.filter((row) => row.is_active).reduce((sum, row) => sum + row.capacity_minutes, 0) / 60).toLocaleString('vi-VN')} giờ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Sheet
        open={editing !== null}
        title={editing === 'new' ? 'Thêm ca làm việc' : 'Sửa ca làm việc'}
        subtitle="Ca lặp lại hằng tuần. Ngày nghỉ và ngày lễ tự bị trừ ra. Ca đầy theo tổng phút các lượt khám đã đặt."
        onClose={() => setEditing(null)}
        footer={
          <>
            {editing !== null && editing !== 'new' && (
              <Button
                variant={editing.is_active ? 'danger' : 'ghost'}
                style={{ marginRight: 'auto' }}
                onClick={() => {
                  setToggling(editing);
                  setEditing(null);
                }}
              >
                {editing.is_active ? 'Tắt ca' : 'Mở lại ca'}
              </Button>
            )}
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Huỷ
            </Button>
            <Button variant="primary" loading={isPending('save')} onClick={save}>
              Lưu
            </Button>
          </>
        }
      >
        {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}
        <div className="st-form-grid">
          <Field label="Thứ trong tuần" required>
            {(id) => (
              <select id={id} className="st-select" value={form.day_of_week} onChange={set('day_of_week')}>
                {Object.entries(DAY_OF_WEEK_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Hình thức">
            {(id) => (
              <select id={id} className="st-select" value={form.consultation_mode} onChange={set('consultation_mode')}>
                {Object.entries(CONSULTATION_MODE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <div className="st-span-2">
            <div className="st-hint" style={{ marginBottom: '0.4rem' }}>Ca chuẩn của phòng khám</div>
            <div className="st-chip-row" role="radiogroup" aria-label="Ca chuẩn">
              {STANDARD_SHIFTS.map((shift) => {
                const active = form.start_time === shift.start_time && form.end_time === shift.end_time;
                return (
                  <button
                    key={shift.label}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`st-slot ${active ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, start_time: shift.start_time, end_time: shift.end_time })}
                  >
                    {shift.label} · {shift.start_time}–{shift.end_time}
                  </button>
                );
              })}
            </div>
            {editing === 'new' && (
              <Button
                size="sm"
                variant="ghost"
                loading={isPending('standard')}
                onClick={createStandardShifts}
                style={{ marginTop: '0.5rem' }}
              >
                Tạo cả 4 ca chuẩn cho {DAY_OF_WEEK_LABEL[Number(form.day_of_week)]?.toLowerCase() ?? 'thứ này'}
              </Button>
            )}
          </div>
          <Field label="Từ giờ" required>
            {(id) => <input id={id} type="time" className="st-input" value={form.start_time} onChange={set('start_time')} />}
          </Field>
          <Field label="Đến giờ" required>
            {(id) => <input id={id} type="time" className="st-input" value={form.end_time} onChange={set('end_time')} />}
          </Field>
          <Field label="Tối đa bệnh nhân" required hint={previewMinutes ? `Ca dài ${previewMinutes} phút` : undefined}>
            {(id) => <input id={id} type="number" min={1} max={500} className="st-input" value={form.max_patients} onChange={set('max_patients')} />}
          </Field>
          <label className="st-check st-span-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Đang mở nhận lịch
          </label>
        </div>
      </Sheet>

      <ConfirmDialog
        open={toggling !== null}
        title={toggling?.is_active ? 'Tắt ca này?' : 'Mở lại ca này?'}
        text={
          toggling?.is_active
            ? 'Không nhận đặt lịch mới vào ca này. Lịch đã đặt vẫn giữ nguyên và sẽ được liệt kê để quầy dời.'
            : 'Bệnh nhân có thể đặt lịch vào ca này trở lại.'
        }
        confirmLabel={toggling?.is_active ? 'Tắt ca' : 'Mở lại'}
        tone={toggling?.is_active ? 'danger-solid' : 'primary'}
        loading={isPending('toggle')}
        onConfirm={toggle}
        onClose={() => setToggling(null)}
      />
    </>
  );
};
