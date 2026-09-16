import { useState } from 'react';
import { FileText, KeyRound, Lock, LockOpen, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  apiCreateStaffAccount,
  apiGetStaffAccount,
  apiListSpecialties,
  apiResetStaffPassword,
  apiSearchStaffAccounts,
  apiSetStaffAccountStatus,
  apiUpdateStaffAccount,
} from '../../api/functions/admin';
import type { StaffAccount, StaffAccountListItem, StaffDoctorPayload, StaffProfilePayload } from '../../api/staffTypes';
import { useAction, useApiQuery, useDebounced } from '../hooks';
import { formatDate, formatMoney, nullIfBlank, todayIso } from '../format';
import { EMPLOYMENT_TYPE_LABEL, GENDER_LABEL, ROLE_LABEL, SPECIALTIES, STAFF_ROLE_CODES, textOf } from '../labels';
import { PERMISSION } from '../permissions';
import { useToast } from '../components/toastContext';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  Field,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  Sheet,
  TableState,
} from '../components/ui';

interface Form {
  full_name: string;
  email: string;
  phone_number: string;
  temporary_password: string;
  role_code: string;
  profile: Record<keyof StaffProfilePayload, string>;
  doctor: {
    specialty_id: string;
    additional_specialty_ids: number[];
    license_number: string;
    license_expiry_date: string;
    employment_type: string;
    degree: string;
    years_of_experience: string;
    consultation_fee: string;
    biography: string;
    is_accepting_appointments: boolean;
  };
}

const emptyForm = (): Form => ({
  full_name: '',
  email: '',
  phone_number: '',
  temporary_password: '',
  role_code: 'receptionist',
  profile: {
    national_id: '',
    hired_date: todayIso(),
    contract_end_date: '',
    date_of_birth: '',
    gender: '',
    address: '',
    contact_phone: '',
    contact_email: '',
    contract_signed_by: '',
    work_position: '',
    notes: '',
  },
  doctor: {
    specialty_id: '1',
    additional_specialty_ids: [],
    license_number: '',
    license_expiry_date: '',
    employment_type: 'full_time',
    degree: '',
    years_of_experience: '0',
    consultation_fee: '',
    biography: '',
    is_accepting_appointments: true,
  },
});

const toForm = (account: StaffAccount): Form => {
  const base = emptyForm();
  const profile = account.profile;
  const doctor = account.doctor;
  return {
    ...base,
    full_name: account.full_name,
    email: account.email ?? '',
    phone_number: account.phone_number ?? '',
    role_code: account.role_code,
    profile: profile
      ? {
          national_id: profile.national_id,
          hired_date: profile.hired_date,
          contract_end_date: profile.contract_end_date ?? '',
          date_of_birth: profile.date_of_birth ?? '',
          gender: profile.gender ?? '',
          address: profile.address ?? '',
          contact_phone: profile.contact_phone ?? '',
          contact_email: profile.contact_email ?? '',
          contract_signed_by: profile.contract_signed_by ?? '',
          work_position: profile.work_position ?? '',
          notes: profile.notes ?? '',
        }
      : base.profile,
    doctor: doctor
      ? {
          specialty_id: String(doctor.specialty_id),
          additional_specialty_ids: doctor.specialties.map((s) => s.specialty_id).filter((id) => id !== doctor.specialty_id),
          license_number: doctor.license_number ?? '',
          license_expiry_date: doctor.license_expiry_date ?? '',
          employment_type: doctor.employment_type,
          degree: doctor.degree ?? '',
          years_of_experience: String(doctor.years_of_experience),
          consultation_fee: String(doctor.consultation_fee),
          biography: doctor.biography ?? '',
          is_accepting_appointments: doctor.is_accepting_appointments,
        }
      : base.doctor,
  };
};

const profilePayload = (form: Form): StaffProfilePayload => ({
  national_id: form.profile.national_id.trim(),
  hired_date: form.profile.hired_date,
  contract_end_date: nullIfBlank(form.profile.contract_end_date),
  date_of_birth: nullIfBlank(form.profile.date_of_birth),
  gender: nullIfBlank(form.profile.gender),
  address: nullIfBlank(form.profile.address),
  contact_phone: nullIfBlank(form.profile.contact_phone),
  contact_email: nullIfBlank(form.profile.contact_email),
  contract_signed_by: nullIfBlank(form.profile.contract_signed_by),
  work_position: nullIfBlank(form.profile.work_position),
  notes: nullIfBlank(form.profile.notes),
});

const doctorPayload = (form: Form): StaffDoctorPayload => ({
  specialty_id: Number(form.doctor.specialty_id),
  additional_specialty_ids: form.doctor.additional_specialty_ids,
  license_number: nullIfBlank(form.doctor.license_number),
  license_expiry_date: nullIfBlank(form.doctor.license_expiry_date),
  employment_type: form.doctor.employment_type,
  degree: nullIfBlank(form.doctor.degree),
  years_of_experience: Number(form.doctor.years_of_experience) || 0,
  consultation_fee: form.doctor.consultation_fee === '' ? null : Number(form.doctor.consultation_fee),
  biography: nullIfBlank(form.doctor.biography),
  is_accepting_appointments: form.doctor.is_accepting_appointments,
});

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const StaffAccountsPage = () => {
  const toast = useToast();
  const { account: me, hasPermission } = useAuth();
  const canContracts = hasPermission(PERMISSION.ContractsManage);
  const [resetting, setResetting] = useState<StaffAccountListItem | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  // Chuyên khoa lấy từ API; lỗi thì dùng danh sách mặc định đã seed.
  const specialtiesQuery = useApiQuery(apiListSpecialties, [], { enabled: hasPermission(PERMISSION.ServicesManage) });
  const specialties = specialtiesQuery.data?.length
    ? specialtiesQuery.data.map((item) => ({ id: item.specialty_id, name: item.specialty_name }))
    : SPECIALTIES;
  const { run, isPending } = useAction();
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<StaffAccount | 'new' | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<StaffAccountListItem | null>(null);
  const debounced = useDebounced(search);

  const query = useApiQuery(
    () => apiSearchStaffAccounts({ role_code: role, search: debounced, page_number: page, page_size: 20 }),
    [role, debounced, page],
  );
  const items = query.data?.items ?? [];

  const openEdit = async (item: StaffAccountListItem) => {
    setError(null);
    const result = await run(`open-${item.account_id}`, () => apiGetStaffAccount(item.account_id));
    if (result.ok && result.data) {
      setForm(toForm(result.data));
      setEditing(result.data);
    } else {
      toast.error(result.error);
    }
  };

  const setProfile = (key: keyof StaffProfilePayload, value: string) => setForm({ ...form, profile: { ...form.profile, [key]: value } });
  const setDoctor = <K extends keyof Form['doctor']>(key: K, value: Form['doctor'][K]) => setForm({ ...form, doctor: { ...form.doctor, [key]: value } });

  const save = async () => {
    const isNew = editing === 'new';
    const isDoctor = form.role_code === 'doctor';
    if (!form.full_name.trim() || !form.email.trim()) {
      setError('Nhập họ tên và email đăng nhập.');
      return;
    }
    if (!form.profile.national_id.trim() || !form.profile.hired_date) {
      setError('Nhập CCCD và ngày vào làm.');
      return;
    }
    if (isNew && !PASSWORD_RULE.test(form.temporary_password)) {
      setError('Mật khẩu tạm phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và chữ số.');
      return;
    }
    setError(null);

    const result = await run('save', () =>
      isNew
        ? apiCreateStaffAccount({
            email: form.email.trim(),
            phone_number: nullIfBlank(form.phone_number),
            temporary_password: form.temporary_password,
            full_name: form.full_name.trim(),
            role_code: form.role_code,
            profile: profilePayload(form),
            doctor: isDoctor ? doctorPayload(form) : null,
          })
        : apiUpdateStaffAccount((editing as StaffAccount).account_id, {
            full_name: form.full_name.trim(),
            email: nullIfBlank(form.email),
            profile: profilePayload(form),
            doctor: isDoctor ? doctorPayload(form) : null,
          }),
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(isNew ? 'Đã tạo tài khoản. Nhân viên phải đổi mật khẩu ở lần đăng nhập đầu.' : 'Đã lưu tài khoản.');
    setEditing(null);
    query.reload();
  };

  const toggleStatus = async () => {
    if (!toggling) {
      return;
    }
    const target = toggling;
    const result = await run('toggle', () => apiSetStaffAccountStatus(target.account_id, !target.is_active));
    setToggling(null);
    if (result.ok) {
      toast.success(target.is_active ? `Đã khoá ${target.full_name}.` : `Đã mở khoá ${target.full_name}.`);
      query.reload();
    } else {
      toast.error(result.error);
    }
  };

  const resetPassword = async () => {
    if (!resetting) {
      return;
    }
    if (!PASSWORD_RULE.test(tempPassword)) {
      setResetError('Mật khẩu tạm phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và chữ số.');
      return;
    }
    const target = resetting;
    const result = await run('reset', () => apiResetStaffPassword(target.account_id, tempPassword));
    if (!result.ok) {
      setResetError(result.error);
      return;
    }
    setResetting(null);
    toast.success(`Đã đặt lại mật khẩu cho ${target.full_name}. Mọi phiên đăng nhập cũ đã bị đăng xuất.`);
    query.reload();
  };

  const isNew = editing === 'new';
  const isDoctor = form.role_code === 'doctor';

  return (
    <>
      <PageHeader
        title="Tài khoản nhân viên"
        description="Tạo tài khoản cho bác sĩ, dược sĩ, thu ngân và quản trị viên; khoá khi nhân viên nghỉ việc."
        actions={
          <Button
            variant="primary"
            icon={<UserPlus size={16} />}
            onClick={() => {
              setForm(emptyForm());
              setError(null);
              setEditing('new');
            }}
          >
            Tạo tài khoản
          </Button>
        }
      />

      <section className="st-panel">
        <div className="st-toolbar">
          <FilterTabs
            label="Vai trò"
            value={role}
            onChange={(value) => {
              setRole(value);
              setPage(1);
            }}
            options={[{ value: '', label: 'Tất cả' }, ...STAFF_ROLE_CODES.map((code) => ({ value: code, label: ROLE_LABEL[code] }))]}
          />
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Tên, email, số điện thoại…" />
        </div>
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Vai trò</th>
                <th>Vị trí / Chuyên khoa</th>
                <th>Hợp đồng</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <TableState
                columns={6}
                loading={query.loading}
                error={query.error}
                isEmpty={items.length === 0}
                onRetry={query.reload}
                emptyTitle="Không có tài khoản"
                emptyText="Thử đổi vai trò hoặc từ khoá tìm kiếm."
              />
              {items.map((item) => (
                <tr key={item.account_id} className="st-row-link" onClick={() => openEdit(item)}>
                  <td>
                    <div className="st-cell-main">{item.full_name}</div>
                    <div className="st-cell-sub">{[item.email, item.phone_number].filter(Boolean).join(' · ')}</div>
                  </td>
                  <td>{ROLE_LABEL[item.role_code] ?? item.role_name}</td>
                  <td>
                    <div>{item.specialty_name ?? item.work_position ?? '—'}</div>
                    {item.role_code === 'doctor' && (
                      <div className="st-cell-sub">{item.is_accepting_appointments ? 'Đang nhận lịch' : 'Tạm ngưng nhận lịch'}</div>
                    )}
                  </td>
                  <td>
                    <div>{textOf(EMPLOYMENT_TYPE_LABEL, item.employment_type)}</div>
                    <div className="st-cell-sub">
                      Từ {formatDate(item.hired_date)}
                      {item.contract_end_date ? ` đến ${formatDate(item.contract_end_date)}` : ''}
                    </div>
                  </td>
                  <td>
                    <div className="st-chip-row">
                      {item.is_active ? <Badge tone="success">Hoạt động</Badge> : <Badge tone="danger">Đã khoá</Badge>}
                      {item.must_change_password && <Badge tone="warning">Chưa đổi mật khẩu</Badge>}
                    </div>
                  </td>
                  <td className="st-num st-nowrap" onClick={(event) => event.stopPropagation()}>
                    {canContracts && (
                      <Link to={`/quan-tri/hop-dong?account=${item.account_id}`} className="st-btn st-btn-ghost st-btn-sm" title="Hợp đồng">
                        <FileText size={14} /> Hợp đồng
                      </Link>
                    )}
                    {item.account_id !== me?.account_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<KeyRound size={14} />}
                        onClick={() => {
                          setTempPassword('');
                          setResetError(null);
                          setResetting(item);
                        }}
                      >
                        Đặt lại mật khẩu
                      </Button>
                    )}
                    {item.account_id !== me?.account_id && (
                      <Button
                        size="sm"
                        variant={item.is_active ? 'danger' : 'secondary'}
                        icon={item.is_active ? <Lock size={14} /> : <LockOpen size={14} />}
                        onClick={() => setToggling(item)}
                      >
                        {item.is_active ? 'Khoá' : 'Mở khoá'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={query.data} onPage={setPage} />
      </section>

      <Sheet
        wide
        open={editing !== null}
        title={isNew ? 'Tạo tài khoản nhân viên' : `Sửa tài khoản — ${form.full_name}`}
        subtitle={isNew ? 'Nhân viên đăng nhập bằng email và bắt buộc đổi mật khẩu tạm ở lần đầu.' : 'Vai trò và mật khẩu không đổi ở đây.'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Huỷ
            </Button>
            <Button variant="primary" loading={isPending('save')} onClick={save}>
              {isNew ? 'Tạo tài khoản' : 'Lưu thay đổi'}
            </Button>
          </>
        }
      >
        {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}

        <div className="st-form-grid">
          <Field label="Họ và tên" required className="st-span-2">
            {(id) => <input id={id} className="st-input" maxLength={100} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />}
          </Field>
          <Field label="Vai trò" required>
            {(id) => (
              <select id={id} className="st-select" disabled={!isNew} value={form.role_code} onChange={(e) => setForm({ ...form, role_code: e.target.value })}>
                {STAFF_ROLE_CODES.map((code) => (
                  <option key={code} value={code}>
                    {ROLE_LABEL[code]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Email đăng nhập" required>
            {(id) => <input id={id} type="email" className="st-input" maxLength={150} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
          </Field>
          {isNew && (
            <>
              <Field label="Số điện thoại">
                {(id) => <input id={id} type="tel" className="st-input" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />}
              </Field>
              <Field label="Mật khẩu tạm" required hint="≥ 8 ký tự, có chữ hoa, chữ thường và chữ số.">
                {(id) => (
                  <input id={id} type="text" autoComplete="new-password" className="st-input st-mono" value={form.temporary_password} onChange={(e) => setForm({ ...form, temporary_password: e.target.value })} />
                )}
              </Field>
            </>
          )}
        </div>

        <div className="st-form-section">
          <div className="st-form-section-title">Hồ sơ nhân sự</div>
          <div className="st-form-grid st-form-grid-3">
            <Field label="CCCD" required>
              {(id) => <input id={id} className="st-input" maxLength={20} value={form.profile.national_id} onChange={(e) => setProfile('national_id', e.target.value)} />}
            </Field>
            <Field label="Ngày sinh">
              {(id) => <input id={id} type="date" className="st-input" value={form.profile.date_of_birth} onChange={(e) => setProfile('date_of_birth', e.target.value)} />}
            </Field>
            <Field label="Giới tính">
              {(id) => (
                <select id={id} className="st-select" value={form.profile.gender} onChange={(e) => setProfile('gender', e.target.value)}>
                  <option value="">—</option>
                  {Object.entries(GENDER_LABEL).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Ngày vào làm" required>
              {(id) => <input id={id} type="date" className="st-input" value={form.profile.hired_date} onChange={(e) => setProfile('hired_date', e.target.value)} />}
            </Field>
            <Field label="Hết hạn hợp đồng">
              {(id) => <input id={id} type="date" className="st-input" value={form.profile.contract_end_date} onChange={(e) => setProfile('contract_end_date', e.target.value)} />}
            </Field>
            <Field label="Vị trí công việc">
              {(id) => <input id={id} className="st-input" value={form.profile.work_position} onChange={(e) => setProfile('work_position', e.target.value)} />}
            </Field>
            <Field label="Điện thoại liên hệ">
              {(id) => <input id={id} type="tel" className="st-input" value={form.profile.contact_phone} onChange={(e) => setProfile('contact_phone', e.target.value)} />}
            </Field>
            <Field label="Email liên hệ">
              {(id) => <input id={id} type="email" className="st-input" value={form.profile.contact_email} onChange={(e) => setProfile('contact_email', e.target.value)} />}
            </Field>
            <Field label="Người ký hợp đồng">
              {(id) => <input id={id} className="st-input" value={form.profile.contract_signed_by} onChange={(e) => setProfile('contract_signed_by', e.target.value)} />}
            </Field>
            <Field label="Địa chỉ" className="st-span-all">
              {(id) => <input id={id} className="st-input" value={form.profile.address} onChange={(e) => setProfile('address', e.target.value)} />}
            </Field>
            <Field label="Ghi chú" className="st-span-all">
              {(id) => <textarea id={id} className="st-textarea" value={form.profile.notes} onChange={(e) => setProfile('notes', e.target.value)} />}
            </Field>
          </div>
        </div>

        {isDoctor && (
          <div className="st-form-section">
            <div className="st-form-section-title">Hồ sơ bác sĩ</div>
            <div className="st-form-grid st-form-grid-3">
              <Field label="Chuyên khoa chính" required>
                {(id) => (
                  <select
                    id={id}
                    className="st-select"
                    value={form.doctor.specialty_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        doctor: {
                          ...form.doctor,
                          specialty_id: e.target.value,
                          additional_specialty_ids: form.doctor.additional_specialty_ids.filter((sid) => sid !== Number(e.target.value)),
                        },
                      })
                    }
                  >
                    {specialties.map((specialty) => (
                      <option key={specialty.id} value={specialty.id}>
                        {specialty.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <div className="st-field st-span-2">
                <span className="st-label">Chuyên khoa phụ</span>
                <div className="st-chip-row" style={{ minHeight: 36, alignItems: 'center' }}>
                  {specialties.filter((s) => String(s.id) !== form.doctor.specialty_id).map((specialty) => (
                    <label key={specialty.id} className="st-check">
                      <input
                        type="checkbox"
                        checked={form.doctor.additional_specialty_ids.includes(specialty.id)}
                        onChange={(e) =>
                          setDoctor(
                            'additional_specialty_ids',
                            e.target.checked
                              ? [...form.doctor.additional_specialty_ids, specialty.id]
                              : form.doctor.additional_specialty_ids.filter((sid) => sid !== specialty.id),
                          )
                        }
                      />
                      {specialty.name}
                    </label>
                  ))}
                </div>
              </div>
              <Field label="Học vị">
                {(id) => <input id={id} className="st-input" placeholder="ThS.BS" value={form.doctor.degree} onChange={(e) => setDoctor('degree', e.target.value)} />}
              </Field>
              <Field label="Số năm kinh nghiệm" required>
                {(id) => <input id={id} type="number" min={0} className="st-input" value={form.doctor.years_of_experience} onChange={(e) => setDoctor('years_of_experience', e.target.value)} />}
              </Field>
              <Field label="Phí khám (₫)" hint={form.doctor.consultation_fee ? formatMoney(Number(form.doctor.consultation_fee)) : 'Để trống dùng mặc định'}>
                {(id) => <input id={id} type="number" min={0} className="st-input" value={form.doctor.consultation_fee} onChange={(e) => setDoctor('consultation_fee', e.target.value)} />}
              </Field>
              <Field label="Số chứng chỉ hành nghề">
                {(id) => <input id={id} className="st-input" value={form.doctor.license_number} onChange={(e) => setDoctor('license_number', e.target.value)} />}
              </Field>
              <Field label="Hạn chứng chỉ">
                {(id) => <input id={id} type="date" className="st-input" value={form.doctor.license_expiry_date} onChange={(e) => setDoctor('license_expiry_date', e.target.value)} />}
              </Field>
              <Field label="Loại hợp đồng" required>
                {(id) => (
                  <select id={id} className="st-select" value={form.doctor.employment_type} onChange={(e) => setDoctor('employment_type', e.target.value)}>
                    {Object.entries(EMPLOYMENT_TYPE_LABEL).map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Giới thiệu" className="st-span-all">
                {(id) => <textarea id={id} className="st-textarea" value={form.doctor.biography} onChange={(e) => setDoctor('biography', e.target.value)} />}
              </Field>
              <label className="st-check st-span-all">
                <input type="checkbox" checked={form.doctor.is_accepting_appointments} onChange={(e) => setDoctor('is_accepting_appointments', e.target.checked)} />
                Đang nhận lịch hẹn
              </label>
            </div>
          </div>
        )}
      </Sheet>

      <ConfirmDialog
        open={resetting !== null}
        title={`Đặt lại mật khẩu cho ${resetting?.full_name ?? ''}?`}
        text="Nhân viên bị đăng xuất khỏi mọi thiết bị và phải đổi mật khẩu tạm này ở lần đăng nhập tới. Giao mật khẩu trực tiếp cho người đó."
        confirmLabel="Đặt lại mật khẩu"
        tone="danger-solid"
        loading={isPending('reset')}
        onConfirm={resetPassword}
        onClose={() => setResetting(null)}
      >
        <div style={{ marginTop: '0.9rem' }}>
          {resetError && <Alert tone="danger" className="st-alert-gap">{resetError}</Alert>}
          <Field label="Mật khẩu tạm" required hint="≥ 8 ký tự, có chữ hoa, chữ thường và chữ số.">
            {(id) => (
              <input
                id={id}
                type="text"
                autoComplete="new-password"
                className="st-input st-mono"
                value={tempPassword}
                maxLength={100}
                onChange={(e) => {
                  setTempPassword(e.target.value);
                  setResetError(null);
                }}
              />
            )}
          </Field>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={toggling !== null}
        title={toggling?.is_active ? `Khoá tài khoản ${toggling?.full_name}?` : `Mở khoá ${toggling?.full_name}?`}
        text={
          toggling?.is_active
            ? 'Nhân viên sẽ bị đăng xuất và không đăng nhập được nữa cho tới khi được mở khoá.'
            : 'Nhân viên đăng nhập lại được bằng mật khẩu hiện có.'
        }
        confirmLabel={toggling?.is_active ? 'Khoá tài khoản' : 'Mở khoá'}
        tone={toggling?.is_active ? 'danger-solid' : 'primary'}
        loading={isPending('toggle')}
        onConfirm={toggleStatus}
        onClose={() => setToggling(null)}
      />
    </>
  );
};

export default StaffAccountsPage;
