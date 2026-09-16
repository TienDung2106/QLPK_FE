import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Printer, RefreshCcw, Undo2, Wallet } from 'lucide-react';
import { apiBuildSettlementInvoice, apiCollectPayment, apiGetInvoice, apiRefundInvoice } from '../../api/functions/desk';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, formatDateTime, formatMoney, formatPercent } from '../format';
import {
  INVOICE_ITEM_TYPE_LABEL,
  INVOICE_STATUS,
  labelOf,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  textOf,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from '../labels';
import { useToast } from '../components/toastContext';
import { PaymentMethodFields } from '../components/pickers';
import { emptyPayment, paymentInvalid, paymentPayload } from '../components/payment';
import type { PaymentFormValue } from '../components/payment';
import { Alert, Button, EmptyState, PageHeader, Panel, Sheet, StatusBadge } from '../components/ui';

const InvoiceDetailPage = () => {
  const invoiceId = Number(useParams().invoiceId);
  const toast = useToast();
  const { run, isPending } = useAction();
  const query = useApiQuery(() => apiGetInvoice(invoiceId), [invoiceId]);
  const invoice = query.data;
  const [sheet, setSheet] = useState<'pay' | 'refund' | null>(null);
  const [payment, setPayment] = useState<PaymentFormValue>(emptyPayment);
  const [error, setError] = useState<string | null>(null);

  if (!invoice) {
    return (
      <>
        <PageHeader title={query.loading ? 'Đang tải hoá đơn…' : `Hoá đơn #${invoiceId}`} backTo="/thu-ngan/hoa-don" backLabel="Hoá đơn" />
        {query.error && <Alert tone="danger">{query.error}</Alert>}
      </>
    );
  }

  const submit = async () => {
    if (paymentInvalid(payment)) {
      setError('Nhập mã giao dịch cho khoản chuyển khoản.');
      return;
    }
    const kind = sheet;
    const result = await run('money', () =>
      kind === 'refund' ? apiRefundInvoice(invoiceId, paymentPayload(payment)) : apiCollectPayment(invoiceId, paymentPayload(payment)),
    );
    if (result.ok && result.data) {
      query.setData(result.data);
      setSheet(null);
      setPayment(emptyPayment);
      toast.success(kind === 'refund' ? 'Đã ghi nhận hoàn tiền.' : 'Đã thu tiền.');
      return;
    }
    if (result.errorCode === 'invoice_outdated') {
      setError(`${result.error} Bấm "Lập lại hoá đơn" rồi thu lại.`);
    } else {
      setError(result.error);
    }
  };

  const rebuild = async () => {
    const result = await run('rebuild', () => apiBuildSettlementInvoice(invoice.appointment_id));
    if (result.ok && result.data) {
      query.setData(result.data);
      toast.success('Đã lập lại hoá đơn theo lượt khám.');
    } else {
      toast.error(result.error);
    }
  };

  const open = (kind: 'pay' | 'refund') => {
    setError(null);
    setPayment(emptyPayment);
    setSheet(kind);
  };

  return (
    <>
      <PageHeader
        backTo="/thu-ngan/hoa-don"
        backLabel="Hoá đơn"
        title={
          <>
            Hoá đơn <span className="st-mono">{invoice.invoice_number}</span>{' '}
            <StatusBadge value={labelOf(PAYMENT_STATUS, invoice.payment_status)} />
          </>
        }
        description={`${invoice.patient_full_name} (${invoice.patient_code}) · Bác sĩ: ${invoice.doctor_full_name} · khám ${formatDate(invoice.appointment_date)}`}
        actions={
          <span className="st-actions st-no-print">
            <Button icon={<Printer size={16} />} onClick={() => window.print()}>
              In
            </Button>
            <Button icon={<RefreshCcw size={16} />} loading={isPending('rebuild')} onClick={rebuild} title="Tính lại theo lượt khám, khi đơn thuốc hoặc dịch vụ vừa thay đổi">
              Lập lại hoá đơn
            </Button>
            {invoice.refund_due > 0 && (
              <Button variant="danger" icon={<Undo2 size={16} />} onClick={() => open('refund')}>
                Hoàn {formatMoney(invoice.refund_due)}
              </Button>
            )}
            {invoice.amount_outstanding > 0 && (
              <Button variant="primary" icon={<Wallet size={16} />} onClick={() => open('pay')}>
                Thu {formatMoney(invoice.amount_outstanding)}
              </Button>
            )}
          </span>
        }
      />

      <div className="st-ledger" style={{ marginBottom: '1rem' }}>
        <div className="st-ledger-cell">
          <div className="st-ledger-label">Tổng phải trả</div>
          <div className="st-ledger-value">{formatMoney(invoice.total_amount)}</div>
        </div>
        <div className="st-ledger-cell">
          <div className="st-ledger-label">Đã thu</div>
          <div className="st-ledger-value">{formatMoney(invoice.amount_collected)}</div>
        </div>
        <div className="st-ledger-cell">
          <div className="st-ledger-label">Còn phải thu</div>
          <div className={`st-ledger-value ${invoice.amount_outstanding > 0 ? 'negative' : ''}`}>{formatMoney(invoice.amount_outstanding)}</div>
        </div>
        <div className="st-ledger-cell">
          <div className="st-ledger-label">Phải hoàn</div>
          <div className={`st-ledger-value ${invoice.refund_due > 0 ? 'negative' : ''}`}>{formatMoney(invoice.refund_due)}</div>
        </div>
      </div>

      <div className="st-grid-main">
        <div className="st-stack">
          <Panel title="Chi tiết hoá đơn" bodyless>
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Khoản</th>
                    <th>Loại</th>
                    <th className="st-num">SL</th>
                    <th className="st-num">Đơn giá</th>
                    <th className="st-num">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.invoice_item_id}>
                      <td className="st-cell-main">{item.description}</td>
                      <td>{textOf(INVOICE_ITEM_TYPE_LABEL, item.item_type)}</td>
                      <td className="st-num">{item.quantity}</td>
                      <td className="st-num">{formatMoney(item.unit_price)}</td>
                      <td className="st-num">{formatMoney(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="st-panel-body" style={{ borderTop: '1px solid var(--st-line)', display: 'flex', justifyContent: 'flex-end' }}>
              <dl className="st-totals" style={{ minWidth: 300 }}>
                <dt>Dịch vụ</dt>
                <dd>{formatMoney(invoice.services_subtotal)}</dd>
                <dt>Thuốc</dt>
                <dd>{formatMoney(invoice.medicines_subtotal)}</dd>
                <dt>Tạm tính</dt>
                <dd>{formatMoney(invoice.subtotal_amount)}</dd>
                {invoice.discount_amount > 0 && (
                  <>
                    <dt>Giảm giá{invoice.discount_reason ? ` (${invoice.discount_reason})` : ''}</dt>
                    <dd>−{formatMoney(invoice.discount_amount)}</dd>
                  </>
                )}
                {invoice.support_amount > 0 && (
                  <>
                    <dt>Hỗ trợ</dt>
                    <dd>−{formatMoney(invoice.support_amount)}</dd>
                  </>
                )}
                {invoice.cancellation_refund_percent !== null && (
                  <>
                    <dt>Tỉ lệ hoàn khi huỷ</dt>
                    <dd>{formatPercent(invoice.cancellation_refund_percent)}</dd>
                  </>
                )}
                <dt className="st-total-row">Tổng cộng</dt>
                <dd className="st-total-row">{formatMoney(invoice.total_amount)}</dd>
              </dl>
            </div>
          </Panel>

          <Panel title="Giao dịch" bodyless>
            {invoice.transactions.length === 0 ? (
              <EmptyState title="Chưa có giao dịch" text="Khoản thu hoặc hoàn tiền sẽ được ghi ở đây." />
            ) : (
              <div className="st-table-wrap">
                <table className="st-table">
                  <thead>
                    <tr>
                      <th>Loại</th>
                      <th>Phương thức</th>
                      <th>Mã giao dịch</th>
                      <th className="st-num">Số tiền</th>
                      <th>Trạng thái</th>
                      <th>Thời điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.transactions.map((tx) => (
                      <tr key={tx.payment_transaction_id}>
                        <td className="st-cell-main st-nowrap">{textOf(TRANSACTION_TYPE, tx.transaction_type)}</td>
                        <td>{textOf(PAYMENT_METHOD, tx.payment_method)}</td>
                        <td className="st-mono">{tx.external_reference ?? '—'}</td>
                        <td className="st-num st-strong" style={{ color: tx.transaction_type === 'refund' ? 'var(--st-danger)' : undefined }}>
                          {tx.transaction_type === 'refund' ? '−' : ''}
                          {formatMoney(tx.amount)}
                        </td>
                        <td>
                          <StatusBadge value={labelOf(TRANSACTION_STATUS, tx.transaction_status)} />
                        </td>
                        <td className="st-nowrap">{formatDateTime(tx.paid_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Thông tin">
          <dl className="st-dl">
            <dt>Trạng thái HĐ</dt>
            <dd>
              <StatusBadge value={labelOf(INVOICE_STATUS, invoice.invoice_status)} />
            </dd>
            <dt>Bệnh nhân</dt>
            <dd>
              <Link to={`/thu-ngan/benh-nhan/${invoice.patient_id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                {invoice.patient_full_name}
              </Link>
            </dd>
            <dt>Lượt khám</dt>
            <dd>
              <Link to={`/thu-ngan/lich-hen/${invoice.appointment_id}`} style={{ color: 'var(--primary)' }}>
                #{invoice.appointment_id}
              </Link>
            </dd>
            <dt>Bác sĩ</dt>
            <dd>{invoice.doctor_full_name}</dd>
            <dt>Tạo lúc</dt>
            <dd>{formatDateTime(invoice.created_at)}</dd>
            <dt>Thanh toán lúc</dt>
            <dd>{formatDateTime(invoice.paid_at)}</dd>
          </dl>
        </Panel>
      </div>

      <Sheet
        open={sheet !== null}
        title={sheet === 'refund' ? 'Hoàn tiền' : 'Thu tiền'}
        subtitle={
          sheet === 'refund'
            ? `Hoàn đúng ${formatMoney(invoice.refund_due)} đã thu dư.`
            : `Thu đúng ${formatMoney(invoice.amount_outstanding)} còn nợ.`
        }
        onClose={() => setSheet(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSheet(null)}>
              Huỷ
            </Button>
            <Button variant={sheet === 'refund' ? 'danger-solid' : 'primary'} loading={isPending('money')} onClick={submit}>
              {sheet === 'refund' ? `Xác nhận hoàn ${formatMoney(invoice.refund_due)}` : `Xác nhận đã thu ${formatMoney(invoice.amount_outstanding)}`}
            </Button>
          </>
        }
      >
        {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}
        <PaymentMethodFields value={payment} onChange={setPayment} />
      </Sheet>
    </>
  );
};

export default InvoiceDetailPage;
