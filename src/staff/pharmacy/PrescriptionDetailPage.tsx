import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PackageCheck, PackageOpen, Undo2 } from 'lucide-react';
import {
  apiCancelPreparation,
  apiDeliverPrescription,
  apiGetPrescription,
  apiPreparePrescription,
} from '../../api/functions/pharmacy';
import type { Prescription, PrescriptionShortfall } from '../../api/staffTypes';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, formatDateTime, formatMoney } from '../format';
import { labelOf, PRESCRIPTION_STATUS } from '../labels';
import { useToast } from '../components/toastContext';
import { Alert, Button, ConfirmDialog, EmptyState, PageHeader, Panel, StatusBadge } from '../components/ui';

const HOLDING_STOCK = ['prepared', 'awaiting_payment'];

const PrescriptionDetailPage = () => {
  const prescriptionId = Number(useParams().prescriptionId);
  const toast = useToast();
  const { run, isPending, pending } = useAction();
  const [shortfalls, setShortfalls] = useState<PrescriptionShortfall[]>([]);
  const [confirm, setConfirm] = useState<'cancel' | 'deliver' | null>(null);

  const query = useApiQuery(() => apiGetPrescription(prescriptionId), [prescriptionId]);
  const prescription = query.data;

  const apply = (next: Prescription, message: string) => {
    query.setData(next);
    toast.success(message);
  };

  const prepare = async () => {
    const result = await run('prepare', () => apiPreparePrescription(prescriptionId));
    if (!result.ok || !result.data) {
      toast.error(result.error);
      return;
    }
    setShortfalls(result.data.shortfalls);
    apply(
      result.data.prescription,
      result.data.shortfalls.length > 0 ? 'Đã soạn, nhưng có thuốc không đủ hàng.' : 'Đã soạn đủ thuốc cho đơn.',
    );
  };

  const cancelPreparation = async () => {
    const result = await run('cancel', () => apiCancelPreparation(prescriptionId));
    setConfirm(null);
    if (result.ok && result.data) {
      setShortfalls([]);
      apply(result.data, 'Đã trả thuốc về kho.');
    } else {
      toast.error(result.error);
    }
  };

  const deliver = async () => {
    const result = await run('deliver', () => apiDeliverPrescription(prescriptionId));
    setConfirm(null);
    if (result.ok && result.data) {
      apply(result.data, 'Đã giao thuốc cho bệnh nhân.');
    } else {
      toast.error(result.error);
    }
  };

  if (query.loading && !prescription) {
    return <PageHeader title="Đang tải đơn thuốc…" backTo="/nha-thuoc" backLabel="Đơn thuốc" />;
  }

  if (!prescription) {
    return (
      <>
        <PageHeader title={`Đơn thuốc #${prescriptionId}`} backTo="/nha-thuoc" backLabel="Đơn thuốc" />
        <Alert tone="danger">{query.error ?? 'Không tìm thấy đơn thuốc.'}</Alert>
      </>
    );
  }

  const holding = HOLDING_STOCK.includes(prescription.status);
  const totalValue = prescription.items.reduce((sum, item) => sum + item.unit_price * item.quantity_prescribed, 0);

  return (
    <>
      <PageHeader
        backTo="/nha-thuoc"
        backLabel="Đơn thuốc"
        title={
          <>
            Đơn thuốc #{prescription.prescription_id}{' '}
            <StatusBadge value={labelOf(PRESCRIPTION_STATUS, prescription.status)} />
          </>
        }
        description={`${prescription.patient_full_name} · Bác sĩ: ${prescription.doctor_full_name} · kê lúc ${formatDateTime(prescription.created_at)}`}
        actions={
          <>
            {prescription.status === 'pending' && (
              <Button variant="primary" icon={<PackageOpen size={16} />} loading={isPending('prepare')} onClick={prepare}>
                Soạn thuốc
              </Button>
            )}
            {holding && (
              <>
                <Button variant="danger" icon={<Undo2 size={16} />} disabled={Boolean(pending)} onClick={() => setConfirm('cancel')}>
                  Huỷ soạn
                </Button>
                <Button variant="success" icon={<PackageCheck size={16} />} disabled={Boolean(pending)} onClick={() => setConfirm('deliver')}>
                  Giao thuốc
                </Button>
              </>
            )}
          </>
        }
      />

      {prescription.status === 'pending' && (
        <Alert tone="info" className="st-alert-gap">
          Soạn thuốc sẽ giữ hàng theo lô hết hạn sớm nhất. Sau khi soạn, quầy mới lập được hoá đơn có tiền thuốc.
        </Alert>
      )}
      {prescription.status === 'awaiting_payment' && (
        <Alert tone="warning" className="st-alert-gap">
          Đơn đã lên hoá đơn nhưng chưa thu đủ tiền. Chỉ giao thuốc khi quầy báo đã thanh toán.
        </Alert>
      )}
      {shortfalls.length > 0 && (
        <Alert tone="warning" className="st-alert-gap">
          Không đủ hàng:{' '}
          {shortfalls
            .map((s) => `${s.medicine_name} (giữ được ${s.quantity_reserved}/${s.quantity_prescribed})`)
            .join('; ')}
          . Phần thiếu không bị tính tiền.
        </Alert>
      )}

      <div className="st-grid-main">
        <Panel title="Thuốc trong đơn" subtitle={`${prescription.items.length} loại`} bodyless>
          {prescription.items.length === 0 ? (
            <EmptyState title="Đơn không có thuốc" />
          ) : (
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Thuốc</th>
                    <th>Cách dùng</th>
                    <th className="st-num">Kê</th>
                    <th className="st-num">Đã giữ</th>
                    <th className="st-num">Đã giao</th>
                    <th>Lô giữ hàng</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.items.map((item) => (
                    <tr key={item.prescription_item_id}>
                      <td>
                        <div className="st-cell-main">{item.medicine_name}</div>
                        <div className="st-cell-sub">
                          {formatMoney(item.unit_price)} / {item.unit_of_measure}
                        </div>
                      </td>
                      <td>
                        <div>
                          {item.dosage} · {item.frequency}
                          {item.duration_days ? ` · ${item.duration_days} ngày` : ''}
                        </div>
                        {item.usage_instructions && <div className="st-cell-sub">{item.usage_instructions}</div>}
                      </td>
                      <td className="st-num">{item.quantity_prescribed}</td>
                      <td className="st-num" style={{ color: item.quantity_reserved < item.quantity_prescribed && holding ? 'var(--st-warning)' : undefined }}>
                        {item.quantity_reserved}
                      </td>
                      <td className="st-num">{item.quantity_delivered}</td>
                      <td>
                        {item.allocations.length === 0 ? (
                          <span className="st-muted">—</span>
                        ) : (
                          item.allocations.map((allocation) => (
                            <div key={allocation.medicine_batch_id} className="st-cell-sub st-nowrap">
                              Lô {allocation.batch_number} · HSD {formatDate(allocation.expiry_date)} · {allocation.quantity_reserved}
                            </div>
                          ))
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="st-stack">
          <Panel title="Thông tin đơn">
            <dl className="st-dl">
              <dt>Bệnh nhân</dt>
              <dd>{prescription.patient_full_name}</dd>
              <dt>Bác sĩ</dt>
              <dd>{prescription.doctor_full_name}</dd>
              <dt>Lượt khám</dt>
              <dd>#{prescription.appointment_id}</dd>
              <dt>Soạn lúc</dt>
              <dd>{formatDateTime(prescription.prepared_at)}</dd>
              <dt>Giao lúc</dt>
              <dd>{formatDateTime(prescription.delivered_at)}</dd>
              <dt>Ghi chú</dt>
              <dd>{prescription.notes || '—'}</dd>
            </dl>
          </Panel>
          <Panel title="Giá trị">
            <dl className="st-totals">
              <dt>Theo đơn kê</dt>
              <dd>{formatMoney(totalValue)}</dd>
              <dt className="st-total-row">Đang giữ hàng</dt>
              <dd className="st-total-row">{formatMoney(prescription.reserved_amount)}</dd>
            </dl>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'cancel'}
        title="Huỷ soạn đơn thuốc?"
        text="Toàn bộ thuốc đang giữ cho đơn sẽ trả về kho, đơn quay lại trạng thái Chờ soạn."
        confirmLabel="Trả thuốc về kho"
        tone="danger-solid"
        loading={isPending('cancel')}
        onConfirm={cancelPreparation}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'deliver'}
        title="Giao thuốc cho bệnh nhân?"
        text="Kho sẽ trừ đúng số lượng đang giữ. Chỉ giao được khi hoá đơn đã thanh toán đủ."
        confirmLabel="Xác nhận đã giao"
        tone="success"
        loading={isPending('deliver')}
        onConfirm={deliver}
        onClose={() => setConfirm(null)}
      />
    </>
  );
};

export default PrescriptionDetailPage;
