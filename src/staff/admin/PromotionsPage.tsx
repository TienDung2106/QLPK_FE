import { useState } from 'react';
import { Plus } from 'lucide-react';
import { apiCreatePromotion, apiSearchPromotions, apiSetPromotionStatus, apiUpdatePromotion } from '../../api/functions/admin';
import type { Promotion, PromotionPayload } from '../../api/staffTypes';
import { useAction, useApiQuery, useDebounced } from '../hooks';
import { formatDateTime, formatMoney, formatPercent, nullIfBlank } from '../format';
import { DISCOUNT_TYPE_LABEL } from '../labels';
import { useToast } from '../components/toastContext';
import { Alert, Badge, Button, Field, FilterTabs, PageHeader, Pagination, SearchInput, Sheet, TableState } from '../components/ui';

interface Form {
  promotion_code: string;
  description: string;
  discount_type: string;
  discount_value: string;
  max_discount_amount: string;
  min_booking_amount: string;
  usage_limit_total: string;
  usage_limit_per_patient: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

/** datetime-local ↔ ISO: ô nhập làm việc theo giờ máy, backend nhận thời điểm có múi giờ. */
const toLocalInput = (iso: string | null) => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

const emptyForm = (): Form => ({
  promotion_code: '',
  description: '',
  discount_type: 'percent',
  discount_value: '',
  max_discount_amount: '',
  min_booking_amount: '0',
  usage_limit_total: '',
  usage_limit_per_patient: '1',
  valid_from: toLocalInput(new Date().toISOString()),
  valid_until: '',
  is_active: true,
});

const toForm = (promotion: Promotion): Form => ({
  promotion_code: promotion.promotion_code,
  description: promotion.description ?? '',
  discount_type: promotion.discount_type,
  discount_value: String(promotion.discount_value),
  max_discount_amount: promotion.max_discount_amount === null ? '' : String(promotion.max_discount_amount),
  min_booking_amount: String(promotion.min_booking_amount),
  usage_limit_total: promotion.usage_limit_total === null ? '' : String(promotion.usage_limit_total),
  usage_limit_per_patient: String(promotion.usage_limit_per_patient),
  valid_from: toLocalInput(promotion.valid_from),
  valid_until: toLocalInput(promotion.valid_until),
  is_active: promotion.is_active,
});

function toPayload(form: Form): PromotionPayload | string {
  const value = Number(form.discount_value);
  if (!form.promotion_code.trim()) {
    return 'Nhập mã khuyến mãi.';
  }
  if (!(value > 0) || (form.discount_type === 'percent' && value > 100)) {
    return form.discount_type === 'percent' ? 'Phần trăm giảm phải từ 0 đến 100.' : 'Số tiền giảm phải lớn hơn 0.';
  }
  if (!form.valid_from) {
    return 'Chọn thời điểm bắt đầu.';
  }
  if (form.valid_until && form.valid_until <= form.valid_from) {
    return 'Thời điểm kết thúc phải sau thời điểm bắt đầu.';
  }
  return {
    promotion_code: form.promotion_code.trim().toUpperCase(),
    description: nullIfBlank(form.description),
    discount_type: form.discount_type,
    discount_value: value,
    max_discount_amount: form.max_discount_amount === '' ? null : Number(form.max_discount_amount),
    min_booking_amount: Number(form.min_booking_amount) || 0,
    usage_limit_total: form.usage_limit_total === '' ? null : Number(form.usage_limit_total),
    usage_limit_per_patient: Number(form.usage_limit_per_patient) || 1,
    valid_from: fromLocalInput(form.valid_from)!,
    valid_until: fromLocalInput(form.valid_until),
    is_active: form.is_active,
  };
}

const PromotionsPage = () => {
  const toast = useToast();
  const { run, isPending, pending } = useAction();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Promotion | 'new' | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounced(search);

  const query = useApiQuery(
    () =>
      apiSearchPromotions({
        search: debounced,
        is_active: filter === 'inactive' ? false : filter === 'active' ? true : undefined,
        currently_valid_only: filter === 'valid' || undefined,
        page_number: page,
        page_size: 20,
      }),
    [debounced, filter, page],
  );
  const items = query.data?.items ?? [];

  const open = (target: Promotion | 'new') => {
    setError(null);
    setEditing(target);
    setForm(target === 'new' ? emptyForm() : toForm(target));
  };

  const save = async () => {
    const payload = toPayload(form);
    if (typeof payload === 'string') {
      setError(payload);
      return;
    }
    const result = await run('save', () =>
      editing === 'new' || editing === null ? apiCreatePromotion(payload) : apiUpdatePromotion(editing.promotion_id, payload),
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(editing === 'new' ? 'Đã tạo khuyến mãi.' : 'Đã lưu khuyến mãi.');
    setEditing(null);
    query.reload();
  };

  const toggle = async (promotion: Promotion) => {
    const result = await run(`toggle-${promotion.promotion_id}`, () => apiSetPromotionStatus(promotion.promotion_id, !promotion.is_active));
    if (result.ok) {
      toast.success(promotion.is_active ? `Đã tắt ${promotion.promotion_code}.` : `Đã bật ${promotion.promotion_code}.`);
      query.reload();
    } else {
      toast.error(result.error);
    }
  };

  const describeValue = (promotion: Promotion) =>
    promotion.discount_type === 'percent'
      ? `${formatPercent(promotion.discount_value)}${promotion.max_discount_amount ? ` (tối đa ${formatMoney(promotion.max_discount_amount)})` : ''}`
      : formatMoney(promotion.discount_value);

  return (
    <>
      <PageHeader
        title="Khuyến mãi"
        description="Mã giảm giá công khai cho bệnh nhân và quầy. Phần trăm luôn lấy từ mã, không nhập tay được."
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => open('new')}>
            Tạo khuyến mãi
          </Button>
        }
      />

      <section className="st-panel">
        <div className="st-toolbar">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Mã hoặc mô tả…" />
          <FilterTabs
            label="Lọc"
            value={filter}
            onChange={(value) => { setFilter(value); setPage(1); }}
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'valid', label: 'Đang hiệu lực' },
              { value: 'active', label: 'Đang bật' },
              { value: 'inactive', label: 'Đã tắt' },
            ]}
          />
        </div>
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Mức giảm</th>
                <th>Điều kiện</th>
                <th className="st-num">Đã dùng</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <TableState
                columns={7}
                loading={query.loading}
                error={query.error}
                isEmpty={items.length === 0}
                onRetry={query.reload}
                emptyTitle="Chưa có khuyến mãi"
                emptyText="Tạo mã để bệnh nhân nhập khi đặt lịch."
              />
              {items.map((promotion) => (
                <tr key={promotion.promotion_id} className="st-row-link" onClick={() => open(promotion)}>
                  <td>
                    <div className="st-cell-main st-mono">{promotion.promotion_code}</div>
                    {promotion.description && <div className="st-cell-sub">{promotion.description}</div>}
                  </td>
                  <td className="st-strong">{describeValue(promotion)}</td>
                  <td>
                    <div className="st-cell-sub">Đơn từ {formatMoney(promotion.min_booking_amount)}</div>
                    <div className="st-cell-sub">{promotion.usage_limit_per_patient} lần / bệnh nhân</div>
                  </td>
                  <td className="st-num">
                    {promotion.times_used}
                    {promotion.usage_limit_total !== null && <span className="st-muted"> / {promotion.usage_limit_total}</span>}
                  </td>
                  <td className="st-nowrap">
                    <div className="st-cell-sub">Từ {formatDateTime(promotion.valid_from)}</div>
                    <div className="st-cell-sub">{promotion.valid_until ? `Đến ${formatDateTime(promotion.valid_until)}` : 'Không thời hạn'}</div>
                  </td>
                  <td>
                    {promotion.is_currently_valid ? (
                      <Badge tone="success">Hiệu lực</Badge>
                    ) : promotion.is_active ? (
                      <Badge tone="warning">Ngoài thời gian</Badge>
                    ) : (
                      <Badge>Đã tắt</Badge>
                    )}
                  </td>
                  <td className="st-num" onClick={(event) => event.stopPropagation()}>
                    <Button size="sm" variant={promotion.is_active ? 'ghost' : 'secondary'} loading={pending === `toggle-${promotion.promotion_id}`} onClick={() => toggle(promotion)}>
                      {promotion.is_active ? 'Tắt' : 'Bật'}
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
        title={editing === 'new' ? 'Tạo khuyến mãi' : 'Sửa khuyến mãi'}
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
          <Field label="Mã khuyến mãi" required>
            {(id) => (
              <input id={id} className="st-input st-mono" maxLength={50} value={form.promotion_code} onChange={(e) => setForm({ ...form, promotion_code: e.target.value.toUpperCase() })} />
            )}
          </Field>
          <Field label="Loại giảm" required>
            {(id) => (
              <select id={id} className="st-select" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                {Object.entries(DISCOUNT_TYPE_LABEL).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label={form.discount_type === 'percent' ? 'Phần trăm giảm' : 'Số tiền giảm (₫)'} required>
            {(id) => <input id={id} type="number" min={0} step="any" className="st-input" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />}
          </Field>
          <Field label="Giảm tối đa (₫)" hint="Để trống nếu không giới hạn">
            {(id) => (
              <input
                id={id}
                type="number"
                min={0}
                className="st-input"
                disabled={form.discount_type !== 'percent'}
                value={form.max_discount_amount}
                onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })}
              />
            )}
          </Field>
          <Field label="Giá trị lịch hẹn tối thiểu (₫)">
            {(id) => <input id={id} type="number" min={0} className="st-input" value={form.min_booking_amount} onChange={(e) => setForm({ ...form, min_booking_amount: e.target.value })} />}
          </Field>
          <Field label="Tổng lượt dùng tối đa" hint="Để trống nếu không giới hạn">
            {(id) => <input id={id} type="number" min={1} className="st-input" value={form.usage_limit_total} onChange={(e) => setForm({ ...form, usage_limit_total: e.target.value })} />}
          </Field>
          <Field label="Lượt dùng / bệnh nhân" required>
            {(id) => <input id={id} type="number" min={1} className="st-input" value={form.usage_limit_per_patient} onChange={(e) => setForm({ ...form, usage_limit_per_patient: e.target.value })} />}
          </Field>
          <div />
          <Field label="Bắt đầu" required>
            {(id) => <input id={id} type="datetime-local" className="st-input" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />}
          </Field>
          <Field label="Kết thúc" hint="Để trống nếu không thời hạn">
            {(id) => <input id={id} type="datetime-local" className="st-input" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />}
          </Field>
          <Field label="Mô tả" className="st-span-2">
            {(id) => <textarea id={id} className="st-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}
          </Field>
          <label className="st-check st-span-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Bật khuyến mãi
          </label>
        </div>
      </Sheet>
    </>
  );
};

export default PromotionsPage;
