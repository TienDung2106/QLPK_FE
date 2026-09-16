import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, RefreshCw } from 'lucide-react';
import { apiBuildSettlementInvoice, apiSearchSettlementQueue } from '../../api/functions/desk';
import { useAction, useApiQuery, useDebounced } from '../hooks';
import { formatDate, formatMoney } from '../format';
import { DISPENSE_REQUEST_STATUS, labelOf, PRESCRIPTION_STATUS } from '../labels';
import { useToast } from '../components/toastContext';
import { Badge, Button, FilterTabs, PageHeader, Pagination, SearchInput, StatusBadge, TableState } from '../components/ui';

const TABS = [
  { value: 'awaiting_payment', label: 'Chờ lập hoá đơn' },
  { value: 'invoiced', label: 'Đã lập, chưa thu đủ' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: '', label: 'Tất cả' },
];

/**
 * Lượt khám đã xong và còn tiền phải quyết toán. Có đơn thuốc thì phải chờ nhà thuốc soạn
 * xong mới lập được hoá đơn — cột "Sẵn sàng" nói điều đó trước khi quầy bấm.
 */
const SettlementQueuePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { run, pending } = useAction();
  const [status, setStatus] = useState('awaiting_payment');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);

  const query = useApiQuery(
    () => apiSearchSettlementQueue({ status, search: debounced, page_number: page, page_size: 20 }),
    [status, debounced, page],
  );
  const items = query.data?.items ?? [];

  const settle = async (appointmentId: number) => {
    const result = await run(`settle-${appointmentId}`, () => apiBuildSettlementInvoice(appointmentId));
    if (result.ok && result.data) {
      navigate(`/thu-ngan/hoa-don/${result.data.invoice_id}`);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <PageHeader
        title="Chờ thanh toán"
        description="Lập hoá đơn quyết toán cho lượt khám đã xong: dịch vụ, phí khám và thuốc trên cùng một hoá đơn."
        actions={
          <Button icon={<RefreshCw size={15} />} onClick={query.reload}>
            Làm mới
          </Button>
        }
      />
      <section className="st-panel">
        <div className="st-toolbar">
          <FilterTabs label="Trạng thái" options={TABS} value={status} onChange={(value) => { setStatus(value); setPage(1); }} />
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Tên hoặc mã bệnh nhân…" />
        </div>
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Bệnh nhân</th>
                <th>Ngày khám</th>
                <th>Bác sĩ</th>
                <th>Đơn thuốc</th>
                <th className="st-num">Tổng / Đã thu</th>
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
                emptyTitle="Không có lượt khám chờ quyết toán"
                emptyText="Lượt khám hoàn tất có dịch vụ hoặc thuốc sẽ hiện ở đây."
              />
              {items.map((item) => (
                <tr key={item.dispense_request_id}>
                  <td>
                    <div className="st-cell-main">{item.patient_full_name}</div>
                    <div className="st-cell-sub st-mono">{item.patient_code}</div>
                  </td>
                  <td className="st-nowrap">{formatDate(item.appointment_date)}</td>
                  <td>{item.doctor_full_name}</td>
                  <td>
                    {item.has_prescription ? (
                      <StatusBadge value={labelOf(PRESCRIPTION_STATUS, item.prescription_status)} />
                    ) : (
                      <span className="st-muted">Không có</span>
                    )}
                  </td>
                  <td className="st-num">
                    {item.total_amount !== null ? (
                      <>
                        <div className="st-strong">{formatMoney(item.total_amount)}</div>
                        <div className="st-cell-sub">đã thu {formatMoney(item.amount_collected)}</div>
                      </>
                    ) : (
                      <span className="st-muted">Chưa lập</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge value={labelOf(DISPENSE_REQUEST_STATUS, item.status)} />
                  </td>
                  <td className="st-num">
                    {item.invoice_id ? (
                      <Button size="sm" onClick={() => navigate(`/thu-ngan/hoa-don/${item.invoice_id}`)}>
                        Xem hoá đơn
                      </Button>
                    ) : item.ready_to_settle ? (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Receipt size={14} />}
                        loading={pending === `settle-${item.appointment_id}`}
                        disabled={Boolean(pending)}
                        onClick={() => settle(item.appointment_id)}
                      >
                        Lập hoá đơn
                      </Button>
                    ) : (
                      <Badge tone="warning">Chờ nhà thuốc soạn</Badge>
                    )}
                  </td>
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

export default SettlementQueuePage;
