import { useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, FileDown, Loader2, Receipt } from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer/Footer';
import { apiGetMyInvoice, apiGetMyInvoicePdf, apiGetMyInvoices } from '../../api/functions/patientRecords';
import { openFile } from '../../api/helpers';
import type { Invoice, InvoiceListItem } from '../../api/staffTypes';
import type { PagedResponse as Paged } from '../../api/types';
import { formatDate, formatDateTime, formatMoney } from '../../staff/format';
import './MyRecords.css';

const PAYMENT_LABEL: Record<string, string> = {
  unpaid: 'Chưa thanh toán',
  partially_paid: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
};

const ITEM_TYPE_LABEL: Record<string, string> = {
  consultation_fee: 'Phí khám',
  service: 'Dịch vụ',
  medicine: 'Thuốc',
  other: 'Khác',
};

/** Hoá đơn của mọi hồ sơ trong tài khoản. Thanh toán vẫn làm tại quầy; ở đây chỉ xem và tải PDF. */
export const MyInvoicesPage = () => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<InvoiceListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, Invoice>>({});
  const [busyPdf, setBusyPdf] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetMyInvoices({ page_number: page, page_size: 10 }).then((result) => {
      if (cancelled) {
        return;
      }
      setData(result.data);
      setError(result.ok ? null : result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    if (openId === null || details[openId]) {
      return;
    }
    let cancelled = false;
    apiGetMyInvoice(openId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok && result.data) {
        setDetails((current) => ({ ...current, [openId]: result.data! }));
      } else {
        setError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [openId, details]);

  const downloadPdf = async (invoice: InvoiceListItem) => {
    setBusyPdf(invoice.invoice_id);
    const result = await apiGetMyInvoicePdf(invoice.invoice_id);
    setBusyPdf(null);
    if (result.ok && result.data) {
      openFile(result.data, `hoa-don-${invoice.invoice_number}.pdf`);
    } else {
      setError(result.error);
    }
  };

  const items = data?.items ?? [];

  return (
    <div className="account-page">
      <Header />

      <main className="container account-main">
        <div className="account-heading">
          <div>
            <h1 className="account-title">Hoá đơn của tôi</h1>
            <p className="account-subtitle">Chi phí từng lượt khám của bạn và người thân. Bấm vào hoá đơn để xem chi tiết.</p>
          </div>
        </div>

        {error && (
          <div className="account-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="full-page-loader">
            <Loader2 className="full-page-loader-icon" size={32} />
            <span>Đang tải hoá đơn...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="appointment-empty">
            <Receipt size={40} />
            <h3>Chưa có hoá đơn nào</h3>
            <p>Hoá đơn được lập sau mỗi lượt khám hoặc khi bạn thanh toán trước tại quầy.</p>
          </div>
        ) : (
          <ul className="record-list">
            {items.map((invoice) => {
              const open = openId === invoice.invoice_id;
              const detail = details[invoice.invoice_id];
              return (
                <li key={invoice.invoice_id} className="record-card">
                  <button
                    type="button"
                    className="record-card-head"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : invoice.invoice_id)}
                  >
                    <div>
                      <h3 className="record-card-title">Hoá đơn {invoice.invoice_number}</h3>
                      <p className="record-card-meta">
                        {invoice.patient_full_name} · lập {formatDateTime(invoice.created_at)}
                        {invoice.paid_at ? ` · thanh toán ${formatDateTime(invoice.paid_at)}` : ''}
                      </p>
                    </div>
                    <div className="record-card-side">
                      <span className={`record-pill ${invoice.payment_status}`}>
                        {PAYMENT_LABEL[invoice.payment_status] ?? invoice.payment_status}
                      </span>
                      <span className="record-amount">{formatMoney(invoice.total_amount)}</span>
                      {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {open && (
                    <div className="record-card-body">
                      {!detail ? (
                        <div className="full-page-loader">
                          <Loader2 className="full-page-loader-icon" size={24} />
                        </div>
                      ) : (
                        <>
                          <p className="record-card-meta" style={{ marginTop: '1rem' }}>
                            Khám ngày {formatDate(detail.appointment_date)} với {detail.doctor_full_name}
                          </p>
                          <table className="record-lines">
                            <thead>
                              <tr>
                                <th>Mục</th>
                                <th className="num">SL</th>
                                <th className="num">Đơn giá</th>
                                <th className="num">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detail.items.map((item) => (
                                <tr key={item.invoice_item_id}>
                                  <td>
                                    {item.description}
                                    <div className="record-card-meta">{ITEM_TYPE_LABEL[item.item_type] ?? item.item_type}</div>
                                  </td>
                                  <td className="num">{item.quantity}</td>
                                  <td className="num">{formatMoney(item.unit_price)}</td>
                                  <td className="num">{formatMoney(item.line_total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <dl className="record-totals">
                            <dt>Tạm tính</dt>
                            <dd>{formatMoney(detail.subtotal_amount)}</dd>
                            {detail.discount_amount > 0 && (
                              <>
                                <dt>Giảm giá{detail.discount_reason ? ` (${detail.discount_reason})` : ''}</dt>
                                <dd>−{formatMoney(detail.discount_amount)}</dd>
                              </>
                            )}
                            {detail.support_amount > 0 && (
                              <>
                                <dt>Hỗ trợ</dt>
                                <dd>−{formatMoney(detail.support_amount)}</dd>
                              </>
                            )}
                            <dt className="grand">Tổng cộng</dt>
                            <dd className="grand">{formatMoney(detail.total_amount)}</dd>
                            <dt>Đã thanh toán</dt>
                            <dd>{formatMoney(detail.amount_collected)}</dd>
                            {detail.amount_outstanding > 0 && (
                              <>
                                <dt>Còn phải trả tại quầy</dt>
                                <dd style={{ color: 'var(--danger)' }}>{formatMoney(detail.amount_outstanding)}</dd>
                              </>
                            )}
                            {detail.refund_due > 0 && (
                              <>
                                <dt>Phòng khám sẽ hoàn</dt>
                                <dd>{formatMoney(detail.refund_due)}</dd>
                              </>
                            )}
                          </dl>
                          <div className="record-actions">
                            <button
                              type="button"
                              className="btn btn-outline"
                              disabled={busyPdf === invoice.invoice_id}
                              onClick={() => downloadPdf(invoice)}
                            >
                              {busyPdf === invoice.invoice_id ? <Loader2 className="spin" size={16} /> : <FileDown size={16} />}
                              <span>Tải PDF</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {data && data.total_pages > 1 && (
          <div className="record-pager">
            <button type="button" className="btn btn-outline" disabled={!data.has_previous_page} onClick={() => setPage(page - 1)}>
              Trang trước
            </button>
            <span>
              Trang {data.page_number}/{data.total_pages}
            </span>
            <button type="button" className="btn btn-outline" disabled={!data.has_next_page} onClick={() => setPage(page + 1)}>
              Trang sau
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
