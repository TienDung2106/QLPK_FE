import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { apiSearchPrescriptions } from '../../api/functions/pharmacy';
import { useApiQuery, useDebounced } from '../hooks';
import { formatDateTime, formatMoney } from '../format';
import { DISPENSE_REQUEST_STATUS, labelOf, PRESCRIPTION_STATUS } from '../labels';
import { Button, Field, FilterTabs, PageHeader, Pagination, SearchInput, StatusBadge, TableState } from '../components/ui';

const STATUS_TABS = [
  { value: 'pending', label: 'Chờ soạn' },
  { value: 'prepared', label: 'Đã soạn' },
  { value: 'awaiting_payment', label: 'Chờ thanh toán' },
  { value: 'partially_delivered', label: 'Giao một phần' },
  { value: 'delivered', label: 'Đã giao' },
  { value: '', label: 'Tất cả' },
];

/** Hàng đợi đơn thuốc của nhà thuốc. Mặc định mở ở "Chờ soạn" — việc cần làm trước. */
const PrescriptionsPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);

  const query = useApiQuery(
    () =>
      apiSearchPrescriptions({
        status: status || undefined,
        search: debounced || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        page_number: page,
        page_size: 20,
      }),
    [status, debounced, fromDate, toDate, page],
  );

  const items = query.data?.items ?? [];
  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Đơn thuốc"
        description="Soạn thuốc cho lượt khám đã xong, rồi giao cho bệnh nhân sau khi quầy thu tiền."
        actions={
          <Button icon={<RefreshCw size={15} />} onClick={query.reload} loading={query.loading && items.length > 0}>
            Làm mới
          </Button>
        }
      />

      <section className="st-panel">
        <div className="st-toolbar">
          <FilterTabs label="Trạng thái đơn" options={STATUS_TABS} value={status} onChange={resetPage(setStatus)} />
        </div>
        <div className="st-toolbar" style={{ borderRadius: 0 }}>
          <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Tên hoặc mã bệnh nhân…" />
          <Field label="Từ ngày">
            {(id) => (
              <input id={id} type="date" className="st-input" value={fromDate} onChange={(e) => resetPage(setFromDate)(e.target.value)} />
            )}
          </Field>
          <Field label="Đến ngày">
            {(id) => (
              <input id={id} type="date" className="st-input" value={toDate} onChange={(e) => resetPage(setToDate)(e.target.value)} />
            )}
          </Field>
        </div>

        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Bệnh nhân</th>
                <th>Bác sĩ</th>
                <th>Số thuốc</th>
                <th className="st-num">Giá trị giữ</th>
                <th>Tạo lúc</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                columns={8}
                loading={query.loading}
                error={query.error}
                isEmpty={items.length === 0}
                onRetry={query.reload}
                emptyTitle="Không có đơn thuốc nào"
                emptyText={status === 'pending' ? 'Chưa có đơn nào đang chờ soạn.' : 'Thử đổi bộ lọc hoặc khoảng ngày.'}
              />
              {items.map((item) => (
                <tr key={item.prescription_id} className="st-row-link" onClick={() => navigate(`/nha-thuoc/don-thuoc/${item.prescription_id}`)}>
                  <td className="st-strong">#{item.prescription_id}</td>
                  <td>
                    <div className="st-cell-main">{item.patient_full_name}</div>
                    <div className="st-cell-sub">Lượt khám #{item.appointment_id}</div>
                  </td>
                  <td>{item.doctor_full_name}</td>
                  <td>{item.items.length} loại</td>
                  <td className="st-num">{formatMoney(item.reserved_amount)}</td>
                  <td className="st-nowrap">{formatDateTime(item.created_at)}</td>
                  <td>
                    <StatusBadge value={labelOf(PRESCRIPTION_STATUS, item.status)} />
                  </td>
                  <td>
                    {item.settlement_status ? (
                      <StatusBadge value={labelOf(DISPENSE_REQUEST_STATUS, item.settlement_status)} />
                    ) : (
                      <span className="st-muted">—</span>
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

export default PrescriptionsPage;
