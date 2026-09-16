import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  apiCreateAdminService,
  apiSearchAdminServices,
  apiSetAdminServiceStatus,
  apiUpdateAdminService,
} from '../../api/functions/admin';
import type { AdminService } from '../../api/staffTypes';
import { useAction, useApiQuery, useDebounced } from '../hooks';
import { formatMoney, nullIfBlank } from '../format';
import { useToast } from '../components/toastContext';
import { Alert, Badge, Button, Field, FilterTabs, PageHeader, Pagination, SearchInput, Sheet, TableState } from '../components/ui';

const emptyForm = {
  service_name: '',
  service_group: '',
  description: '',
  price: '',
  duration_minutes: '30',
  image_url: '',
  is_active: true,
};

type Form = typeof emptyForm;

const ServicesAdminPage = () => {
  const toast = useToast();
  const { run, isPending, pending } = useAction();
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminService | 'new' | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounced(search);

  const query = useApiQuery(
    () =>
      apiSearchAdminServices({
        search: debounced,
        is_active: active === '' ? undefined : active === 'true',
        page_number: page,
        page_size: 20,
      }),
    [debounced, active, page],
  );
  const items = query.data?.items ?? [];

  const open = (target: AdminService | 'new') => {
    setError(null);
    setEditing(target);
    setForm(
      target === 'new'
        ? emptyForm
        : {
            service_name: target.service_name,
            service_group: target.service_group ?? '',
            description: target.description ?? '',
            price: String(target.price),
            duration_minutes: String(target.duration_minutes),
            image_url: target.image_url ?? '',
            is_active: target.is_active,
          },
    );
  };

  const save = async () => {
    const price = Number(form.price);
    const duration = Number(form.duration_minutes);
    if (!form.service_name.trim() || form.price === '' || !(price >= 0) || !(duration > 0)) {
      setError('Nhập tên dịch vụ, giá không âm và thời lượng lớn hơn 0.');
      return;
    }
    const payload = {
      service_name: form.service_name.trim(),
      service_group: nullIfBlank(form.service_group),
      description: nullIfBlank(form.description),
      price,
      duration_minutes: duration,
      image_url: nullIfBlank(form.image_url),
      is_active: form.is_active,
    };
    const result = await run('save', () =>
      editing === 'new' || editing === null ? apiCreateAdminService(payload) : apiUpdateAdminService(editing.service_id, payload),
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(editing === 'new' ? 'Đã thêm dịch vụ.' : 'Đã lưu dịch vụ.');
    setEditing(null);
    query.reload();
  };

  const toggle = async (service: AdminService) => {
    const result = await run(`toggle-${service.service_id}`, () => apiSetAdminServiceStatus(service.service_id, !service.is_active));
    if (result.ok) {
      toast.success(service.is_active ? `Đã ngừng ${service.service_name}.` : `Đã mở lại ${service.service_name}.`);
      query.reload();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <PageHeader
        title="Dịch vụ"
        description="Danh mục và bảng giá. Giá ở đây là giá tính vào lịch hẹn và hoá đơn mới."
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => open('new')}>
            Thêm dịch vụ
          </Button>
        }
      />

      <section className="st-panel">
        <div className="st-toolbar">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Tên hoặc nhóm dịch vụ…" />
          <FilterTabs
            label="Trạng thái"
            value={active}
            onChange={(value) => { setActive(value); setPage(1); }}
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'true', label: 'Đang cung cấp' },
              { value: 'false', label: 'Đã ngừng' },
            ]}
          />
        </div>
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Dịch vụ</th>
                <th>Nhóm</th>
                <th className="st-num">Giá</th>
                <th className="st-num">Thời lượng</th>
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
                emptyTitle="Chưa có dịch vụ"
                emptyText="Thêm dịch vụ để bệnh nhân và quầy chọn khi đặt lịch."
              />
              {items.map((service) => (
                <tr key={service.service_id} className="st-row-link" onClick={() => open(service)}>
                  <td>
                    <div className="st-cell-main">{service.service_name}</div>
                    {service.description && (
                      <div className="st-cell-sub" style={{ maxWidth: '52ch', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {service.description}
                      </div>
                    )}
                  </td>
                  <td>{service.service_group ?? '—'}</td>
                  <td className="st-num st-strong">{formatMoney(service.price)}</td>
                  <td className="st-num">{service.duration_minutes} phút</td>
                  <td>{service.is_active ? <Badge tone="success">Đang cung cấp</Badge> : <Badge>Đã ngừng</Badge>}</td>
                  <td className="st-num" onClick={(event) => event.stopPropagation()}>
                    <Button size="sm" variant={service.is_active ? 'ghost' : 'secondary'} loading={pending === `toggle-${service.service_id}`} onClick={() => toggle(service)}>
                      {service.is_active ? 'Ngừng' : 'Mở lại'}
                    </Button>
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
        title={editing === 'new' ? 'Thêm dịch vụ' : 'Sửa dịch vụ'}
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
          <Field label="Tên dịch vụ" required className="st-span-2">
            {(id) => <input id={id} className="st-input" value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} />}
          </Field>
          <Field label="Nhóm dịch vụ">
            {(id) => <input id={id} className="st-input" value={form.service_group} onChange={(e) => setForm({ ...form, service_group: e.target.value })} />}
          </Field>
          <Field label="Thời lượng (phút)" required>
            {(id) => <input id={id} type="number" min={1} className="st-input" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />}
          </Field>
          <Field label="Giá (₫)" required hint={form.price ? formatMoney(Number(form.price)) : undefined} className="st-span-2">
            {(id) => <input id={id} type="number" min={0} className="st-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />}
          </Field>
          <Field label="Mô tả" className="st-span-2">
            {(id) => <textarea id={id} className="st-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}
          </Field>
          <Field label="Ảnh (URL)" className="st-span-2">
            {(id) => <input id={id} type="url" className="st-input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />}
          </Field>
          <label className="st-check st-span-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Đang cung cấp
          </label>
        </div>
      </Sheet>
    </>
  );
};

export default ServicesAdminPage;
