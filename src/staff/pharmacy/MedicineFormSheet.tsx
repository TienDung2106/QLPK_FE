import { useState } from 'react';
import { apiCreateMedicine, apiUpdateMedicine } from '../../api/functions/pharmacy';
import type { MedicinePayload, MedicineStock } from '../../api/staffTypes';
import { useAction } from '../hooks';
import { formatMoney, nullIfBlank } from '../format';
import { Alert, Button, Field, Sheet } from '../components/ui';

type Form = Record<keyof MedicinePayload, string>;

const toForm = (stock: MedicineStock | null): Form => ({
  medicine_name: stock?.medicine_name ?? '',
  active_ingredient: stock?.active_ingredient ?? '',
  medicine_group: stock?.medicine_group ?? '',
  unit_of_measure: stock?.unit_of_measure ?? 'hộp',
  packaging: stock?.packaging ?? '',
  unit_price: '',
  manufacturer: '',
  storage_condition: '',
  description: '',
});

interface Props {
  open: boolean;
  /** null = thêm thuốc mới. */
  medicine: MedicineStock | null;
  onClose: () => void;
  onSaved: (stock: MedicineStock) => void;
}

/**
 * Thêm hoặc sửa thông tin danh mục của một thuốc. Tồn kho, tốc độ bán và ngưỡng không nằm ở
 * đây: backend tự tính hoặc sửa qua "Phân loại & ngưỡng".
 */
export const MedicineFormSheet = (props: Props) => (props.open ? <MedicineFormBody {...props} /> : null);

const MedicineFormBody = ({ medicine, onClose, onSaved }: Props) => {
  const { run, isPending } = useAction();
  const [form, setForm] = useState<Form>(() => toForm(medicine));
  const [error, setError] = useState<string | null>(null);
  const isNew = medicine === null;

  const set = (key: keyof Form) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const save = async () => {
    const price = Number(form.unit_price);
    if (!form.medicine_name.trim() || !form.unit_of_measure.trim()) {
      setError('Nhập tên thuốc và đơn vị tính.');
      return;
    }
    if (form.unit_price === '' || !(price >= 0)) {
      setError('Nhập giá bán (số không âm).');
      return;
    }
    const payload: MedicinePayload = {
      medicine_name: form.medicine_name.trim(),
      active_ingredient: nullIfBlank(form.active_ingredient),
      medicine_group: nullIfBlank(form.medicine_group),
      unit_of_measure: form.unit_of_measure.trim(),
      packaging: nullIfBlank(form.packaging),
      unit_price: price,
      manufacturer: nullIfBlank(form.manufacturer),
      storage_condition: nullIfBlank(form.storage_condition),
      description: nullIfBlank(form.description),
    };
    const result = await run('save', () => (isNew ? apiCreateMedicine(payload) : apiUpdateMedicine(medicine.medicine_id, payload)));
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    onSaved(result.data);
  };

  return (
    <Sheet
      open
      title={isNew ? 'Thêm thuốc vào danh mục' : `Sửa thông tin — ${medicine.medicine_name}`}
      subtitle={isNew ? 'Thuốc mới chưa có tồn; nhập lô để có hàng.' : undefined}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button variant="primary" loading={isPending('save')} onClick={save}>
            {isNew ? 'Thêm thuốc' : 'Lưu'}
          </Button>
        </>
      }
    >
      {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}
      {!isNew && (
        <Alert tone="warning" className="st-alert-gap">
          Máy chủ không trả lại giá bán, nhà sản xuất, bảo quản và mô tả hiện có. Nhập lại đầy đủ các ô này — ô để trống sẽ bị xoá khỏi
          danh mục.
        </Alert>
      )}
      <div className="st-form-grid">
        <Field label="Tên thuốc" required className="st-span-2">
          {(id) => <input id={id} className="st-input" maxLength={200} value={form.medicine_name} onChange={set('medicine_name')} />}
        </Field>
        <Field label="Hoạt chất">
          {(id) => <input id={id} className="st-input" maxLength={200} value={form.active_ingredient} onChange={set('active_ingredient')} />}
        </Field>
        <Field label="Nhóm thuốc">
          {(id) => <input id={id} className="st-input" maxLength={100} value={form.medicine_group} onChange={set('medicine_group')} />}
        </Field>
        <Field label="Đơn vị bán" required hint="Đơn vị xuất kho và tính tiền: hộp, tuýp, chai, lọ">
          {(id) => <input id={id} className="st-input" maxLength={20} value={form.unit_of_measure} onChange={set('unit_of_measure')} />}
        </Field>
        <Field label="Quy cách đóng gói" className="st-span-2" hint="Một đơn vị gồm gì, vd: Hộp 3 vỉ × 10 viên">
          {(id) => (
            <input id={id} className="st-input" maxLength={100} placeholder="Hộp 3 vỉ × 10 viên" value={form.packaging} onChange={set('packaging')} />
          )}
        </Field>
        <Field label="Giá bán / đơn vị (₫)" required hint={form.unit_price ? formatMoney(Number(form.unit_price)) : undefined}>
          {(id) => <input id={id} type="number" min={0} step="any" className="st-input" value={form.unit_price} onChange={set('unit_price')} />}
        </Field>
        <Field label="Nhà sản xuất">
          {(id) => <input id={id} className="st-input" maxLength={200} value={form.manufacturer} onChange={set('manufacturer')} />}
        </Field>
        <Field label="Điều kiện bảo quản">
          {(id) => <input id={id} className="st-input" maxLength={200} value={form.storage_condition} onChange={set('storage_condition')} />}
        </Field>
        <Field label="Mô tả" className="st-span-2">
          {(id) => <textarea id={id} className="st-textarea" value={form.description} onChange={set('description')} />}
        </Field>
      </div>
    </Sheet>
  );
};
