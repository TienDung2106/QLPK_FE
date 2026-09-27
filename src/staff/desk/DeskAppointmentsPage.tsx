import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, DoorOpen, RefreshCw } from 'lucide-react';
import { apiExportStaffAppointments, apiSearchStaffAppointments, apiStaffCheckIn } from '../../api/functions/desk';
import { ExportButton } from '../components/ExportButton';
import type { CheckInResult } from '../../api/types';
import { useAction, useApiQuery, useDebounced } from '../hooks';
import { formatDate, formatPercent, formatTime, todayIso } from '../format';
import { APPOINTMENT_STATUS, labelOf } from '../labels';
import { useToast } from '../components/toastContext';
import { DoctorSelect } from '../components/pickers';
import { Alert, Button, Field, FilterTabs, PageHeader, Pagination, Panel, SearchInput, StatusBadge, TableState } from '../components/ui';
import AppointmentCalendar from './AppointmentCalendar';

const STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'pending_approval', label: 'Chờ duyệt' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'checked_in', label: 'Đã nhận phòng' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã huỷ' },
  { value: 'no_show', label: 'Không đến' },
];

// STT chỉ cấp lúc nhận phòng; lịch còn chờ đến thì báo rõ thay vì để trống
const WAITING = ['pending', 'pending_approval', 'confirmed'];

/** Bàn làm việc của quầy: nhận phòng bằng mã ngay đầu trang, lịch hẹn trong ngày bên dưới. */
const DeskAppointmentsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { run, isPending } = useAction();
  const [fromDate, setFromDate] = useState(todayIso());
  const [toDate, setToDate] = useState(todayIso());
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState(todayIso().slice(0, 7));
  const [refreshKey, setRefreshKey] = useState(0);
  const debouncedSearch = useDebounced(search.trim());
  const [code, setCode] = useState('');
  const [checkIn, setCheckIn] = useState<CheckInResult | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  const query = useApiQuery(
    () =>
      apiSearchStaffAppointments({
        from_date: debouncedSearch ? undefined : fromDate || undefined,
        to_date: debouncedSearch ? undefined : toDate || undefined,
        doctor_id: doctorId ?? undefined,
        status: status || undefined,
        search: debouncedSearch || undefined,
        page_number: page,
        page_size: 25,
      }),
    [fromDate, toDate, doctorId, status, debouncedSearch, page],
  );

  // bảng và số trên lịch cùng làm mới
  const reload = () => {
    query.reload();
    setRefreshKey((key) => key + 1);
  };

  const selectDate = (date: string) => {
    setFromDate(date);
    setToDate(date);
    setSearch('');
    setPage(1);
  };

  const submitCheckIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      return;
    }
    const result = await run('checkin', () => apiStaffCheckIn(code.trim()));
    if (result.ok && result.data) {
      setCheckIn(result.data);
      setCheckInError(null);
      setCode('');
      toast.success(`Đã nhận phòng — số thứ tự ${result.data.queue_number}.`);
      reload();
    } else {
      setCheckIn(null);
      setCheckInError(result.error);
    }
  };

  const items = query.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Lịch hẹn"
        description="Nhận phòng, thu tiền trước, dời hoặc huỷ lịch cho bệnh nhân."
        actions={
          <>
            <ExportButton
              download={() =>
                apiExportStaffAppointments({
                  from_date: debouncedSearch ? undefined : fromDate || undefined,
                  to_date: debouncedSearch ? undefined : toDate || undefined,
                  doctor_id: doctorId ?? undefined,
                  status: status || undefined,
                  search: debouncedSearch || undefined,
                })
              }
              fileName="lich-hen.xlsx"
            />
            <Button icon={<RefreshCw size={15} />} onClick={reload}>
              Làm mới
            </Button>
            <Link to="/thu-ngan/dat-lich" className="st-btn st-btn-primary">
              <CalendarPlus size={16} /> Đặt lịch / Vãng lai
            </Link>
          </>
        }
      />

      <div className="st-desk-layout">
        <div>
          <Panel title="Nhận phòng bằng mã" subtitle="Mã check-in in trên lịch hẹn của bệnh nhân">
            <form onSubmit={submitCheckIn} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 1 260px' }}>
                <Field label="Mã check-in">
                  {(id) => (
                    <input id={id} className="st-input st-mono" autoComplete="off" value={code} placeholder="Mã 8 ký tự" onChange={(e) => setCode(e.target.value.toUpperCase())} />
                  )}
                </Field>
              </div>
              <Button type="submit" variant="primary" icon={<DoorOpen size={16} />} loading={isPending('checkin')} disabled={!code.trim()}>
                Nhận phòng
              </Button>
              {checkIn && (
                <Alert tone="success">
                  <strong>Số thứ tự {checkIn.queue_number}</strong> · Bác sĩ: {checkIn.doctor_full_name} ({checkIn.specialty_name}) · hẹn{' '}
                  {formatTime(checkIn.appointment_time)}
                </Alert>
              )}
              {checkInError && <Alert tone="danger">{checkInError}</Alert>}
            </form>
          </Panel>

          <section className="st-panel" style={{ marginTop: '1rem' }}>
            <div className="st-toolbar">
              <SearchInput
                value={search}
                onChange={(value) => { setSearch(value); setPage(1); }}
                placeholder="Tìm tên bệnh nhân hoặc mã nhận phòng"
              />
              {debouncedSearch && <span className="st-hint">Đang tìm trên mọi ngày</span>}
              <Field label="Từ ngày">
                {(id) => <input id={id} type="date" className="st-input" value={fromDate} disabled={!!debouncedSearch} onChange={(e) => { setFromDate(e.target.value); if (e.target.value) setMonth(e.target.value.slice(0, 7)); setPage(1); }} />}
              </Field>
              <Field label="Đến ngày">
                {(id) => <input id={id} type="date" className="st-input" value={toDate} disabled={!!debouncedSearch} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />}
              </Field>
              <div style={{ minWidth: 220 }}>
                <DoctorSelect allowAll compact value={doctorId} onChange={(value) => { setDoctorId(value); setPage(1); }} />
              </div>
            </div>
            <div className="st-toolbar" style={{ borderRadius: 0 }}>
              <FilterTabs label="Trạng thái lịch hẹn" options={STATUS_TABS} value={status} onChange={(value) => { setStatus(value); setPage(1); }} />
            </div>

            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th title="Cấp khi nhận phòng, theo thứ tự đến">STT</th>
                    <th>Ngày giờ</th>
                    <th>Bệnh nhân</th>
                    <th>Bác sĩ</th>
                    <th className="st-num">Giảm giá</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  <TableState
                    columns={6}
                    loading={query.loading}
                    error={query.error}
                    isEmpty={items.length === 0}
                    onRetry={query.reload}
                    emptyTitle={debouncedSearch ? 'Không tìm thấy lịch hẹn' : 'Không có lịch hẹn'}
                    emptyText={debouncedSearch ? 'Kiểm tra lại tên hoặc mã nhận phòng và các bộ lọc.' : 'Không có lịch hẹn nào khớp khoảng ngày và bộ lọc.'}
                  />
                  {items.map((item) => (
                    <tr key={item.appointment_id} className="st-row-link" onClick={() => navigate(`/thu-ngan/lich-hen/${item.appointment_id}`)}>
                      <td>
                        <span className={`st-queue ${item.queue_number ? '' : 'empty'}`}>{item.queue_number ?? (WAITING.includes(item.status) ? 'Chưa nhận phòng' : '—')}</span>
                      </td>
                      <td className="st-nowrap">
                        <div className="st-cell-main">{formatTime(item.appointment_time)}</div>
                        <div className="st-cell-sub">{formatDate(item.appointment_date)}</div>
                      </td>
                      <td>
                        <div className="st-cell-main">{item.patient_full_name}</div>
                        <div className="st-cell-sub">#{item.appointment_id}</div>
                      </td>
                      <td>{item.doctor_full_name}</td>
                      <td className="st-num">{item.discount_percent > 0 ? formatPercent(item.discount_percent) : '—'}</td>
                      <td>
                        <StatusBadge value={labelOf(APPOINTMENT_STATUS, item.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={query.data} onPage={setPage} />
          </section>
        </div>
        <aside className="st-panel st-desk-aside">
          <AppointmentCalendar
            month={month}
            onMonthChange={setMonth}
            fromDate={fromDate}
            toDate={toDate}
            searching={!!debouncedSearch}
            onSelectDate={selectDate}
            doctorId={doctorId}
            status={status}
            refreshKey={refreshKey}
          />
        </aside>
      </div>
    </>
  );
};

export default DeskAppointmentsPage;
