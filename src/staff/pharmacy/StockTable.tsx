import { useNavigate } from 'react-router-dom';
import type { MedicineStock } from '../../api/staffTypes';
import type { PagedResponse } from '../../api/types';
import { formatDate, formatNumber, todayIso } from '../format';
import { CRITICALITY_LEVEL, labelOf, VELOCITY_CLASS } from '../labels';
import { Badge, Pagination, StatusBadge, TableState } from '../components/ui';

interface StockTableProps {
  page: PagedResponse<MedicineStock> | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPage: (page: number) => void;
  showReorder?: boolean;
  emptyTitle: string;
  emptyText?: string;
}

/** Hạn dùng trong 90 ngày tới thì đánh dấu, để ưu tiên xuất trước. */
const SOON = todayIso(90);

export const StockTable = ({ page, loading, error, onRetry, onPage, showReorder, emptyTitle, emptyText }: StockTableProps) => {
  const navigate = useNavigate();
  const items = page?.items ?? [];
  const columns = showReorder ? 8 : 7;

  return (
    <>
      <div className="st-table-wrap">
        <table className="st-table">
          <thead>
            <tr>
              <th>Thuốc</th>
              <th>Nhóm</th>
              <th className="st-num">Khả dụng</th>
              <th className="st-num">Đang giữ</th>
              <th className="st-num">Ngưỡng</th>
              {showReorder && <th className="st-num">Nên nhập</th>}
              <th>HSD gần nhất</th>
              <th>Phân loại</th>
            </tr>
          </thead>
          <tbody>
            <TableState
              columns={columns}
              loading={loading}
              error={error}
              isEmpty={items.length === 0}
              onRetry={onRetry}
              emptyTitle={emptyTitle}
              emptyText={emptyText}
            />
            {items.map((item) => {
              const expiringSoon = item.earliest_expiry_date !== null && item.earliest_expiry_date <= SOON;
              return (
                <tr key={item.medicine_id} className="st-row-link" onClick={() => navigate(`/nha-thuoc/kho/${item.medicine_id}`, { state: { stock: item } })}>
                  <td>
                    <div className="st-cell-main">{item.medicine_name}</div>
                    <div className="st-cell-sub">
                      {item.active_ingredient ?? '—'} · {item.packaging ?? item.unit_of_measure}
                    </div>
                  </td>
                  <td>{item.medicine_group ?? '—'}</td>
                  <td className="st-num">
                    <span className={item.is_below_threshold ? 'st-strong' : undefined} style={item.is_below_threshold ? { color: 'var(--st-danger)' } : undefined}>
                      {formatNumber(item.available_stock)}
                    </span>
                    <div className="st-cell-sub">tồn {formatNumber(item.current_stock)}</div>
                  </td>
                  <td className="st-num">{formatNumber(item.reserved_stock)}</td>
                  <td className="st-num">
                    {formatNumber(item.low_stock_threshold)}
                    {item.low_stock_threshold_is_manual && <div className="st-cell-sub">thủ công</div>}
                  </td>
                  {showReorder && <td className="st-num st-strong">{formatNumber(item.suggested_reorder_quantity)}</td>}
                  <td className="st-nowrap">
                    {expiringSoon ? <Badge tone="warning">{formatDate(item.earliest_expiry_date)}</Badge> : formatDate(item.earliest_expiry_date)}
                  </td>
                  <td>
                    <div className="st-chip-row">
                      {item.is_below_threshold && <Badge tone="danger">Dưới ngưỡng</Badge>}
                      <StatusBadge value={labelOf(VELOCITY_CLASS, item.velocity_class)} />
                      {item.criticality_level === 'critical' && <StatusBadge value={labelOf(CRITICALITY_LEVEL, item.criticality_level)} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} onPage={onPage} />
    </>
  );
};
