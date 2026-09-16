import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { apiGetClinicDashboard } from '../../api/functions/admin';
import useAuth from '../../hooks/useAuth';
import { PERMISSION } from '../permissions';
import { useApiQuery } from '../hooks';
import { formatDate, formatMoney, todayIso } from '../format';
import { Alert, Button, Field, PageHeader, Panel } from '../components/ui';

interface Tile {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'warning' | 'danger' | 'success' | 'progress';
  to?: string;
}

/** Cả phòng khám trong một ngày, một lần gọi. Mỗi ô dẫn tới trang xử lý con số đó. */
const AdminDashboardPage = () => {
  const { hasPermission } = useAuth();
  const [date, setDate] = useState(todayIso());
  const query = useApiQuery(() => apiGetClinicDashboard(date), [date]);
  const data = query.data;
  const isToday = date === todayIso();

  const deskLink = (to: string) => (hasPermission(PERMISSION.AppointmentsManage) ? to : undefined);

  const groups: { title: string; tiles: Tile[] }[] = data
    ? [
        {
          title: 'Lịch hẹn',
          tiles: [
            { label: 'Tổng lịch trong ngày', value: data.appointments_today, sub: `${data.completed_today} đã khám xong`, to: deskLink('/thu-ngan') },
            {
              label: 'Chờ xác nhận',
              value: data.awaiting_confirmation,
              tone: data.awaiting_confirmation > 0 ? 'warning' : undefined,
              sub: 'Bệnh nhân tự đặt, chưa ai trả lời',
              to: deskLink('/thu-ngan'),
            },
            {
              label: 'Chờ duyệt giảm giá',
              value: data.awaiting_discount_approval,
              tone: data.awaiting_discount_approval > 0 ? 'warning' : undefined,
              to: deskLink('/thu-ngan'),
            },
            { label: 'Đang chờ khám', value: data.waiting_to_be_seen, tone: data.waiting_to_be_seen > 0 ? 'progress' : undefined, sub: `${data.in_progress} đang trong phòng khám` },
          ],
        },
        {
          title: 'Tiền & kho',
          tiles: [
            { label: 'Doanh thu thuần', value: formatMoney(data.net_revenue_today), tone: 'success', to: hasPermission(PERMISSION.ReportsViewRevenue) ? '/quan-tri/doanh-thu' : undefined },
            {
              label: 'Chờ quyết toán',
              value: data.awaiting_settlement,
              tone: data.awaiting_settlement > 0 ? 'warning' : undefined,
              sub: 'Lượt khám xong chưa thu tiền',
              to: hasPermission(PERMISSION.PaymentsManage) ? '/thu-ngan/cho-thanh-toan' : undefined,
            },
            {
              label: 'Thuốc dưới ngưỡng',
              value: data.medicines_below_threshold,
              tone: data.medicines_below_threshold > 0 ? 'danger' : undefined,
              to: hasPermission(PERMISSION.InventoryViewAdjust) ? '/nha-thuoc/goi-y-nhap' : undefined,
            },
            { label: 'Bác sĩ đang hoạt động', value: data.active_doctors, to: hasPermission(PERMISSION.DoctorSchedulesManage) ? '/quan-tri/lich-lam-viec' : undefined },
          ],
        },
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description={isToday ? 'Phòng khám hôm nay.' : `Phòng khám ngày ${formatDate(date)}.`}
        actions={
          <>
            <Field label="Ngày">
              {(id) => <input id={id} type="date" className="st-input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />}
            </Field>
            <Button icon={<RefreshCw size={15} />} onClick={query.reload} style={{ alignSelf: 'flex-end' }}>
              Làm mới
            </Button>
          </>
        }
      />

      {query.error && <Alert tone="danger" className="st-alert-gap">{query.error}</Alert>}

      {!data && query.loading && (
        <div className="st-stats">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="st-stat">
              <span className="st-skel" style={{ width: '60%' }} />
              <span className="st-skel" style={{ width: '40%', height: 24, marginTop: 8 }} />
            </div>
          ))}
        </div>
      )}

      <div style={{ opacity: query.loading ? 0.6 : 1, transition: 'opacity 160ms' }}>
        {groups.map((group) => (
          <Panel key={group.title} title={group.title} className="st-alert-gap">
            <div className="st-stats" style={{ marginBottom: 0 }}>
              {group.tiles.map((tile) => {
                const body = (
                  <>
                    <div className="st-stat-label">{tile.label}</div>
                    <div className={`st-stat-value ${tile.tone ?? ''}`}>{tile.value}</div>
                    {tile.sub && <div className="st-stat-sub">{tile.sub}</div>}
                  </>
                );
                return tile.to ? (
                  <Link key={tile.label} to={tile.to} className="st-stat">
                    {body}
                  </Link>
                ) : (
                  <div key={tile.label} className="st-stat">
                    {body}
                  </div>
                );
              })}
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
};

export default AdminDashboardPage;
