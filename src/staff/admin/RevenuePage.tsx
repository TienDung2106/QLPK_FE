import { useMemo } from 'react';
import { apiGetRevenueReport } from '../../api/functions/admin';
import { useApiQuery } from '../hooks';
import { formatDate, formatMoney, formatNumber } from '../format';
import { PAYMENT_METHOD, textOf } from '../labels';
import { Alert, EmptyState, PageHeader, Panel } from '../components/ui';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { useDateRange } from '../components/dateRange';

const RevenuePage = () => {
  const range = useDateRange();
  const { fromDate, toDate, valid } = range;

  const query = useApiQuery(() => apiGetRevenueReport(fromDate, toDate), [fromDate, toDate], { enabled: valid });
  const report = query.data;

  const maxDay = useMemo(() => Math.max(1, ...(report?.by_day ?? []).map((day) => Math.abs(day.net))), [report]);
  const maxDoctor = useMemo(() => Math.max(1, ...(report?.by_doctor ?? []).map((doctor) => doctor.net)), [report]);

  return (
    <>
      <PageHeader title="Doanh thu" description="Tiền thực thu trừ tiền hoàn, theo ngày giờ phòng khám." />

      <DateRangeFilter state={range} />

      {!valid && <Alert tone="warning">Chọn ngày bắt đầu không muộn hơn ngày kết thúc.</Alert>}
      {query.error && <Alert tone="danger">{query.error}</Alert>}

      {report && (
        <div className="st-stack" style={{ opacity: query.loading ? 0.6 : 1, transition: 'opacity 160ms' }}>
          <div className="st-ledger">
            <div className="st-ledger-cell">
              <div className="st-ledger-label">Doanh thu thuần</div>
              <div className="st-ledger-value positive">{formatMoney(report.net_revenue)}</div>
            </div>
            <div className="st-ledger-cell">
              <div className="st-ledger-label">Đã thu · {formatNumber(report.payment_count)} giao dịch</div>
              <div className="st-ledger-value">{formatMoney(report.total_collected)}</div>
            </div>
            <div className="st-ledger-cell">
              <div className="st-ledger-label">Đã hoàn · {formatNumber(report.refund_count)} giao dịch</div>
              <div className={`st-ledger-value ${report.total_refunded > 0 ? 'negative' : ''}`}>{formatMoney(report.total_refunded)}</div>
            </div>
            <div className="st-ledger-cell">
              <div className="st-ledger-label">Từ dịch vụ</div>
              <div className="st-ledger-value">{formatMoney(report.services_revenue)}</div>
            </div>
            <div className="st-ledger-cell">
              <div className="st-ledger-label">Từ thuốc</div>
              <div className="st-ledger-value">{formatMoney(report.medicines_revenue)}</div>
            </div>
          </div>

          <Panel title="Doanh thu thuần theo ngày" subtitle={`${formatDate(report.from_date)} – ${formatDate(report.to_date)}`}>
            {report.by_day.length === 0 ? (
              <EmptyState title="Không có giao dịch trong khoảng này" />
            ) : (
              <>
                <div className="st-bars" role="img" aria-label="Biểu đồ doanh thu thuần theo ngày">
                  {report.by_day.map((day) => (
                    <div
                      key={day.date}
                      className="st-bar"
                      title={`${formatDate(day.date)}: thu ${formatMoney(day.collected)}, hoàn ${formatMoney(day.refunded)}, thuần ${formatMoney(day.net)}`}
                      style={{
                        height: `${Math.max(2, (Math.abs(day.net) / maxDay) * 100)}%`,
                        background: day.net < 0 ? 'var(--st-danger)' : undefined,
                      }}
                    />
                  ))}
                </div>
                <div className="st-bar-axis">
                  <span>{formatDate(report.by_day[0].date)}</span>
                  <span>Cao nhất {formatMoney(maxDay)}</span>
                  <span>{formatDate(report.by_day[report.by_day.length - 1].date)}</span>
                </div>
              </>
            )}
          </Panel>

          <div className="st-grid-2">
            <Panel title="Theo phương thức thanh toán" bodyless>
              {report.by_payment_method.length === 0 ? (
                <EmptyState title="Chưa có giao dịch" />
              ) : (
                <table className="st-table">
                  <thead>
                    <tr>
                      <th>Phương thức</th>
                      <th className="st-num">Thu</th>
                      <th className="st-num">Hoàn</th>
                      <th className="st-num">Thuần</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.by_payment_method.map((row) => (
                      <tr key={row.payment_method}>
                        <td className="st-cell-main">{textOf(PAYMENT_METHOD, row.payment_method)}</td>
                        <td className="st-num">{formatMoney(row.collected)}</td>
                        <td className="st-num">{formatMoney(row.refunded)}</td>
                        <td className="st-num st-strong">{formatMoney(row.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>

            <Panel title="Theo bác sĩ" bodyless>
              {report.by_doctor.length === 0 ? (
                <EmptyState title="Chưa có lượt khám có thu tiền" />
              ) : (
                <table className="st-table">
                  <thead>
                    <tr>
                      <th>Bác sĩ</th>
                      <th className="st-num">Lượt khám</th>
                      <th className="st-num">Thuần</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...report.by_doctor]
                      .sort((a, b) => b.net - a.net)
                      .map((row) => (
                        <tr key={row.doctor_id}>
                          <td>
                            <div className="st-cell-main">{row.doctor_full_name}</div>
                            <div className="st-meter" style={{ marginTop: 6, maxWidth: 220 }}>
                              <span style={{ width: `${Math.max(2, (row.net / maxDoctor) * 100)}%` }} />
                            </div>
                          </td>
                          <td className="st-num">{formatNumber(row.visit_count)}</td>
                          <td className="st-num st-strong">{formatMoney(row.net)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>
        </div>
      )}

      {!report && query.loading && (
        <div className="st-ledger">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="st-ledger-cell">
              <span className="st-skel" style={{ width: '50%' }} />
              <span className="st-skel" style={{ width: '80%', height: 20, marginTop: 8 }} />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default RevenuePage;
