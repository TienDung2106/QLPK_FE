import { Link } from 'react-router-dom';
import type { PagedResponse } from '../../api/types';
import type { StockMovement } from '../../api/staffTypes';
import { formatDateTime, formatNumber } from '../format';
import { INVENTORY_ACTION, labelOf } from '../labels';
import { Pagination, StatusBadge, TableState } from '../components/ui';

const REFERENCE_LABEL: Record<string, string> = {
  prescription: 'Đơn thuốc',
  medicine_batch: 'Lô',
  appointment: 'Lượt khám',
  invoice: 'Hoá đơn',
};

/** Lịch sử biến động kho — chỉ đọc; không dòng nào bị sửa hay xoá. */
export const StockMovementTable = ({
  page,
  loading,
  error,
  onRetry,
  onPage,
  showMedicine,
}: {
  page: PagedResponse<StockMovement> | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPage: (page: number) => void;
  showMedicine: boolean;
}) => {
  const items = page?.items ?? [];
  const columns = showMedicine ? 7 : 6;

  return (
    <>
      <div className="st-table-wrap">
        <table className="st-table">
          <thead>
            <tr>
              <th>Thời điểm</th>
              {showMedicine && <th>Thuốc</th>}
              <th>Thao tác</th>
              <th className="st-num">Thay đổi</th>
              <th className="st-num">Trước → sau</th>
              <th>Người thực hiện</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            <TableState
              columns={columns}
              loading={loading}
              error={error}
              isEmpty={items.length === 0}
              onRetry={onRetry}
              emptyTitle="Chưa có biến động kho"
            />
            {items.map((row) => (
              <tr key={row.inventory_log_id}>
                <td className="st-nowrap">{formatDateTime(row.created_at)}</td>
                {showMedicine && (
                  <td>
                    <Link to={`/nha-thuoc/kho/${row.medicine_id}`} className="st-cell-main" style={{ color: 'var(--primary)' }}>
                      {row.medicine_name}
                    </Link>
                    {row.batch_number && <div className="st-cell-sub">Lô {row.batch_number}</div>}
                  </td>
                )}
                <td>
                  <StatusBadge value={labelOf(INVENTORY_ACTION, row.action)} />
                  {!showMedicine && row.batch_number && <div className="st-cell-sub">Lô {row.batch_number}</div>}
                </td>
                <td className="st-num st-strong" style={{ color: row.quantity_changed < 0 ? 'var(--st-danger)' : 'var(--st-success)' }}>
                  {row.quantity_changed > 0 ? '+' : ''}
                  {formatNumber(row.quantity_changed)}
                </td>
                <td className="st-num st-nowrap st-muted">
                  {formatNumber(row.quantity_before)} → {formatNumber(row.quantity_after)}
                </td>
                <td>{row.account_name ?? <span className="st-muted">Hệ thống</span>}</td>
                <td>
                  {row.notes ?? '—'}
                  {row.reference_type && (
                    <div className="st-cell-sub">
                      {REFERENCE_LABEL[row.reference_type] ?? row.reference_type} #{row.reference_id}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} onPage={onPage} />
    </>
  );
};
