import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiGetReorderSuggestions } from '../../api/functions/pharmacy';
import { useApiQuery, useDebounced } from '../hooks';
import { Button, PageHeader } from '../components/ui';
import { StockFilters } from './StockFilters';
import { emptyStockFilter } from './stockFilterValue';
import type { StockFilterValue } from './stockFilterValue';
import { StockTable } from './StockTable';

/** Thuốc đã chạm ngưỡng, kèm số lượng nên nhập để đủ số ngày dự trữ trong cài đặt. */
const ReorderPage = () => {
  const [filter, setFilter] = useState<StockFilterValue>(emptyStockFilter);
  const [page, setPage] = useState(1);
  const search = useDebounced(filter.search);
  const group = useDebounced(filter.medicine_group);

  const query = useApiQuery(
    () =>
      apiGetReorderSuggestions({
        search,
        medicine_group: group,
        velocity_class: filter.velocity_class,
        criticality_level: filter.criticality_level,
        page_number: page,
        page_size: 25,
      }),
    [search, group, filter.velocity_class, filter.criticality_level, page],
  );

  return (
    <>
      <PageHeader
        title="Gợi ý nhập hàng"
        description="Số lượng đề xuất tính từ mức bán trung bình mỗi ngày và số ngày dự trữ trong cài đặt kho."
        actions={
          <Button icon={<RefreshCw size={15} />} onClick={query.reload}>
            Làm mới
          </Button>
        }
      />
      <section className="st-panel">
        <StockFilters
          hideBelowThreshold
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
        />
        <StockTable
          showReorder
          page={query.data}
          loading={query.loading}
          error={query.error}
          onRetry={query.reload}
          onPage={setPage}
          emptyTitle="Chưa có thuốc nào cần nhập"
          emptyText="Mọi thuốc đều còn trên ngưỡng tồn tối thiểu."
        />
      </section>
    </>
  );
};

export default ReorderPage;
