import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, ChevronDown, ChevronRight, History } from 'lucide-react';
import { apiMarkAllAppointmentChangesSeen, apiMarkAppointmentChangeSeen, apiSearchAppointmentChanges } from '../../api/functions/desk';
import type { AppointmentChange, AppointmentSnapshot } from '../../api/staffTypes';
import { useAction, useApiQuery, useDebounced } from '../hooks';
import { formatDate, formatDateTime, formatMoney, formatTime } from '../format';
import { APPOINTMENT_STATUS, labelOf } from '../labels';
import { useToast } from '../components/toastContext';
import { DoctorSelect } from '../components/pickers';
import { Alert, Badge, Button, EmptyState, Field, FilterTabs, PageHeader, Pagination, SearchInput, StatusBadge } from '../components/ui';

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
      snapshot.services.map((line) => (line.quantity > 1 ? `${line.service_name} ×${line.quantity}` : line.service_name)).join(', ') || '—',
  },
  { label: 'Thời lượng', read: (snapshot) => `${snapshot.duration_minutes} phút` },
  {
    label: 'Chi phí',
    read: (snapshot) => formatMoney(snapshot.total_amount) + (snapshot.discount_percent > 0 ? ` (giảm ${snapshot.discount_percent}%)` : ''),
  },
  { label: 'Lý do khám', read: (snapshot) => snapshot.reason_for_visit || '—' },
];

/** 'dd/mm HH:mm' cho cột tóm tắt. */
const shortSlot = (snapshot: AppointmentSnapshot) => `${formatDate(snapshot.appointment_date).slice(0, 5)} ${formatTime(snapshot.appointment_time)}`;

/** Báo cho badge ở menu đếm lại ngay, không đợi chu kỳ. */
const notifySeen = () => window.dispatchEvent(new Event('appointment-changes-seen'));

/** Các lần bệnh nhân tự sửa lịch trên ứng dụng, cũ → mới, để quầy nắm và xử lý. */
const DeskAppointmentChangesPage = () => {
  const toast = useToast();
  const { run, isPending } = useAction();
  const [tab, setTab] = useState('unseen');
  const [pageNumber, setPageNumber] = useState(1);

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const debouncedSearch = useDebounced(search.trim());

  const query = useApiQuery(
    () =>
      apiSearchAppointmentChanges({
        unseen_only: tab === 'unseen',
        search: debouncedSearch || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        doctor_id: doctorId ?? undefined,
        page_number: pageNumber,
        page_size: 20,
      }),
    [tab, debouncedSearch, fromDate, toDate, doctorId, pageNumber],
  );
  const filtered = !!(debouncedSearch || fromDate || toDate || doctorId);

  /** Đổi bộ lọc thì về trang 1. */
  const filter =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPageNumber(1);
    };

  const markSeen = async (change: AppointmentChange) => {
    const result = await run(`seen-${change.appointment_change_log_id}`, () => apiMarkAppointmentChangeSeen(change.appointment_change_log_id));
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

      <section className="st-panel">
        <div className="st-toolbar">
          <SearchInput value={search} onChange={filter(setSearch)} placeholder="Tìm tên bệnh nhân" />
          <Field label="Sửa từ ngày">
            {(id) => <input id={id} type="date" className="st-input" value={fromDate} onChange={(e) => filter(setFromDate)(e.target.value)} />}
          </Field>
          <Field label="Đến ngày">
            {(id) => <input id={id} type="date" className="st-input" value={toDate} onChange={(e) => filter(setToDate)(e.target.value)} />}
          </Field>
          <div style={{ minWidth: 220 }}>
            <DoctorSelect allowAll compact value={doctorId} onChange={filter(setDoctorId)} />
          </div>
          {filtered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setFromDate('');
                setToDate('');
                setDoctorId(null);
                setPageNumber(1);
              }}
            >
              Xoá lọc
            </Button>
          )}
        </div>
        <div className="st-toolbar" style={{ borderRadius: 0 }}>
          <FilterTabs label="Lọc theo đã xem" options={TABS} value={tab} onChange={filter(setTab)} />
        </div>

        {query.error && <Alert tone="danger">{query.error}</Alert>}

        {!query.loading && items.length === 0 ? (
          <EmptyState
            icon={<History size={32} strokeWidth={1.6} />}
            title={filtered ? 'Không có lần sửa nào khớp bộ lọc' : tab === 'unseen' ? 'Không có lịch nào mới bị sửa' : 'Chưa có lần sửa nào'}
          />
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }} />
                  <th>Bệnh nhân</th>
                  <th>Bác sĩ</th>
                  <th>Đã sửa</th>
                  <th>Sửa lúc</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((change) => {
                  const id = change.appointment_change_log_id;
                  const open = openId === id;
                  const diffs = ROWS.map((row) => ({ ...row, before: row.read(change.before), after: row.read(change.after) }));
                  const changed = diffs.filter((row) => row.before !== row.after);
                  const moved = changed.find((row) => row.label === 'Ngày giờ');
                  return (
                    <Fragment key={id}>
                      <tr className="st-row-link" aria-expanded={open} onClick={() => setOpenId(open ? null : id)}>
                        <td>{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                        <td>
                          <div className="st-cell-main">
                            {change.patient_full_name} <StatusBadge value={labelOf(APPOINTMENT_STATUS, change.status)} />
                          </div>
                          {change.seen_at && (
                            <div className="st-cell-sub">
                              {change.seen_by_full_name ?? 'Quầy'} đã xem {formatDateTime(change.seen_at)}
                            </div>
                          )}
                        </td>
                        <td>{change.doctor_full_name}</td>
                        <td>
                          {moved && (
                            <div className="st-cell-main">
                              {shortSlot(change.before)} → {shortSlot(change.after)}
                            </div>
                          )}
                          <div className="st-chip-row" style={{ gap: 4 }}>
                            {changed
                              .filter((row) => row !== moved)
                              .map((row) => (
                                <Badge key={row.label} tone="warning">
                                  {row.label}
                                </Badge>
                              ))}
                            {changed.length === 0 && <span className="st-muted">Không đổi</span>}
                          </div>
                        </td>
                        <td className="st-nowrap">{formatDateTime(change.changed_at)}</td>
                        <td className="st-num st-nowrap" onClick={(event) => event.stopPropagation()}>
                          <Link className="st-btn st-btn-ghost st-btn-sm" to={`/thu-ngan/lich-hen/${change.appointment_id}`}>
                            Mở lịch hẹn
                          </Link>
                          {!change.seen_at && (
                            <Button size="sm" variant="primary" loading={isPending(`seen-${id}`)} onClick={() => markSeen(change)}>
                              Đã xem
                            </Button>
                          )}
                        </td>
                      </tr>
                      {open && (
                        <tr>
                          <td />
                          <td colSpan={5}>
                            <table className="st-change-table">
                              <thead>
                                <tr>
                                  <th scope="col" />
                                  <th scope="col">Cũ</th>
                                  <th scope="col">Mới</th>
                                </tr>
                              </thead>
                              <tbody>
                                {diffs.map((row) => (
                                  <tr key={row.label} className={row.before !== row.after ? 'is-changed' : undefined}>
                                    <th scope="row">{row.label}</th>
                                    <td>{row.before}</td>
                                    <td>{row.after}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Pagination page={query.data} onPage={setPageNumber} />
    </>
  );
};

export default DeskAppointmentChangesPage;
