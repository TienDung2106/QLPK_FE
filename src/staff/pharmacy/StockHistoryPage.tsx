import { useState } from 'react';
import { apiSearchStockMovements } from '../../api/functions/pharmacy';
import { useApiQuery } from '../hooks';
import { todayIso } from '../format';
import { INVENTORY_ACTION } from '../labels';
import { Field, PageHeader } from '../components/ui';
import { StockMovementTable } from './StockMovementTable';

/** Mọi biến động kho của toàn nhà thuốc: nhập, giữ, giao, kiểm kê, huỷ, trả hàng. */
const StockHistoryPage = () => {
  const [action, setAction] = useState('');
  const [fromDate, setFromDate] = useState(todayIso(-30));
  const [toDate, setToDate] = useState(todayIso());
  const [page, setPage] = useState(1);

  const query = useApiQuery(
    () =>
      apiSearchStockMovements({
        action: action || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        page_number: page,
        page_size: 25,
      }),
    [action, fromDate, toDate, page],
  );

  const reset = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Lịch sử kho" description="Mọi biến động tồn kho, mới nhất trước. Không dòng nào sửa hay xoá được." />
      <section className="st-panel">
        <div className="st-toolbar">
          <Field label="Thao tác">
            {(id) => (
              <select id={id} className="st-select" value={action} onChange={(e) => reset(setAction)(e.target.value)}>
                <option value="">Tất cả</option>
                {Object.entries(INVENTORY_ACTION).map(([value, item]) => (
                  <option key={value} value={value}>
                    {item.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Từ ngày">
            {(id) => <input id={id} type="date" className="st-input" value={fromDate} max={toDate} onChange={(e) => reset(setFromDate)(e.target.value)} />}
          </Field>
          <Field label="Đến ngày">
            {(id) => <input id={id} type="date" className="st-input" value={toDate} min={fromDate} onChange={(e) => reset(setToDate)(e.target.value)} />}
          </Field>
        </div>
        <StockMovementTable
          page={query.data}
          loading={query.loading}
          error={query.error}
          onRetry={query.reload}
          onPage={setPage}
          showMedicine
        />
      </section>
    </>
  );
};

export default StockHistoryPage;
