import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { apiSearchMedicineStock } from '../../api/functions/pharmacy';
import { useApiQuery, useDebounced } from '../hooks';
import { Button, PageHeader } from '../components/ui';
import { StockFilters } from './StockFilters';
import { emptyStockFilter } from './stockFilterValue';
import type { StockFilterValue } from './stockFilterValue';
import { StockTable } from './StockTable';
import { MedicineFormSheet } from './MedicineFormSheet';

const InventoryPage = () => {
  const [filter, setFilter] = useState<StockFilterValue>(emptyStockFilter);
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const search = useDebounced(filter.search);
  const group = useDebounced(filter.medicine_group);

  const query = useApiQuery(
    () =>
      apiSearchMedicineStock({
        search,
        medicine_group: group,
        velocity_class: filter.velocity_class,
        criticality_level: filter.criticality_level,
        below_threshold_only: filter.below_threshold_only || undefined,
        page_number: page,
        page_size: 25,
      }),
    [search, group, filter.velocity_class, filter.criticality_level, filter.below_threshold_only, page],
  );

  return (
    <>
      <PageHeader
        title="Tồn kho thuốc"
        description="Khả dụng = tồn dùng được trừ phần đang giữ cho đơn. Bấm vào một thuốc để xem lô, nhập lô mới hoặc chỉnh ngưỡng."
        actions={
          <>
            <Button icon={<RefreshCw size={15} />} onClick={query.reload}>
              Làm mới
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setAdding(true)}>
              Thêm thuốc
            </Button>
          </>
        }
      />
      <section className="st-panel">
        <StockFilters
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
        />
        <StockTable
          page={query.data}
          loading={query.loading}
          error={query.error}
          onRetry={query.reload}
          onPage={setPage}
          emptyTitle="Không có thuốc khớp bộ lọc"
          emptyText="Thử bỏ bớt điều kiện lọc."
        />
      </section>

      <MedicineFormSheet
        open={adding}
        medicine={null}
        onClose={() => setAdding(false)}
        onSaved={(stock) => {
          setAdding(false);
          navigate(`/nha-thuoc/kho/${stock.medicine_id}`, { state: { stock } });
        }}
      />
    </>
  );
};

export default InventoryPage;
