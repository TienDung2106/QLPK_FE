import { useState } from 'react';
import { Plus } from 'lucide-react';
import { apiCreateSupplier, apiSearchSuppliers, apiUpdateSupplier } from '../../api/functions/pharmacy';
import type { Supplier, SupplierPayload } from '../../api/staffTypes';
import { useAction, useApiQuery, useDebounced } from '../hooks';
import { formatDateTime, nullIfBlank } from '../format';
import { useToast } from '../components/toastContext';
import {
  Alert,
  Badge,
  Button,
  Field,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  Sheet,
  TableState,
} from '../components/ui';

const emptyForm = {
  supplier_name: '',
  contact_person: '',
  phone_number: '',
  email: '',
  address: '',
  notes: '',
  is_active: true,
};

type Form = typeof emptyForm;

const toForm = (supplier: Supplier): Form => ({
  supplier_name: supplier.supplier_name,
  contact_person: supplier.contact_person ?? '',
  phone_number: supplier.phone_number ?? '',
  email: supplier.email ?? '',
  address: supplier.address ?? '',
  notes: supplier.notes ?? '',
  is_active: supplier.is_active,
});

const toPayload = (form: Form): SupplierPayload => ({
  supplier_name: form.supplier_name.trim(),
  contact_person: nullIfBlank(form.contact_person),
  phone_number: nullIfBlank(form.phone_number),
  email: nullIfBlank(form.email),
  address: nullIfBlank(form.address),
  notes: nullIfBlank(form.notes),
  is_active: form.is_active,
});

const SuppliersPage = () => {
  const toast = useToast();
  const { run, isPending } = useAction();
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('true');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Supplier | 'new' | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounced(search);

  const query = useApiQuery(
    () =>
      apiSearchSuppliers({
        search: debounced,
        is_active: active === '' ? undefined : active === 'true',
        page_number: page,
        page_size: 20,
      }),
    [debounced, active, page],
  );

  const open = (target: Supplier | 'new') => {
    setEditing(target);
    setForm(target === 'new' ? emptyForm : toForm(target));
    setError(null);
  };

  const save = async () => {
    if (!form.supplier_name.trim()) {
      setError('Nhập tên nhà cung cấp.');
      return;
    }
    const payload = toPayload(form);
    const result = await run('save', () =>
      editing === 'new' || editing === null ? apiCreateSupplier(payload) : apiUpdateSupplier(editing.supplier_id, payload),
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(editing === 'new' ? 'Đã thêm nhà cung cấp.' : 'Đã lưu nhà cung cấp.');
    setEditing(null);
    query.reload();
  };

  const items = query.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Nhà cung cấp"
        description="Nơi nhập thuốc, gắn vào từng lô khi nhập kho."
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => open('new')}>
            Thêm nhà cung cấp
          </Button>
        }
      />

      <section className="st-panel">
        <div className="st-toolbar">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Tên, người liên hệ, điện thoại…"
          />
          <FilterTabs
            label="Trạng thái"
            value={active}
            onChange={(value) => {
              setActive(value);
              setPage(1);
            }}
            options={[
              { value: 'true', label: 'Đang hợp tác' },
              { value: 'false', label: 'Ngừng hợp tác' },
              { value: '', label: 'Tất cả' },
            ]}
          />
        </div>
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Nhà cung cấp</th>
                <th>Liên hệ</th>
                <th>Địa chỉ</th>
                <th>Cập nhật</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                columns={5}
                loading={query.loading}
                error={query.error}
                isEmpty={items.length === 0}
                onRetry={query.reload}
                emptyTitle="Chưa có nhà cung cấp"
                emptyText="Thêm nhà cung cấp để ghi nhận nguồn gốc từng lô thuốc."
              />
              {items.map((supplier) => (
                <tr key={supplier.supplier_id} className="st-row-link" onClick={() => open(supplier)}>
                  <td>
                    <div className="st-cell-main">{supplier.supplier_name}</div>
                    {supplier.notes && <div className="st-cell-sub">{supplier.notes}</div>}
                  </td>
                  <td>
                    <div>{supplier.contact_person ?? '—'}</div>
                    <div className="st-cell-sub">{[supplier.phone_number, supplier.email].filter(Boolean).join(' · ') || '—'}</div>
                  </td>
                  <td>{supplier.address ?? '—'}</td>
                  <td className="st-nowrap">{formatDateTime(supplier.updated_at)}</td>
                  <td>{supplier.is_active ? <Badge tone="success">Đang hợp tác</Badge> : <Badge>Ngừng</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={query.data} onPage={setPage} />
      </section>

      <Sheet
        open={editing !== null}
        title={editing === 'new' ? 'Thêm nhà cung cấp' : 'Sửa nhà cung cấp'}
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
          <Field label="Tên nhà cung cấp" required className="st-span-2">
            {(id) => <input id={id} className="st-input" maxLength={200} value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} />}
          </Field>
          <Field label="Người liên hệ">
            {(id) => <input id={id} className="st-input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />}
          </Field>
          <Field label="Điện thoại">
            {(id) => <input id={id} className="st-input" type="tel" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />}
          </Field>
          <Field label="Email" className="st-span-2">
            {(id) => <input id={id} className="st-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
          </Field>
          <Field label="Địa chỉ" className="st-span-2">
            {(id) => <input id={id} className="st-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />}
          </Field>
          <Field label="Ghi chú" className="st-span-2">
            {(id) => <textarea id={id} className="st-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />}
          </Field>
          <label className="st-check st-span-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Đang hợp tác
          </label>
        </div>
      </Sheet>
    </>
  );
};

export default SuppliersPage;
