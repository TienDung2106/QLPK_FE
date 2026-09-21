import { apiExportAppointmentReport, apiGetAppointmentReport } from '../../api/functions/admin';
import { ExportButton } from '../components/ExportButton';
import { useApiQuery } from '../hooks';
import { formatDate, formatNumber, formatPercent } from '../format';
import { APPOINTMENT_STATUS, labelOf } from '../labels';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { useDateRange } from '../components/dateRange';
import { Alert, EmptyState, PageHeader, Panel, StatusBadge } from '../components/ui';

/** Lịch hẹn đi về đâu: theo trạng thái, theo bác sĩ, và tỉ lệ không thành (huỷ + không đến). */
const AppointmentReportPage = () => {
  const range = useDateRange();
  const query = useApiQuery(() => apiGetAppointmentReport(range.fromDate, range.toDate), [range.fromDate, range.toDate], {
    enabled: range.valid,
  });
  const report = query.data;
  const statuses = Object.entries(report?.by_status ?? {}).sort((a, b) => b[1] - a[1]);
  const maxStatus = Math.max(1, ...statuses.map(([, count]) => count));

  return (
    <>
      <PageHeader
        title="Báo cáo lịch hẹn"
        description="Số lịch theo ngày hẹn, gồm cả lịch đã huỷ và không đến."
        actions={
          <ExportButton
            download={() => apiExportAppointmentReport(range.fromDate, range.toDate)}
            fileName={`bao-cao-lich-hen-${range.fromDate}-${range.toDate}.xlsx`}
            disabled={!range.valid}
          />
        }
      />
      <DateRangeFilter state={range} />

      {!range.valid && <Alert tone="warning">Chọn ngày bắt đầu không muộn hơn ngày kết thúc.</Alert>}
      {query.error && <Alert tone="danger">{query.error}</Alert>}

      {report && (
        <div className="st-stack" style={{ opacity: query.loading ? 0.6 : 1, transition: 'opacity 160ms' }}>
          <div className="st-ledger">
            <div className="st-ledger-cell">
              <div className="st-ledger-label">Tổng lịch hẹn</div>
              <div className="st-ledger-value">{formatNumber(report.total_appointments)}</div>
            </div>
            <div className="st-ledger-cell">
              <div className="st-ledger-label">Đã khám xong</div>
              <div className="st-ledger-value positive">{formatNumber(report.completed)}</div>
            </div>
            <div className="st-ledger-cell">
              <div className="st-ledger-label">Đã huỷ</div>
              <div className="st-ledger-value">{formatNumber(report.cancelled)}</div>
            </div>
            <div className="st-ledger-cell">
              <div className="st-ledger-label">Không đến</div>
              <div className={`st-ledger-value ${report.no_show > 0 ? 'negative' : ''}`}>{formatNumber(report.no_show)}</div>
            </div>
            <div className="st-ledger-cell">
              <div className="st-ledger-label">Tỉ lệ không thành</div>
              <div className={`st-ledger-value ${report.attrition_percent >= 20 ? 'negative' : ''}`}>{formatPercent(report.attrition_percent)}</div>
            </div>
          </div>

          <div className="st-grid-2">
            <Panel title="Theo trạng thái" subtitle={`${formatDate(report.from_date)} – ${formatDate(report.to_date)}`} bodyless>
              {statuses.length === 0 ? (
                <EmptyState title="Không có lịch hẹn trong khoảng này" />
              ) : (
                <table className="st-table">
                  <tbody>
                    {statuses.map(([status, count]) => (
                      <tr key={status}>
                        <td style={{ width: '40%' }}>
                          <StatusBadge value={labelOf(APPOINTMENT_STATUS, status)} />
                        </td>
                        <td>
                          <div className="st-meter" style={{ maxWidth: 240 }}>
                            <span style={{ width: `${Math.max(2, (count / maxStatus) * 100)}%` }} />
                          </div>
                        </td>
                        <td className="st-num st-strong">{formatNumber(count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>

            <Panel title="Theo bác sĩ" bodyless>
              {report.by_doctor.length === 0 ? (
                <EmptyState title="Chưa có lịch hẹn" />
              ) : (
                <div className="st-table-wrap">
                  <table className="st-table">
                    <thead>
                      <tr>
                        <th>Bác sĩ</th>
                        <th className="st-num">Tổng</th>
                        <th className="st-num">Xong</th>
                        <th className="st-num">Huỷ</th>
                        <th className="st-num">Không đến</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...report.by_doctor]
                        .sort((a, b) => b.total_appointments - a.total_appointments)
                        .map((row) => (
                          <tr key={row.doctor_id}>
                            <td className="st-cell-main">{row.doctor_full_name}</td>
                            <td className="st-num st-strong">{formatNumber(row.total_appointments)}</td>
                            <td className="st-num">{formatNumber(row.completed)}</td>
                            <td className="st-num">{formatNumber(row.cancelled)}</td>
                            <td className="st-num" style={{ color: row.no_show > 0 ? 'var(--st-danger)' : undefined }}>
                              {formatNumber(row.no_show)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
    </>
  );
};

export default AppointmentReportPage;
