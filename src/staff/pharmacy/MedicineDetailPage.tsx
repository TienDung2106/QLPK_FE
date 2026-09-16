import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { PackagePlus, SlidersHorizontal } from 'lucide-react';
import {
  apiGetMedicineBatches,
  apiImportMedicineBatch,
  apiSearchSuppliers,
  apiUpdateMedicineClassification,
} from '../../api/functions/pharmacy';
import type { MedicineStock } from '../../api/staffTypes';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, formatDateTime, formatMoney, formatNumber, nullIfBlank } from '../format';
import { CRITICALITY_LEVEL, labelOf, VELOCITY_CLASS } from '../labels';
import { useToast } from '../components/toastContext';
import { Alert, Badge, Button, Field, PageHeader, Panel, Sheet, StatusBadge, TableState } from '../components/ui';

interface ImportForm {
  batch_number: string;
  expiry_date: string;
  quantity_imported: string;
  import_unit_price: string;
  supplier_id: string;
}

const emptyImport: ImportForm = {
  batch_number: '',
  expiry_date: '',
  quantity_imported: '',
  import_unit_price: '',
  supplier_id: '',
};

/**
 * Một thuốc: các lô đang có, nhập lô mới, chỉnh phân loại.
 * Backend không có API đọc một thuốc theo mã, nên thông tin tồn lấy từ dòng vừa bấm ở bảng
 * kho (state của router) và được cập nhật lại từ kết quả nhập lô / phân loại.
 */
const MedicineDetailPage = () => {
  const medicineId = Number(useParams().medicineId);
  const location = useLocation();
  const toast = useToast();
  const { run, isPending } = useAction();
  const [stock, setStock] = useState<MedicineStock | null>(
    (location.state as { stock?: MedicineStock } | null)?.stock ?? null,
  );
  const [sheet, setSheet] = useState<'import' | 'classify' | null>(null);
  const [form, setForm] = useState<ImportForm>(emptyImport);
  const [formError, setFormError] = useState<string | null>(null);
  const [classify, setClassify] = useState({
    criticality_level: stock?.criticality_level ?? 'non_critical',
    manual: stock?.low_stock_threshold_is_manual ?? false,
    threshold: String(stock?.low_stock_threshold ?? ''),
  });

  const batches = useApiQuery(() => apiGetMedicineBatches(medicineId), [medicineId]);
  const suppliers = useApiQuery(() => apiSearchSuppliers({ is_active: true, page_size: 100 }), [], {
    enabled: sheet === 'import',
  });

  const submitImport = async () => {
    const quantity = Number(form.quantity_imported);
    const price = Number(form.import_unit_price);
    if (!form.batch_number.trim() || !(quantity > 0) || !(price >= 0) || form.import_unit_price === '') {
      setFormError('Nhập số lô, số lượng lớn hơn 0 và giá nhập.');
      return;
    }
    setFormError(null);
    const result = await run('import', () =>
      apiImportMedicineBatch(medicineId, {
        batch_number: form.batch_number.trim(),
        expiry_date: nullIfBlank(form.expiry_date),
        quantity_imported: quantity,
        import_unit_price: price,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
      }),
    );
    if (!result.ok || !result.data) {
      setFormError(result.error);
      return;
    }
    setStock(result.data.stock);
    setForm(emptyImport);
    setSheet(null);
    batches.reload();
    toast.success(`Đã nhập lô ${result.data.batch.batch_number}.`);
  };

  const submitClassify = async () => {
    const threshold = Number(classify.threshold);
    if (classify.manual && !(threshold >= 0 && classify.threshold !== '')) {
      setFormError('Nhập ngưỡng tồn tối thiểu khi đặt ngưỡng thủ công.');
      return;
    }
    setFormError(null);
    const result = await run('classify', () =>
      apiUpdateMedicineClassification(medicineId, {
        criticality_level: classify.criticality_level,
        low_stock_threshold_is_manual: classify.manual,
        low_stock_threshold: classify.manual ? threshold : null,
      }),
    );
    if (!result.ok || !result.data) {
      setFormError(result.error);
      return;
    }
    setStock(result.data);
    setSheet(null);
    toast.success('Đã cập nhật phân loại thuốc.');
  };

  const openSheet = (which: 'import' | 'classify') => {
    setFormError(null);
    if (which === 'classify' && stock) {
      setClassify({
        criticality_level: stock.criticality_level,
        manual: stock.low_stock_threshold_is_manual,
        threshold: String(stock.low_stock_threshold),
      });
    }
    setSheet(which);
  };

  const list = batches.data ?? [];

  return (
    <>
      <PageHeader
        backTo="/nha-thuoc/kho"
        backLabel="Tồn kho"
        title={stock?.medicine_name ?? `Thuốc #${medicineId}`}
        description={stock ? `${stock.active_ingredient ?? 'Chưa rõ hoạt chất'} · ${stock.medicine_group ?? 'Chưa phân nhóm'} · đơn vị ${stock.unit_of_measure}` : undefined}
        actions={
          <>
            <Button icon={<SlidersHorizontal size={16} />} onClick={() => openSheet('classify')}>
              Phân loại & ngưỡng
            </Button>
            <Button variant="primary" icon={<PackagePlus size={16} />} onClick={() => openSheet('import')}>
              Nhập lô mới
            </Button>
          </>
        }
      />

      {stock ? (
        <div className="st-ledger" style={{ marginBottom: '1rem' }}>
          <div className="st-ledger-cell">
            <div className="st-ledger-label">Khả dụng</div>
            <div className={`st-ledger-value ${stock.is_below_threshold ? 'negative' : ''}`}>{formatNumber(stock.available_stock)}</div>
          </div>
          <div className="st-ledger-cell">
            <div className="st-ledger-label">Tồn dùng được</div>
            <div className="st-ledger-value">{formatNumber(stock.usable_stock)}</div>
          </div>
          <div className="st-ledger-cell">
            <div className="st-ledger-label">Đang giữ cho đơn</div>
            <div className="st-ledger-value">{formatNumber(stock.reserved_stock)}</div>
          </div>
          <div className="st-ledger-cell">
            <div className="st-ledger-label">Ngưỡng tối thiểu</div>
            <div className="st-ledger-value">{formatNumber(stock.low_stock_threshold)}</div>
          </div>
          <div className="st-ledger-cell">
            <div className="st-ledger-label">Bán TB / ngày</div>
            <div className="st-ledger-value">{formatNumber(stock.avg_daily_usage, 1)}</div>
          </div>
          <div className="st-ledger-cell">
            <div className="st-ledger-label">Phân loại</div>
            <div className="st-chip-row" style={{ marginTop: '0.4rem' }}>
              <StatusBadge value={labelOf(VELOCITY_CLASS, stock.velocity_class)} />
              <StatusBadge value={labelOf(CRITICALITY_LEVEL, stock.criticality_level)} />
            </div>
          </div>
        </div>
      ) : (
        <Alert tone="info" className="st-alert-gap">
          Mở thuốc từ bảng Tồn kho để xem số liệu tồn. Danh sách lô bên dưới vẫn chính xác.
        </Alert>
      )}

      <Panel title="Các lô thuốc" subtitle="Xuất theo hạn dùng sớm nhất trước" bodyless>
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Số lô</th>
                <th>Hạn dùng</th>
                <th className="st-num">Nhập</th>
                <th className="st-num">Còn</th>
                <th className="st-num">Đang giữ</th>
                <th className="st-num">Khả dụng</th>
                <th className="st-num">Giá nhập</th>
                <th>Nhà cung cấp</th>
                <th>Nhập lúc</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                columns={9}
                loading={batches.loading}
                error={batches.error}
                isEmpty={list.length === 0}
                onRetry={batches.reload}
                emptyTitle="Chưa có lô nào"
                emptyText="Nhập lô đầu tiên để thuốc có hàng khả dụng."
              />
              {list.map((batch) => (
                <tr key={batch.medicine_batch_id} style={batch.is_active ? undefined : { opacity: 0.55 }}>
                  <td className="st-strong">
                    {batch.batch_number} {!batch.is_active && <Badge>Ngừng dùng</Badge>}
                  </td>
                  <td className="st-nowrap">{formatDate(batch.expiry_date)}</td>
                  <td className="st-num">{formatNumber(batch.quantity_imported)}</td>
                  <td className="st-num">{formatNumber(batch.quantity_remaining)}</td>
                  <td className="st-num">{formatNumber(batch.quantity_reserved)}</td>
                  <td className="st-num st-strong">{formatNumber(batch.quantity_available)}</td>
                  <td className="st-num">{formatMoney(batch.import_unit_price)}</td>
                  <td>{batch.supplier_name ?? '—'}</td>
                  <td className="st-nowrap">{formatDateTime(batch.imported_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Sheet
        open={sheet === 'import'}
        title="Nhập lô mới"
        subtitle={stock?.medicine_name}
        onClose={() => setSheet(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSheet(null)}>
              Huỷ
            </Button>
            <Button variant="primary" loading={isPending('import')} onClick={submitImport}>
              Nhập kho
            </Button>
          </>
        }
      >
        {formError && <Alert tone="danger" className="st-alert-gap">{formError}</Alert>}
        <div className="st-form-grid">
          <Field label="Số lô" required>
            {(id) => (
              <input id={id} className="st-input" maxLength={50} value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} />
            )}
          </Field>
          <Field label="Hạn dùng">
            {(id) => (
              <input id={id} type="date" className="st-input" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
            )}
          </Field>
          <Field label="Số lượng nhập" required hint={stock ? `Theo ${stock.unit_of_measure}` : undefined}>
            {(id) => (
              <input id={id} type="number" min={1} className="st-input" value={form.quantity_imported} onChange={(e) => setForm({ ...form, quantity_imported: e.target.value })} />
            )}
          </Field>
          <Field label="Giá nhập / đơn vị (₫)" required>
            {(id) => (
              <input id={id} type="number" min={0} step="any" className="st-input" value={form.import_unit_price} onChange={(e) => setForm({ ...form, import_unit_price: e.target.value })} />
            )}
          </Field>
          <Field label="Nhà cung cấp" className="st-span-2">
            {(id) => (
              <select id={id} className="st-select" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
                <option value="">{suppliers.loading ? 'Đang tải…' : 'Không ghi nhận'}</option>
                {(suppliers.data?.items ?? []).map((supplier) => (
                  <option key={supplier.supplier_id} value={supplier.supplier_id}>
                    {supplier.supplier_name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      </Sheet>

      <Sheet
        open={sheet === 'classify'}
        title="Phân loại & ngưỡng tồn"
        subtitle={stock?.medicine_name}
        onClose={() => setSheet(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSheet(null)}>
              Huỷ
            </Button>
            <Button variant="primary" loading={isPending('classify')} onClick={submitClassify}>
              Lưu
            </Button>
          </>
        }
      >
        {formError && <Alert tone="danger" className="st-alert-gap">{formError}</Alert>}
        <div className="st-form-grid">
          <Field label="Mức thiết yếu" required className="st-span-2" hint="Thuốc thiết yếu được giữ ngưỡng tồn cao hơn.">
            {(id) => (
              <select id={id} className="st-select" value={classify.criticality_level} onChange={(e) => setClassify({ ...classify, criticality_level: e.target.value })}>
                {Object.entries(CRITICALITY_LEVEL).map(([code, item]) => (
                  <option key={code} value={code}>
                    {item.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <label className="st-check st-span-2">
            <input type="checkbox" checked={classify.manual} onChange={(e) => setClassify({ ...classify, manual: e.target.checked })} />
            Đặt ngưỡng tồn thủ công (không để hệ thống tự tính)
          </label>
          {classify.manual && (
            <Field label="Ngưỡng tồn tối thiểu" required>
              {(id) => (
                <input id={id} type="number" min={0} className="st-input" value={classify.threshold} onChange={(e) => setClassify({ ...classify, threshold: e.target.value })} />
              )}
            </Field>
          )}
        </div>
      </Sheet>
    </>
  );
};

export default MedicineDetailPage;
