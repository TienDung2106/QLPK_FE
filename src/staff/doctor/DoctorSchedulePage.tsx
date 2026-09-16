import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, RefreshCw, Stethoscope, X } from 'lucide-react';
import {
  apiDoctorConfirmAppointment,
  apiDoctorDeclineAppointment,
  apiGetDoctorDashboard,
  apiGetDoctorSchedule,
} from '../../api/functions/doctorWork';
import type { AppointmentListItem } from '../../api/types';
import useAuth from '../../hooks/useAuth';
import { PERMISSION } from '../permissions';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, formatTime, todayIso } from '../format';
import { APPOINTMENT_STATUS, CONSULTATION_MODE_LABEL, labelOf, textOf } from '../labels';
import { useToast } from '../components/toastContext';
import { Button, ConfirmDialog, Field, FilterTabs, PageHeader, StatusBadge, TableState } from '../components/ui';

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
 * vì đó là người đang ngồi chờ ngoài cửa. Tab "Chờ xác nhận" gom mọi lịch bệnh nhân tự đặt
 * đang đợi bác sĩ trả lời, không giới hạn theo ngày.
 */
const DoctorSchedulePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canConfirm = hasPermission(PERMISSION.AppointmentsConfirmOwn);
  const { run, isPending } = useAction();
  const [date, setDate] = useState(todayIso());
  const [tab, setTab] = useState('active');
  const [confirming, setConfirming] = useState<AppointmentListItem | null>(null);
  const [declining, setDeclining] = useState<AppointmentListItem | null>(null);

  const tabs = [
    { value: 'active', label: 'Cần khám' },
    ...(canConfirm ? [{ value: 'pending', label: 'Chờ xác nhận' }] : []),
    { value: '', label: 'Tất cả' },
    { value: 'completed', label: 'Đã xong' },
    { value: 'cancelled', label: 'Đã huỷ' },
  ];

  const pendingTab = tab === 'pending';
  const dashboard = useApiQuery(apiGetDoctorDashboard, []);
  const query = useApiQuery(
    () =>
      apiGetDoctorSchedule(
        pendingTab
          ? { from_date: todayIso(), to_date: todayIso(90), status: 'pending', page_size: 100 }
          : {
              from_date: date,
              to_date: date,
              status: tab === 'active' || tab === '' ? undefined : tab,
              page_size: 100,
            },
      ),
    [date, tab],
  );

  const rows = useMemo(() => {
    const items = (query.data?.items ?? []).filter((item) => tab !== 'active' || ACTIVE.includes(item.status));
    if (pendingTab) {
      return [...items].sort(
        (a, b) => a.appointment_date.localeCompare(b.appointment_date) || a.appointment_time.localeCompare(b.appointment_time),
      );
    }
    const rank = (status: string) => (status === 'in_progress' ? 0 : status === 'checked_in' ? 1 : 2);
    return [...items].sort(
      (a, b) =>
        rank(a.status) - rank(b.status) ||
        (a.queue_number ?? 9999) - (b.queue_number ?? 9999) ||
        a.appointment_time.localeCompare(b.appointment_time),
    );
  }, [query.data, tab, pendingTab]);

  const stats = dashboard.data;
  const isToday = date === todayIso();
  const waiting = stats?.waiting_to_be_seen ?? (query.data?.items ?? []).filter((item) => item.status === 'checked_in').length;

  const reloadAll = () => {
    query.reload();
    dashboard.reload();
  };

  const confirm = async () => {
    if (!confirming) {
      return;
    }
    const result = await run('confirm', () => apiDoctorConfirmAppointment(confirming.appointment_id));
    setConfirming(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Đã xác nhận lịch của ${confirming.patient_full_name}. Bệnh nhân nhận được mã nhận phòng.`);
    reloadAll();
  };

  const decline = async (reason: string) => {
    if (!declining) {
      return;
    }
    if (reason.length < 3) {
      toast.error('Lý do từ chối cần ít nhất 3 ký tự.');
      return;
    }
    const result = await run('decline', () => apiDoctorDeclineAppointment(declining.appointment_id, reason));
    setDeclining(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Đã từ chối lịch hẹn. Tiền trả trước (nếu có) được hoàn đủ.');
    reloadAll();
  };

  const openRow = (item: AppointmentListItem) =>
    navigate(`/bac-si/kham/${item.appointment_id}`, { state: { appointment: item } });

  return (
    <>
      <PageHeader
        title="Lịch khám của tôi"
        description={
          pendingTab
            ? 'Lịch bệnh nhân tự đặt đang chờ bạn xác nhận, trong 90 ngày tới.'
            : isToday
              ? waiting > 0
                ? `${waiting} bệnh nhân đã nhận phòng và đang chờ khám.`
                : 'Chưa có bệnh nhân nào đang chờ ngoài phòng.'
              : `Lịch ngày ${formatDate(date)}.`
        }
        actions={
          <Button icon={<RefreshCw size={15} />} onClick={reloadAll}>
            Làm mới
          </Button>
        }
      />

      {stats && (
        <div className="st-stats">
          <div className="st-stat">
            <div className="st-stat-label">Lịch hôm nay</div>
            <div className="st-stat-value">{stats.appointments_today}</div>
            <div className="st-stat-sub">{stats.completed_today} đã khám xong</div>
          </div>
          <button
            type="button"
            className="st-stat"
            onClick={() => {
              setDate(todayIso());
              setTab('active');
            }}
          >
            <div className="st-stat-label">Đang chờ khám</div>
            <div className={`st-stat-value ${stats.waiting_to_be_seen > 0 ? 'progress' : ''}`}>{stats.waiting_to_be_seen}</div>
            <div className="st-stat-sub">{stats.in_progress} đang trong phòng khám</div>
          </button>
          {canConfirm && (
            <button type="button" className="st-stat" onClick={() => setTab('pending')}>
              <div className="st-stat-label">Chờ bạn xác nhận</div>
              <div className={`st-stat-value ${stats.awaiting_confirmation > 0 ? 'warning' : ''}`}>{stats.awaiting_confirmation}</div>
              <div className="st-stat-sub">
                {stats.awaiting_discount_approval > 0 ? `${stats.awaiting_discount_approval} chờ quầy duyệt giảm giá` : 'Lịch bệnh nhân tự đặt'}
              </div>
            </button>
          )}
          {stats.next_appointment ? (
            <button type="button" className="st-stat" onClick={() => openRow(stats.next_appointment!)}>
              <div className="st-stat-label">Bệnh nhân kế tiếp</div>
              <div className="st-stat-value" style={{ fontSize: '1.05rem', marginTop: '0.3rem' }}>
                {stats.next_appointment.patient_full_name}
              </div>
              <div className="st-stat-sub">
                {formatTime(stats.next_appointment.appointment_time)}
                {stats.next_appointment.queue_number ? ` · STT ${stats.next_appointment.queue_number}` : ''}
              </div>
            </button>
          ) : (
            <div className="st-stat">
              <div className="st-stat-label">Bệnh nhân kế tiếp</div>
              <div className="st-stat-sub" style={{ marginTop: '0.45rem' }}>
                Không còn ai trong hôm nay.
              </div>
            </div>
          )}
        </div>
      )}

      <section className="st-panel">
        <div className="st-toolbar">
          {!pendingTab && (
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
          )}
          <FilterTabs label="Lọc trạng thái" options={tabs} value={tab} onChange={setTab} />
        </div>

        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>{pendingTab ? 'Ngày' : 'STT'}</th>
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
                emptyTitle={pendingTab ? 'Không có lịch chờ xác nhận' : 'Không có lịch khám'}
                emptyText={
                  pendingTab
                    ? 'Mọi lịch bệnh nhân đặt với bạn đều đã được trả lời.'
                    : tab === 'active'
                      ? 'Không còn bệnh nhân nào cần khám trong ngày này.'
                      : 'Không có lịch hẹn khớp bộ lọc.'
                }
              />
              {rows.map((item) => {
                const canExamine = ['checked_in', 'in_progress'].includes(item.status);
                const awaitingAnswer = canConfirm && item.status === 'pending';
                return (
                  <tr key={item.appointment_id} className="st-row-link" onClick={() => openRow(item)}>
                    <td>
                      {pendingTab ? (
                        <span className="st-strong st-nowrap">{formatDate(item.appointment_date)}</span>
                      ) : (
                        <span className={`st-queue ${item.queue_number ? '' : 'empty'}`}>{item.queue_number ?? '—'}</span>
                      )}
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
                    <td className="st-num st-nowrap">
                      {awaitingAnswer ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<X size={14} />}
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeclining(item);
                            }}
                          >
                            Từ chối
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={<Check size={14} />}
                            onClick={(event) => {
                              event.stopPropagation();
                              setConfirming(item);
                            }}
                          >
                            Xác nhận
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant={canExamine ? 'primary' : 'ghost'} icon={canExamine ? <Stethoscope size={14} /> : undefined}>
                          {item.status === 'in_progress' ? 'Tiếp tục khám' : item.status === 'checked_in' ? 'Khám' : 'Xem'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={confirming !== null}
        title="Xác nhận lịch hẹn?"
        text={
          confirming
            ? `${confirming.patient_full_name} · ${formatDate(confirming.appointment_date)} lúc ${formatTime(confirming.appointment_time)}. Bệnh nhân sẽ nhận mã nhận phòng.`
            : undefined
        }
        confirmLabel="Xác nhận"
        loading={isPending('confirm')}
        onConfirm={confirm}
        onClose={() => setConfirming(null)}
      />
      <ConfirmDialog
        open={declining !== null}
        title="Từ chối lịch hẹn?"
        text={
          declining
            ? `${declining.patient_full_name} · ${formatDate(declining.appointment_date)} lúc ${formatTime(declining.appointment_time)}. Khung giờ được mở lại và tiền trả trước được hoàn đủ.`
            : undefined
        }
        reasonLabel="Lý do (bệnh nhân sẽ thấy)"
        confirmLabel="Từ chối lịch"
        tone="danger-solid"
        loading={isPending('decline')}
        onConfirm={decline}
        onClose={() => setDeclining(null)}
      />
    </>
  );
};

export default DoctorSchedulePage;
