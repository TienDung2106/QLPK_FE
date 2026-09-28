import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, History } from 'lucide-react';
import {
  apiMarkAllAppointmentChangesSeen,
  apiMarkAppointmentChangeSeen,
  apiSearchAppointmentChanges,
} from '../../api/functions/desk';
import type { AppointmentChange, AppointmentSnapshot } from '../../api/staffTypes';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, formatDateTime, formatMoney, formatTime } from '../format';
import { APPOINTMENT_STATUS, labelOf } from '../labels';
import { useToast } from '../components/toastContext';
import { Alert, Button, EmptyState, FilterTabs, PageHeader, Pagination, Panel, StatusBadge } from '../components/ui';

const TABS = [
  { value: 'unseen', label: 'Chưa xem' },
  { value: 'all', label: 'Tất cả' },
];

/** Mỗi dòng so sánh: nhãn và cách đọc giá trị từ một ảnh chụp lịch. */
const ROWS: { label: string; read: (snapshot: AppointmentSnapshot) => string }[] = [
  {
    label: 'Ngày giờ',
    read: (snapshot) => `${formatDate(snapshot.appointment_date)} lúc ${formatTime(snapshot.appointment_time)}`,
  },
  {
    label: 'Dịch vụ',
    read: (snapshot) =>
      snapshot.services.map((line) => (line.quantity > 1 ? `${line.service_name} ×${line.quantity}` : line.service_name)).join(', ') ||
      '—',
  },
  { label: 'Thời lượng', read: (snapshot) => `${snapshot.duration_minutes} phút` },
  {
    label: 'Chi phí',
    read: (snapshot) =>
      formatMoney(snapshot.total_amount) + (snapshot.discount_percent > 0 ? ` (giảm ${snapshot.discount_percent}%)` : ''),
  },
  { label: 'Lý do khám', read: (snapshot) => snapshot.reason_for_visit || '—' },
];

/** Báo cho badge ở menu đếm lại ngay, không đợi chu kỳ. */
const notifySeen = () => window.dispatchEvent(new Event('appointment-changes-seen'));

/** Các lần bệnh nhân tự sửa lịch trên ứng dụng, cũ → mới, để quầy nắm và xử lý. */
const DeskAppointmentChangesPage = () => {
  const toast = useToast();
  const { run, isPending } = useAction();
  const [tab, setTab] = useState('unseen');
  const [pageNumber, setPageNumber] = useState(1);

  const query = useApiQuery(
    () => apiSearchAppointmentChanges({ unseen_only: tab === 'unseen', page_number: pageNumber, page_size: 20 }),
    [tab, pageNumber],
  );

  const markSeen = async (change: AppointmentChange) => {
    const result = await run(`seen-${change.appointment_change_log_id}`, () =>
      apiMarkAppointmentChangeSeen(change.appointment_change_log_id),
    );
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    notifySeen();
    query.reload();
  };

  const markAllSeen = async () => {
    const result = await run('seen-all', apiMarkAllAppointmentChangesSeen);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Đã đánh dấu xem hết.');
    notifySeen();
    query.reload();
  };

  const items = query.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Lịch bệnh nhân sửa"
        description="Bệnh nhân tự đổi dịch vụ, ngày giờ hoặc lý do khám trên ứng dụng. Xem cũ → mới rồi đánh dấu đã xem."
        actions={
          tab === 'unseen' &&
          items.length > 0 && (
            <Button icon={<CheckCheck size={16} />} loading={isPending('seen-all')} onClick={markAllSeen}>
              Đã xem hết
            </Button>
          )
        }
      />

      <FilterTabs
        label="Lọc theo đã xem"
        options={TABS}
        value={tab}
        onChange={(value) => {
          setTab(value);
          setPageNumber(1);
        }}
      />

      {query.error && <Alert tone="danger">{query.error}</Alert>}

      {!query.loading && items.length === 0 ? (
        <EmptyState
          icon={<History size={32} strokeWidth={1.6} />}
          title={tab === 'unseen' ? 'Không có lịch nào mới bị sửa' : 'Chưa có lần sửa nào'}
        />
      ) : (
        <div className="st-change-list">
          {items.map((change) => (
            <Panel
              key={change.appointment_change_log_id}
              title={
                <>
                  {change.patient_full_name} <StatusBadge value={labelOf(APPOINTMENT_STATUS, change.status)} />
                </>
              }
              subtitle={`Bác sĩ ${change.doctor_full_name} · sửa lúc ${formatDateTime(change.changed_at)}${
                change.seen_at ? ` · ${change.seen_by_full_name ?? 'quầy'} đã xem ${formatDateTime(change.seen_at)}` : ''
              }`}
              actions={
                <>
                  <Link className="st-btn st-btn-ghost st-btn-sm" to={`/thu-ngan/lich-hen/${change.appointment_id}`}>
                    Mở lịch hẹn
                  </Link>
                  {!change.seen_at && (
                    <Button
                      size="sm"
                      variant="primary"
                      loading={isPending(`seen-${change.appointment_change_log_id}`)}
                      onClick={() => markSeen(change)}
                    >
                      Đã xem
                    </Button>
                  )}
                </>
              }
            >
              <table className="st-change-table">
                <thead>
                  <tr>
                    <th scope="col" />
                    <th scope="col">Cũ</th>
                    <th scope="col">Mới</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => {
                    const before = row.read(change.before);
                    const after = row.read(change.after);
                    return (
                      <tr key={row.label} className={before !== after ? 'is-changed' : undefined}>
                        <th scope="row">{row.label}</th>
                        <td>{before}</td>
                        <td>{after}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
          ))}
        </div>
      )}

      <Pagination page={query.data} onPage={setPageNumber} />
    </>
  );
};

export default DeskAppointmentChangesPage;
