import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { apiExportInventoryReport, apiGetInventoryReport, apiSearchExpiringBatches } from '../../api/functions/pharmacy';
import { ExportButton } from '../components/ExportButton';
import type { MedicineBatch } from '../../api/staffTypes';
import { useApiQuery } from '../hooks';
import { formatDate, formatNumber, todayIso } from '../format';
import { useToast } from '../components/toastContext';
import { Button, FilterTabs, PageHeader, Pagination, Panel, TableState } from '../components/ui';
import { BatchActionDialog } from './BatchActionDialog';

const WINDOWS = [
  { value: '30', label: '30 ngày' },
  { value: '60', label: '60 ngày' },
  { value: '90', label: '90 ngày' },
];

/** Việc cần làm của nhà thuốc: thuốc dưới ngưỡng và lô sắp hết hạn, xử lý ngay tại chỗ. */
const InventoryReportPage = () => {
  const toast = useToast();
  const [within, setWithin] = useState('30');
  const [page, setPage] = useState(1);
  const [writingOff, setWritingOff] = useState<MedicineBatch | null>(null);

  const report = useApiQuery(() => apiGetInventoryReport({ expiring_within_days: Number(within), take: 10 }), [within]);
  const expiring = useApiQuery(
    () => apiSearchExpiringBatches({ within_days: Number(within), page_number: page, page_size: 20 }),
    [within, page],
  );
  const data = report.data;
  const batches = expiring.data?.items ?? [];
  const today = todayIso();

  const reload = () => {
    report.reload();
    expiring.reload();
  };

  return (
    <>
      <PageHeader
        title="Báo cáo kho"
        description={data ? `Số liệu tới ngày ${formatDate(data.as_of)}.` : 'Thuốc cần nhập thêm và lô cần dùng hoặc huỷ sớm.'}
        actions={
          <>
            <ExportButton
              download={() => apiExportInventoryReport({ expiring_within_days: Number(within) })}
              fileName="bao-cao-kho.xlsx"
            />
            <Button icon={<RefreshCw size={15} />} onClick={reload}>
              Làm mới
            </Button>
          </>
        }
      />

      <div className="st-stats">
        <div className="st-stat">
          <div className="st-stat-label">Thuốc đang kinh doanh</div>
          <div className="st-stat-value">{data ? formatNumber(data.medicine_count) : '—'}</div>
        </div>
        <Link to="/nha-thuoc/goi-y-nhap" className="st-stat">
          <div className="st-stat-label">Dưới ngưỡng tồn</div>
          <div className={`st-stat-value ${data && data.below_threshold_count > 0 ? 'danger' : ''}`}>
            {data ? formatNumber(data.below_threshold_count) : '—'}
          </div>
          <div className="st-stat-sub">Xem gợi ý nhập hàng</div>
        </Link>
        <div className="st-stat">
          <div className="st-stat-label">Lô hết hạn trong {within} ngày</div>
          <div className={`st-stat-value ${data && data.expiring_batch_count > 0 ? 'warning' : ''}`}>
            {data ? formatNumber(data.expiring_batch_count) : '—'}
          </div>
        </div>
      </div>

      <div className="st-grid-main">
        <Panel
          title="Lô sắp hết hạn"
          subtitle="Hạn gần nhất trước — đúng thứ tự xuất kho (FEFO)"
          bodyless
          actions={
            <FilterTabs
              label="Trong vòng"
              options={WINDOWS}
              value={within}
              onChange={(value) => {
                setWithin(value);
                setPage(1);
              }}
            />
          }
        >
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Lô</th>
                  <th>Hạn dùng</th>
                  <th className="st-num">Còn</th>
                  <th className="st-num">Đang giữ</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <TableState
                  columns={5}
                  loading={expiring.loading}
                  error={expiring.error}
                  isEmpty={batches.length === 0}
                  onRetry={expiring.reload}
                  emptyTitle="Không có lô nào sắp hết hạn"
                />
                {batches.map((batch) => {
                  const expired = Boolean(batch.expiry_date && batch.expiry_date < today);
                  return (
                    <tr key={batch.medicine_batch_id}>
                      <td>
                        <Link to={`/nha-thuoc/kho/${batch.medicine_id}`} className="st-cell-main" style={{ color: 'var(--primary)' }}>
                          Lô {batch.batch_number}
                        </Link>
                        <div className="st-cell-sub">{batch.supplier_name ?? 'Không rõ nhà cung cấp'}</div>
                      </td>
                      <td className="st-nowrap" style={{ color: expired ? 'var(--st-danger)' : 'var(--st-warning)', fontWeight: 600 }}>
                        {formatDate(batch.expiry_date)}
                        {expired && <div className="st-cell-sub">Đã quá hạn</div>}
                      </td>
                      <td className="st-num">{formatNumber(batch.quantity_remaining)}</td>
                      <td className="st-num">{formatNumber(batch.quantity_reserved)}</td>
                      <td className="st-num">
                        <Button size="sm" variant="danger" onClick={() => setWritingOff(batch)}>
                          Huỷ lô
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={expiring.data} onPage={setPage} />
        </Panel>

        <Panel title="Dưới ngưỡng tồn" subtitle="10 thuốc thiếu nhiều nhất" bodyless>
          <table className="st-table">
            <tbody>
              <TableState
                columns={2}
                loading={report.loading}
                error={report.error}
                isEmpty={(data?.below_threshold.length ?? 0) === 0}
                onRetry={report.reload}
                emptyTitle="Không thuốc nào dưới ngưỡng"
              />
              {data?.below_threshold.map((stock) => (
                <tr key={stock.medicine_id}>
                  <td>
                    <Link
                      to={`/nha-thuoc/kho/${stock.medicine_id}`}
                      state={{ stock }}
                      className="st-cell-main"
                      style={{ color: 'var(--primary)' }}
                    >
                      {stock.medicine_name}
                    </Link>
                    <div className="st-cell-sub">Ngưỡng {formatNumber(stock.low_stock_threshold)}</div>
                  </td>
                  <td className="st-num">
                    <div className="st-strong" style={{ color: 'var(--st-danger)' }}>
                      {formatNumber(stock.available_stock)}
                    </div>
                    <div className="st-cell-sub">{stock.unit_of_measure}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <BatchActionDialog
        batch={writingOff}
        kind={writingOff ? 'write-off' : null}
        onClose={() => setWritingOff(null)}
        onDone={(batch) => {
          setWritingOff(null);
          toast.success(`Đã huỷ thuốc ở lô ${batch.batch_number}.`);
          reload();
        }}
      />
    </>
  );
};

export default InventoryReportPage;
