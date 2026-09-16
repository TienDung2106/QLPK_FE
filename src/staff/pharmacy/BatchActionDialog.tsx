import { useState } from 'react';
import { apiAdjustBatch, apiRemoveBatchStock } from '../../api/functions/pharmacy';
import type { MedicineBatch } from '../../api/staffTypes';
import { useAction } from '../hooks';
import { formatDate, formatNumber } from '../format';
import { Alert, Button, Field } from '../components/ui';

export type BatchActionKind = 'adjust' | 'write-off' | 'return-to-supplier' | 'stock-out';

const COPY: Record<BatchActionKind, { title: string; text: string; confirm: string; danger?: boolean }> = {
  adjust: {
    title: 'Kiểm kê lô',
    text: 'Nhập số đếm thực tế trên kệ. Chênh lệch (thừa hoặc thiếu) được ghi vào lịch sử kho.',
    confirm: 'Cập nhật số đếm',
  },
  'write-off': {
    title: 'Huỷ thuốc hết hạn / hỏng',
    text: 'Bỏ trống số lượng để huỷ toàn bộ phần còn lại; lô đó sẽ đóng lại.',
    confirm: 'Huỷ thuốc',
    danger: true,
  },
  'return-to-supplier': {
    title: 'Trả nhà cung cấp',
    text: 'Trả lại nhà cung cấp đã giao lô này.',
    confirm: 'Trả hàng',
    danger: true,
  },
  'stock-out': {
    title: 'Xuất ngoài đơn thuốc',
    text: 'Lấy thuốc khỏi kệ không qua đơn — ví dụ bán lẻ tại quầy.',
    confirm: 'Xuất kho',
  },
};

interface Props {
  batch: MedicineBatch | null;
  kind: BatchActionKind | null;
  medicineName?: string;
  onClose: () => void;
  onDone: (batch: MedicineBatch) => void;
}

/** Một hộp thoại cho bốn thao tác sửa tồn của một lô. Ghi chú luôn bắt buộc. */
export const BatchActionDialog = (props: Props) =>
  props.batch && props.kind ? <BatchActionBody {...props} batch={props.batch} kind={props.kind} /> : null;

const BatchActionBody = ({
  batch,
  kind,
  medicineName,
  onClose,
  onDone,
}: Props & { batch: MedicineBatch; kind: BatchActionKind }) => {
  const { run, isPending } = useAction();
  const [quantity, setQuantity] = useState(kind === 'adjust' ? String(batch.quantity_remaining) : '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[kind];

  const submit = async () => {
    if (!notes.trim()) {
      setError('Ghi chú là bắt buộc để giải thích thay đổi.');
      return;
    }
    const value = quantity === '' ? null : Number(quantity);
    if (kind === 'adjust' && !(value !== null && Number.isInteger(value) && value >= 0)) {
      setError('Số đếm phải là số nguyên không âm.');
      return;
    }
    if (kind !== 'adjust' && value !== null && !(Number.isInteger(value) && value > 0)) {
      setError('Số lượng phải là số nguyên dương.');
      return;
    }
    if (kind !== 'write-off' && kind !== 'adjust' && value === null) {
      setError('Nhập số lượng.');
      return;
    }
    const result = await run('batch', () =>
      kind === 'adjust'
        ? apiAdjustBatch(batch.medicine_batch_id, { counted_quantity: value!, notes: notes.trim() })
        : apiRemoveBatchStock(batch.medicine_batch_id, kind, { quantity: value, notes: notes.trim() }),
    );
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    onDone(result.data);
  };

  return (
    <>
      <div className="st-overlay top" onClick={onClose} />
      <div className="st-dialog" role="dialog" aria-modal="true" aria-label={copy.title}>
        <h2 className="st-dialog-title">{copy.title}</h2>
        <div className="st-dialog-text">
          {medicineName ? `${medicineName} · ` : ''}Lô <strong>{batch.batch_number}</strong> · hạn {formatDate(batch.expiry_date)} · còn{' '}
          {formatNumber(batch.quantity_remaining)}, đang giữ cho đơn {formatNumber(batch.quantity_reserved)}.
          <br />
          {copy.text}
        </div>
        {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}
        <div className="st-form-grid" style={{ marginTop: '0.9rem' }}>
          <Field
            label={kind === 'adjust' ? 'Số đếm thực tế' : 'Số lượng'}
            required={kind !== 'write-off'}
            className="st-span-2"
            hint={kind === 'adjust' ? undefined : `Tối đa ${formatNumber(batch.quantity_available)} (phần không giữ cho đơn).`}
          >
            {(id) => (
              <input
                id={id}
                type="number"
                min={0}
                className="st-input"
                autoFocus
                placeholder={kind === 'write-off' ? 'Bỏ trống = huỷ toàn bộ' : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            )}
          </Field>
          <Field label="Ghi chú" required className="st-span-2">
            {(id) => <textarea id={id} className="st-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />}
          </Field>
        </div>
        <div className="st-form-actions">
          <Button variant="ghost" onClick={onClose} disabled={isPending('batch')}>
            Huỷ bỏ
          </Button>
          <Button variant={copy.danger ? 'danger-solid' : 'primary'} loading={isPending('batch')} onClick={submit}>
            {copy.confirm}
          </Button>
        </div>
      </div>
    </>
  );
};
