import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RefreshCw, Stethoscope } from 'lucide-react';
import { apiGetDoctorSchedule } from '../../api/functions/doctorWork';
import { useApiQuery } from '../hooks';
import { formatDate, formatTime, todayIso } from '../format';
import { APPOINTMENT_STATUS, CONSULTATION_MODE_LABEL, labelOf, textOf } from '../labels';
import { Button, Field, FilterTabs, PageHeader, StatusBadge, TableState } from '../components/ui';

const STATUS_TABS = [
  { value: 'active', label: 'Cần khám' },
  { value: '', label: 'Tất cả' },
  { value: 'completed', label: 'Đã xong' },
  { value: 'cancelled', label: 'Đã huỷ' },
];

const ACTIVE = ['confirmed', 'checked_in', 'in_progress', 'pending', 'pending_approval'];

function shiftDate(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Hàng đợi của bác sĩ trong một ngày. Người đã nhận phòng xếp lên đầu theo số thứ tự,
 * vì đó là người đang ngồi chờ ngoài cửa.
 */
const DoctorSchedulePage = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayIso());
  const [tab, setTab] = useState('active');

  const query = useApiQuery(
    () =>
      apiGetDoctorSchedule({
        from_date: date,
        to_date: date,
        status: tab === 'active' || tab === '' ? undefined : tab,
        page_size: 100,
      }),
    [date, tab],
  );

  const rows = useMemo(() => {
    const items = (query.data?.items ?? []).filter((item) => tab !== 'active' || ACTIVE.includes(item.status));
    const rank = (status: string) => (status === 'in_progress' ? 0 : status === 'checked_in' ? 1 : 2);
    return [...items].sort(
      (a, b) =>
        rank(a.status) - rank(b.status) ||
        (a.queue_number ?? 9999) - (b.queue_number ?? 9999) ||
        a.appointment_time.localeCompare(b.appointment_time),
    );
  }, [query.data, tab]);

  const waiting = (query.data?.items ?? []).filter((item) => item.status === 'checked_in').length;
  const isToday = date === todayIso();

  return (
    <>
      <PageHeader
        title="Lịch khám của tôi"
        description={
          isToday
            ? waiting > 0
              ? `${waiting} bệnh nhân đã nhận phòng và đang chờ khám.`
              : 'Chưa có bệnh nhân nào đang chờ ngoài phòng.'
            : `Lịch ngày ${formatDate(date)}.`
        }
        actions={
          <Button icon={<RefreshCw size={15} />} onClick={query.reload}>
            Làm mới
          </Button>
        }
      />

      <section className="st-panel">
        <div className="st-toolbar">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.35rem' }}>
            <Button iconOnly variant="ghost" aria-label="Ngày trước" icon={<ChevronLeft size={16} />} onClick={() => setDate(shiftDate(date, -1))} />
            <Field label="Ngày">
              {(id) => <input id={id} type="date" className="st-input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />}
            </Field>
            <Button iconOnly variant="ghost" aria-label="Ngày sau" icon={<ChevronRight size={16} />} onClick={() => setDate(shiftDate(date, 1))} />
            {!isToday && (
              <Button variant="ghost" size="sm" onClick={() => setDate(todayIso())}>
                Hôm nay
              </Button>
            )}
          </div>
          <FilterTabs label="Lọc trạng thái" options={STATUS_TABS} value={tab} onChange={setTab} />
        </div>

        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Giờ</th>
                <th>Bệnh nhân</th>
                <th>Hình thức</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <TableState
                columns={6}
                loading={query.loading}
                error={query.error}
                isEmpty={rows.length === 0}
                onRetry={query.reload}
                emptyTitle="Không có lịch khám"
                emptyText={tab === 'active' ? 'Không còn bệnh nhân nào cần khám trong ngày này.' : 'Không có lịch hẹn khớp bộ lọc.'}
              />
              {rows.map((item) => {
                const canExamine = ['checked_in', 'in_progress'].includes(item.status);
                return (
                  <tr
                    key={item.appointment_id}
                    className="st-row-link"
                    onClick={() => navigate(`/bac-si/kham/${item.appointment_id}`, { state: { appointment: item } })}
                  >
                    <td>
                      <span className={`st-queue ${item.queue_number ? '' : 'empty'}`}>{item.queue_number ?? '—'}</span>
                    </td>
                    <td className="st-strong">
                      {formatTime(item.appointment_time)}
                      <div className="st-cell-sub">{item.duration_minutes} phút</div>
                    </td>
                    <td>
                      <div className="st-cell-main">{item.patient_full_name}</div>
                      <div className="st-cell-sub">Lượt khám #{item.appointment_id}</div>
                    </td>
                    <td>{textOf(CONSULTATION_MODE_LABEL, item.consultation_mode)}</td>
                    <td>
                      <StatusBadge value={labelOf(APPOINTMENT_STATUS, item.status)} />
                    </td>
                    <td className="st-num">
                      <Button size="sm" variant={canExamine ? 'primary' : 'ghost'} icon={canExamine ? <Stethoscope size={14} /> : undefined}>
                        {item.status === 'in_progress' ? 'Tiếp tục khám' : item.status === 'checked_in' ? 'Khám' : 'Xem'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default DoctorSchedulePage;
