import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSearchInvoices } from '../../api/functions/desk';
import { useApiQuery, useDebounced } from '../hooks';
import { formatDateTime, formatMoney } from '../format';
import { INVOICE_STATUS, labelOf, PAYMENT_STATUS } from '../labels';
import { Field, FilterTabs, PageHeader, Pagination, SearchInput, StatusBadge, TableState } from '../components/ui';

const TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'unpaid', label: 'Chưa thanh toán' },
  { value: 'partially_paid', label: 'Thu một phần' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
];

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);

  const query = useApiQuery(
    () =>
      apiSearchInvoices({
        payment_status: paymentStatus,
        search: debounced,
        from_date: fromDate,
        to_date: toDate,
        page_number: page,
        page_size: 20,
      }),
    [paymentStatus, debounced, fromDate, toDate, page],
  );
  const items = query.data?.items ?? [];

  return (
    <>
      <PageHeader title="Hoá đơn" description="Tra cứu hoá đơn, thu phần còn nợ hoặc hoàn phần thu dư." />
      <section className="st-panel">
        <div className="st-toolbar">
          <FilterTabs label="Trạng thái thanh toán" options={TABS} value={paymentStatus} onChange={(value) => { setPaymentStatus(value); setPage(1); }} />
        </div>
        <div className="st-toolbar" style={{ borderRadius: 0 }}>
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Số hoá đơn, tên hoặc mã bệnh nhân…" />
          <Field label="Từ ngày">
            {(id) => <input id={id} type="date" className="st-input" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />}
          </Field>
          <Field label="Đến ngày">
            {(id) => <input id={id} type="date" className="st-input" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />}
          </Field>
        </div>
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Số hoá đơn</th>
                <th>Bệnh nhân</th>
                <th className="st-num">Tổng tiền</th>
                <th className="st-num">Đã thu</th>
                <th>Hoá đơn</th>
                <th>Thanh toán</th>
                <th>Tạo lúc</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                columns={7}
                loading={query.loading}
                error={query.error}
                isEmpty={items.length === 0}
                onRetry={query.reload}
                emptyTitle="Không có hoá đơn"
                emptyText="Thử đổi bộ lọc hoặc khoảng ngày."
              />
              {items.map((invoice) => (
                <tr key={invoice.invoice_id} className="st-row-link" onClick={() => navigate(`/thu-ngan/hoa-don/${invoice.invoice_id}`)}>
                  <td className="st-strong st-mono">{invoice.invoice_number}</td>
                  <td>
                    <div className="st-cell-main">{invoice.patient_full_name}</div>
                    <div className="st-cell-sub st-mono">{invoice.patient_code}</div>
                  </td>
                  <td className="st-num st-strong">{formatMoney(invoice.total_amount)}</td>
                  <td className="st-num">{formatMoney(invoice.amount_collected)}</td>
                  <td>
                    <StatusBadge value={labelOf(INVOICE_STATUS, invoice.invoice_status)} />
                  </td>
                  <td>
                    <StatusBadge value={labelOf(PAYMENT_STATUS, invoice.payment_status)} />
                  </td>
                  <td className="st-nowrap">{formatDateTime(invoice.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={query.data} onPage={setPage} />
      </section>
    </>
  );
};

export default InvoicesPage;
