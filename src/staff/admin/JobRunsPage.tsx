import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiSearchJobRuns } from '../../api/functions/admin';
import { useApiQuery } from '../hooks';
import { formatDateTime, formatNumber } from '../format';
import { JOB_NAME_LABEL, JOB_RUN_STATUS, labelOf, textOf } from '../labels';
import { Button, FilterTabs, PageHeader, Pagination, StatusBadge, TableState } from '../components/ui';

const STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'running', label: 'Đang chạy' },
  { value: 'success', label: 'Thành công' },
  { value: 'failed', label: 'Thất bại' },
];

function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return '—';
  }
  if (seconds < 60) {
    return `${formatNumber(seconds, 1)} giây`;
  }
  return `${formatNumber(seconds / 60, 1)} phút`;
}

/** Các lượt chạy của tác vụ nền. Tác vụ treo hay lỗi sẽ lộ ra ở đây trước khi số liệu kho sai. */
const JobRunsPage = () => {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const query = useApiQuery(
    () => apiSearchJobRuns({ status: status || undefined, page_number: page, page_size: 20 }),
    [status, page],
  );
  const items = query.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Tác vụ nền"
        description="Lịch sử các lượt chạy tự động, mới nhất trước. Lượt đang chạy chưa có giờ kết thúc."
        actions={
          <Button icon={<RefreshCw size={15} />} onClick={query.reload}>
            Làm mới
          </Button>
        }
      />
      <section className="st-panel">
        <div className="st-toolbar">
          <FilterTabs
            label="Trạng thái"
            options={STATUS_TABS}
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
        </div>
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Tác vụ</th>
                <th>Bắt đầu</th>
                <th>Thời lượng</th>
                <th className="st-num">Bản ghi xử lý</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                columns={5}
                loading={query.loading}
                error={query.error}
                isEmpty={items.length === 0}
                onRetry={query.reload}
                emptyTitle="Chưa có lượt chạy nào"
              />
              {items.map((row) => (
                <tr key={row.job_run_log_id}>
                  <td>
                    <div className="st-cell-main">{textOf(JOB_NAME_LABEL, row.job_name)}</div>
                    <div className="st-cell-sub st-mono">{row.job_name}</div>
                    {row.error_message && (
                      <div className="st-cell-sub" style={{ color: 'var(--st-danger)', whiteSpace: 'pre-wrap' }}>
                        {row.error_message}
                      </div>
                    )}
                  </td>
                  <td className="st-nowrap">{formatDateTime(row.started_at)}</td>
                  <td className="st-nowrap">{row.finished_at ? formatDuration(row.duration_seconds) : 'Đang chạy…'}</td>
                  <td className="st-num">{formatNumber(row.affected_count)}</td>
                  <td>
                    <StatusBadge value={labelOf(JOB_RUN_STATUS, row.status)} />
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

export default JobRunsPage;
