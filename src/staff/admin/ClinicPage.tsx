import { useState } from 'react';
import { CalendarPlus, Pencil, Save } from 'lucide-react';
import {
  apiCreateHoliday,
  apiGetClinicProfile,
  apiSearchHolidays,
  apiUpdateClinicProfile,
  apiUpdateHoliday,
  apiWithdrawHoliday,
} from '../../api/functions/admin';
import type { ClinicHoliday, ClinicProfile, ClinicProfilePayload } from '../../api/staffTypes';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, formatDateTime, nullIfBlank, todayIso } from '../format';
import { DAY_OF_WEEK_LABEL, isoDayOfWeek } from '../labels';
import { useToast } from '../components/toastContext';
import { Alert, Badge, Button, ConfirmDialog, EmptyState, Field, PageHeader, Panel, Sheet, TableSkeleton } from '../components/ui';

type ProfileForm = Record<keyof ClinicProfilePayload, string>;

const toProfileForm = (profile: ClinicProfile): ProfileForm => ({
  clinic_name: profile.clinic_name,
  tax_code: profile.tax_code ?? '',
  address: profile.address,
  phone_number: profile.phone_number,
  email: profile.email ?? '',
  logo_url: profile.logo_url ?? '',
  business_hours_note: profile.business_hours_note ?? '',
});

const ProfilePanel = () => {
  const toast = useToast();
  const { run, isPending } = useAction();
  const query = useApiQuery(apiGetClinicProfile, []);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [seen, setSeen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Nạp form từ dữ liệu server trong lượt render, mỗi lần server trả bản mới.
  if (query.data && query.data.updated_at !== seen) {
    setSeen(query.data.updated_at);
    setForm(toProfileForm(query.data));
  }

  const set = (key: keyof ProfileForm) => (event: { target: { value: string } }) =>
    setForm((current) => (current ? { ...current, [key]: event.target.value } : current));

  const save = async () => {
    if (!form) {
      return;
    }
    if (!form.clinic_name.trim() || !form.address.trim() || !form.phone_number.trim()) {
      setError('Tên phòng khám, địa chỉ và số điện thoại là bắt buộc.');
      return;
    }
    setError(null);
    const result = await run('profile', () =>
      apiUpdateClinicProfile({
        clinic_name: form.clinic_name.trim(),
        tax_code: nullIfBlank(form.tax_code),
        address: form.address.trim(),
        phone_number: form.phone_number.trim(),
        email: nullIfBlank(form.email),
        logo_url: nullIfBlank(form.logo_url),
        business_hours_note: nullIfBlank(form.business_hours_note),
      }),
    );
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    query.setData(result.data);
    toast.success('Đã lưu thông tin phòng khám.');
  };

  return (
    <Panel
      title="Thông tin phòng khám"
      subtitle={query.data ? `Thông tin liên hệ · sửa lần cuối ${formatDateTime(query.data.updated_at)}` : 'Thông tin liên hệ'}
      actions={
        form && (
          <Button variant="primary" size="sm" icon={<Save size={14} />} loading={isPending('profile')} onClick={save}>
            Lưu
          </Button>
        )
      }
    >
      {query.error && <Alert tone="danger">{query.error}</Alert>}
      {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}
      {!form ? (
        query.loading && (
          <div className="st-stack">
            <span className="st-skel" style={{ width: '60%' }} />
            <span className="st-skel" style={{ width: '85%' }} />
          </div>
        )
      ) : (
        <div className="st-form-grid">
          <Field label="Tên phòng khám" required className="st-span-2">
            {(id) => <input id={id} className="st-input" maxLength={200} value={form.clinic_name} onChange={set('clinic_name')} />}
          </Field>
          <Field label="Địa chỉ" required className="st-span-2">
            {(id) => <input id={id} className="st-input" maxLength={500} value={form.address} onChange={set('address')} />}
          </Field>
          <Field label="Số điện thoại" required>
            {(id) => <input id={id} type="tel" className="st-input" maxLength={15} value={form.phone_number} onChange={set('phone_number')} />}
          </Field>
          <Field label="Email">
            {(id) => <input id={id} type="email" className="st-input" maxLength={150} value={form.email} onChange={set('email')} />}
          </Field>
          <Field label="Mã số thuế">
            {(id) => <input id={id} className="st-input st-mono" maxLength={30} value={form.tax_code} onChange={set('tax_code')} />}
          </Field>
          <Field label="Đường dẫn logo">
            {(id) => <input id={id} type="url" className="st-input" maxLength={500} placeholder="https://…" value={form.logo_url} onChange={set('logo_url')} />}
          </Field>
          <Field label="Giờ mở cửa" className="st-span-2" hint="Ví dụ: Thứ Hai – Thứ Bảy, 8:00 – 20:00">
            {(id) => <input id={id} className="st-input" value={form.business_hours_note} onChange={set('business_hours_note')} />}
          </Field>
        </div>
      )}
    </Panel>
  );
};

interface HolidayForm {
  holiday_date: string;
  holiday_name: string;
  is_active: boolean;
}

const HolidaysPanel = () => {
  const toast = useToast();
  const { run, isPending } = useAction();
  const thisYear = Number(todayIso().slice(0, 4));
  const [year, setYear] = useState(thisYear);
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<ClinicHoliday | 'new' | null>(null);
  const [form, setForm] = useState<HolidayForm>({ holiday_date: '', holiday_name: '', is_active: true });
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<ClinicHoliday | null>(null);

  const query = useApiQuery(
    () => apiSearchHolidays({ from_date: `${year}-01-01`, to_date: `${year}-12-31`, include_inactive: showInactive || undefined }),
    [year, showInactive],
  );
  const items = [...(query.data ?? [])].sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));

  const open = (row: ClinicHoliday | 'new') => {
    setEditing(row);
    setForm(
      row === 'new'
        ? { holiday_date: '', holiday_name: '', is_active: true }
        : { holiday_date: row.holiday_date, holiday_name: row.holiday_name, is_active: row.is_active },
    );
    setError(null);
  };

  const save = async () => {
    if (!form.holiday_date || !form.holiday_name.trim()) {
      setError('Nhập ngày và tên ngày nghỉ.');
      return;
    }
    const target = editing;
    const payload = { ...form, holiday_name: form.holiday_name.trim() };
    const result = await run('save', () =>
      target === 'new' || target === null ? apiCreateHoliday(payload) : apiUpdateHoliday(target.clinic_holiday_id, payload),
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(null);
    toast.success('Đã lưu ngày nghỉ. Mọi khung giờ của ngày đó đóng lại ngay.');
    query.reload();
  };

  const withdraw = async () => {
    if (!withdrawing) {
      return;
    }
    const result = await run('withdraw', () => apiWithdrawHoliday(withdrawing.clinic_holiday_id));
    setWithdrawing(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Đã mở cửa lại ngày này.');
    query.reload();
  };

  return (
    <Panel
      title="Ngày nghỉ lễ"
      subtitle="Ngày phòng khám đóng cửa: mọi bác sĩ đều không nhận lịch."
      bodyless
      actions={
        <>
          <select className="st-select" aria-label="Năm" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 'auto' }}>
            {[thisYear - 1, thisYear, thisYear + 1].map((value) => (
              <option key={value} value={value}>
                Năm {value}
              </option>
            ))}
          </select>
          <label className="st-check">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Hiện ngày đã mở lại
          </label>
          <Button variant="primary" size="sm" icon={<CalendarPlus size={14} />} onClick={() => open('new')}>
            Thêm ngày nghỉ
          </Button>
        </>
      }
    >
      {query.error && (
        <div className="st-panel-body">
          <Alert tone="danger">{query.error}</Alert>
        </div>
      )}
      {query.loading && items.length === 0 ? (
        <table className="st-table">
          <tbody>
            <TableSkeleton columns={4} rows={4} />
          </tbody>
        </table>
      ) : items.length === 0 && !query.error ? (
        <EmptyState title={`Chưa có ngày nghỉ năm ${year}`} text="Thêm các ngày lễ, Tết để bệnh nhân không đặt lịch vào đó." />
      ) : (
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Tên</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.clinic_holiday_id} className={row.is_active ? '' : 'st-row-muted'}>
                  <td className="st-nowrap">
                    <div className="st-strong">{formatDate(row.holiday_date)}</div>
                    <div className="st-cell-sub">{DAY_OF_WEEK_LABEL[isoDayOfWeek(row.holiday_date)]}</div>
                  </td>
                  <td className="st-cell-main">{row.holiday_name}</td>
                  <td>{row.is_active ? <Badge tone="danger">Đóng cửa</Badge> : <Badge>Đã mở lại</Badge>}</td>
                  <td className="st-num st-nowrap">
                    <Button size="sm" variant="ghost" icon={<Pencil size={13} />} onClick={() => open(row)}>
                      Sửa
                    </Button>
                    {row.is_active && (
                      <Button size="sm" variant="ghost" onClick={() => setWithdrawing(row)}>
                        Mở cửa lại
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet
        open={editing !== null}
        title={editing === 'new' ? 'Thêm ngày nghỉ' : 'Sửa ngày nghỉ'}
        onClose={() => setEditing(null)}
        footer={
          <>
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
          <Field label="Ngày" required>
            {(id) => <input id={id} type="date" className="st-input" value={form.holiday_date} onChange={(e) => setForm({ ...form, holiday_date: e.target.value })} />}
          </Field>
          <Field label="Tên ngày nghỉ" required>
            {(id) => <input id={id} className="st-input" placeholder="Quốc khánh" value={form.holiday_name} onChange={(e) => setForm({ ...form, holiday_name: e.target.value })} />}
          </Field>
          <label className="st-check st-span-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Đóng cửa ngày này
          </label>
        </div>
      </Sheet>

      <ConfirmDialog
        open={withdrawing !== null}
        title="Mở cửa lại ngày này?"
        text={withdrawing ? `${formatDate(withdrawing.holiday_date)} · ${withdrawing.holiday_name}. Bác sĩ nhận lịch lại theo giờ làm việc.` : undefined}
        confirmLabel="Mở cửa lại"
        loading={isPending('withdraw')}
        onConfirm={withdraw}
        onClose={() => setWithdrawing(null)}
      />
    </Panel>
  );
};

/** Phòng khám như một đơn vị: thông tin liên hệ và những ngày đóng cửa. */
const ClinicPage = () => (
  <>
    <PageHeader title="Phòng khám" description="Thông tin phòng khám và lịch nghỉ lễ của cả phòng khám." />
    <div className="st-stack">
      <ProfilePanel />
      <HolidaysPanel />
    </div>
  </>
);

export default ClinicPage;
