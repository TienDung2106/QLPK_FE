import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilePlus2, Pencil, Trash2 } from 'lucide-react';
import {
  apiCreateContract,
  apiDeleteContract,
  apiSearchContracts,
  apiSearchStaffAccounts,
  apiUpdateContract,
} from '../../api/functions/admin';
import type { StaffContract, StaffContractPayload } from '../../api/staffTypes';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, formatMoney, nullIfBlank, todayIso } from '../format';
import { CONTRACT_STATUS, CONTRACT_TYPE_LABEL, labelOf, ROLE_LABEL, textOf } from '../labels';
import { useToast } from '../components/toastContext';
import {
  Alert,
  Button,
  ConfirmDialog,
  Field,
  FilterTabs,
  PageHeader,
  Pagination,
  Sheet,
  StatusBadge,
  TableState,
} from '../components/ui';

const STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'active', label: 'Đang hiệu lực' },
  { value: 'expired', label: 'Đã hết hạn' },
  { value: 'terminated', label: 'Đã chấm dứt' },
];

const EXPIRY_TABS = [
  { value: '', label: 'Mọi thời hạn' },
  { value: '30', label: 'Hết hạn trong 30 ngày' },
  { value: '90', label: 'Trong 90 ngày' },
];

interface Form {
  account_id: string;
  contract_number: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  base_salary: string;
  status: string;
  notes: string;
}

const emptyForm = (accountId = ''): Form => ({
  account_id: accountId,
  contract_number: '',
  contract_type: 'fixed_term',
  start_date: todayIso(),
  end_date: '',
  base_salary: '',
  status: 'active',
  notes: '',
});

const toForm = (row: StaffContract): Form => ({
  account_id: String(row.account_id),
  contract_number: row.contract_number,
  contract_type: row.contract_type,
  start_date: row.start_date,
  end_date: row.end_date ?? '',
  base_salary: String(row.base_salary),
  status: row.status,
  notes: row.notes ?? '',
});

function toPayload(form: Form): StaffContractPayload | string {
  if (!form.account_id) {
    return 'Chọn nhân viên.';
  }
  if (!form.contract_number.trim()) {
    return 'Nhập số hợp đồng.';
  }
  if (!form.start_date) {
    return 'Nhập ngày bắt đầu.';
  }
  const indefinite = form.contract_type === 'indefinite';
  if (!indefinite && !form.end_date) {
    return 'Hợp đồng có thời hạn, thử việc hoặc thời vụ cần ngày kết thúc.';
  }
  if (!indefinite && form.end_date < form.start_date) {
    return 'Ngày kết thúc phải sau ngày bắt đầu.';
  }
  const salary = Number(form.base_salary);
  if (form.base_salary === '' || !(salary >= 0)) {
    return 'Nhập lương cơ bản (số không âm).';
  }
  return {
    account_id: Number(form.account_id),
    contract_number: form.contract_number.trim(),
    contract_type: form.contract_type,
    start_date: form.start_date,
    end_date: indefinite ? null : form.end_date,
    base_salary: salary,
    status: form.status,
    notes: nullIfBlank(form.notes),
  };
}

const DaysLeft = ({ row }: { row: StaffContract }) => {
  if (row.days_until_expiry === null) {
    return <span className="st-muted">Không thời hạn</span>;
  }
  if (row.status !== 'active') {
    return <span className="st-muted">—</span>;
  }
  const days = row.days_until_expiry;
  if (days < 0) {
    return <span className="st-days-left danger">Quá hạn {-days} ngày</span>;
  }
  return <span className={`st-days-left ${days <= 30 ? 'warning' : ''}`}>Còn {days} ngày</span>;
};

/** Hợp đồng lao động của nhân viên, hợp đồng sắp hết hạn lên đầu. */
const ContractsPage = () => {
  const toast = useToast();
  const { run, isPending } = useAction();
  const [params, setParams] = useSearchParams();
  const accountFilter = params.get('account') ? Number(params.get('account')) : undefined;
  const [status, setStatus] = useState('');
  const [expiring, setExpiring] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<StaffContract | 'new' | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<StaffContract | null>(null);

  const query = useApiQuery(
    () =>
      apiSearchContracts({
        account_id: accountFilter,
        status: status || undefined,
        expiring_within_days: expiring ? Number(expiring) : undefined,
        page_number: page,
        page_size: 20,
      }),
    [accountFilter, status, expiring, page],
  );
  const staff = useApiQuery(() => apiSearchStaffAccounts({ page_size: 100 }), []);
  const items = query.data?.items ?? [];
  const staffName = accountFilter ? staff.data?.items.find((item) => item.account_id === accountFilter)?.full_name : undefined;

  const open = (row: StaffContract | 'new') => {
    setEditing(row);
    setForm(row === 'new' ? emptyForm(accountFilter ? String(accountFilter) : '') : toForm(row));
    setError(null);
  };

  const save = async () => {
    const payload = toPayload(form);
    if (typeof payload === 'string') {
      setError(payload);
      return;
    }
    const target = editing;
    const result = await run('save', () =>
      target === 'new' || target === null ? apiCreateContract(payload) : apiUpdateContract(target.staff_contract_id, payload),
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(null);
    toast.success(target === 'new' ? 'Đã lưu hợp đồng.' : 'Đã cập nhật hợp đồng.');
    query.reload();
  };

  const remove = async () => {
    if (!deleting) {
      return;
    }
    const result = await run('delete', () => apiDeleteContract(deleting.staff_contract_id));
    setDeleting(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Đã xoá hợp đồng.');
    query.reload();
  };

  const set = (key: keyof Form) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const indefinite = form.contract_type === 'indefinite';

  return (
    <>
      <PageHeader
        title="Hợp đồng nhân viên"
        description={
          accountFilter
            ? `Các hợp đồng của ${staffName ?? `tài khoản #${accountFilter}`}.`
            : 'Mọi hợp đồng lao động, hợp đồng sắp hết hạn trước. Hợp đồng đang hiệu lực cập nhật ngày hết hạn trên hồ sơ nhân viên.'
        }
        backTo={accountFilter ? '/quan-tri/tai-khoan' : undefined}
        backLabel="Tài khoản nhân viên"
        actions={
          <Button variant="primary" icon={<FilePlus2 size={16} />} onClick={() => open('new')}>
            Thêm hợp đồng
          </Button>
        }
      />

      <section className="st-panel">
        <div className="st-toolbar">
          <FilterTabs
            label="Trạng thái"
            options={STATUS_TABS}
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
          <FilterTabs
            label="Thời hạn"
            options={EXPIRY_TABS}
            value={expiring}
            onChange={(value) => {
              setExpiring(value);
              setPage(1);
            }}
          />
          {accountFilter && (
            <Button size="sm" variant="ghost" onClick={() => setParams({})}>
              Xem mọi nhân viên
            </Button>
          )}
        </div>
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Số hợp đồng</th>
                <th>Thời hạn</th>
                <th className="st-num">Lương cơ bản</th>
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
                emptyTitle="Không có hợp đồng"
                emptyText={expiring ? 'Không hợp đồng nào sắp hết hạn trong khoảng này.' : 'Thêm hợp đồng đầu tiên bằng nút phía trên.'}
              />
              {items.map((row) => (
                <tr key={row.staff_contract_id} className="st-row-link" onClick={() => open(row)}>
                  <td>
                    <div className="st-cell-main">{row.staff_full_name}</div>
                    <div className="st-cell-sub">{ROLE_LABEL[row.role_code] ?? row.role_code}</div>
                  </td>
                  <td>
                    <div className="st-mono">{row.contract_number}</div>
                    <div className="st-cell-sub">{textOf(CONTRACT_TYPE_LABEL, row.contract_type)}</div>
                  </td>
                  <td className="st-nowrap">
                    <div>
                      {formatDate(row.start_date)} → {row.end_date ? formatDate(row.end_date) : '…'}
                    </div>
                    <div className="st-cell-sub">
                      <DaysLeft row={row} />
                    </div>
                  </td>
                  <td className="st-num">{formatMoney(row.base_salary)}</td>
                  <td>
                    <StatusBadge value={labelOf(CONTRACT_STATUS, row.status)} />
                  </td>
                  <td className="st-num st-nowrap" onClick={(event) => event.stopPropagation()}>
                    <Button size="sm" variant="ghost" icon={<Pencil size={13} />} onClick={() => open(row)}>
                      Sửa
                    </Button>
                    <Button size="sm" variant="ghost" iconOnly aria-label="Xoá hợp đồng" icon={<Trash2 size={14} />} onClick={() => setDeleting(row)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={query.data} onPage={setPage} />
      </section>

      <Sheet
        open={editing !== null}
        title={editing === 'new' ? 'Thêm hợp đồng' : `Hợp đồng ${form.contract_number}`}
        subtitle="Hợp đồng đã chạy thì đổi trạng thái sang hết hạn/chấm dứt thay vì xoá, để giữ lịch sử."
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
          <Field label="Nhân viên" required className="st-span-2">
            {(id) => (
              <select id={id} className="st-select" value={form.account_id} disabled={editing !== 'new'} onChange={set('account_id')}>
                <option value="">{staff.loading ? 'Đang tải…' : 'Chọn nhân viên'}</option>
                {(staff.data?.items ?? []).map((item) => (
                  <option key={item.account_id} value={item.account_id}>
                    {item.full_name} — {ROLE_LABEL[item.role_code] ?? item.role_code}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Số hợp đồng" required>
            {(id) => <input id={id} className="st-input st-mono" maxLength={50} value={form.contract_number} onChange={set('contract_number')} />}
          </Field>
          <Field label="Loại hợp đồng" required>
            {(id) => (
              <select
                id={id}
                className="st-select"
                value={form.contract_type}
                onChange={(e) => setForm({ ...form, contract_type: e.target.value, end_date: e.target.value === 'indefinite' ? '' : form.end_date })}
              >
                {Object.entries(CONTRACT_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Ngày bắt đầu" required>
            {(id) => <input id={id} type="date" className="st-input" value={form.start_date} onChange={set('start_date')} />}
          </Field>
          <Field label="Ngày kết thúc" required={!indefinite} hint={indefinite ? 'Hợp đồng không thời hạn không có ngày kết thúc.' : undefined}>
            {(id) => <input id={id} type="date" className="st-input" disabled={indefinite} min={form.start_date} value={form.end_date} onChange={set('end_date')} />}
          </Field>
          <Field label="Lương cơ bản (₫)" required hint={form.base_salary ? formatMoney(Number(form.base_salary)) : undefined}>
            {(id) => <input id={id} type="number" min={0} className="st-input" value={form.base_salary} onChange={set('base_salary')} />}
          </Field>
          <Field label="Trạng thái" required>
            {(id) => (
              <select id={id} className="st-select" value={form.status} onChange={set('status')}>
                {Object.entries(CONTRACT_STATUS).map(([value, item]) => (
                  <option key={value} value={value}>
                    {item.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Ghi chú" className="st-span-2">
            {(id) => <textarea id={id} className="st-textarea" value={form.notes} onChange={set('notes')} />}
          </Field>
        </div>
      </Sheet>

      <ConfirmDialog
        open={deleting !== null}
        title="Xoá hợp đồng?"
        text="Chỉ xoá hợp đồng nhập nhầm. Hợp đồng đã thực sự có hiệu lực nên được chuyển sang “Đã hết hạn” hoặc “Đã chấm dứt” để giữ lịch sử."
        confirmLabel="Xoá hợp đồng"
        tone="danger-solid"
        loading={isPending('delete')}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
};

export default ContractsPage;
