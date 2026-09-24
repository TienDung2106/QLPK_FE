import { useState } from 'react';
import { CalendarOff } from 'lucide-react';
import { apiGetDoctorTimeOff, apiRecordDoctorTimeOff, apiWithdrawDoctorTimeOff } from '../../api/functions/desk';
import type { TimeOff } from '../../api/staffTypes';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, todayIso } from '../format';
import { useToast } from '../components/toastContext';
import { DoctorSelect } from '../components/pickers';
import { TimeOffForm, TimeOffList, TimeOffOutcome } from '../components/timeOff';
import { emptyTimeOff, timeOffPayload } from '../components/timeOffForm';
import type { TimeOffFormValue } from '../components/timeOffForm';
import { Alert, Button, ConfirmDialog, EmptyState, PageHeader, Panel, Sheet } from '../components/ui';

/** Quầy ghi nhận bác sĩ nghỉ thay bác sĩ, rồi dời các lịch hẹn bị ảnh hưởng. */
const DoctorTimeOffDeskPage = () => {
  const toast = useToast();
  const { run, isPending } = useAction();
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TimeOffFormValue>(emptyTimeOff);
  const [error, setError] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<TimeOff | null>(null);
  const [withdrawing, setWithdrawing] = useState<TimeOff | null>(null);

  const query = useApiQuery(
    () => apiGetDoctorTimeOff(doctorId!, { from_date: todayIso(-30), to_date: todayIso(180) }),
    [doctorId],
    { enabled: doctorId !== null },
  );

  const submit = async () => {
    const payload = timeOffPayload(form);
    if (typeof payload === 'string') {
      setError(payload);
      return;
    }
    const result = await run('save', () => apiRecordDoctorTimeOff(doctorId!, payload));
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setForm(emptyTimeOff);
    setRecorded(result.data);
    toast.success('Đã ghi nhận lịch nghỉ.');
    query.reload();
  };

  const withdraw = async () => {
    if (!withdrawing || !doctorId) {
      return;
    }
    const result = await run('withdraw', () => apiWithdrawDoctorTimeOff(doctorId, withdrawing.doctor_time_off_id));
    setWithdrawing(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Đã rút lại lịch nghỉ. Khung giờ mở nhận lịch trở lại.');
    query.reload();
  };

  return (
    <>
      <PageHeader
        title="Lịch nghỉ bác sĩ"
        description="Ghi nhận bác sĩ nghỉ và xử lý các lịch hẹn rơi vào thời gian đó."
        actions={
          <Button
            variant="primary"
            icon={<CalendarOff size={16} />}
            disabled={!doctorId}
            onClick={() => {
              setError(null);
              setOpen(true);
            }}
          >
            Ghi nhận nghỉ
          </Button>
        }
      />

      <div className="st-panel" style={{ padding: '0.85rem 1rem', marginBottom: '1rem', maxWidth: 420 }}>
        <DoctorSelect value={doctorId} onChange={setDoctorId} />
      </div>

      <TimeOffOutcome result={recorded} pendingText="Mở từng lịch hẹn trong bảng bên dưới để dời sang giờ khác." />

      {doctorId ? (
        <TimeOffList query={query} onWithdraw={setWithdrawing} appointmentLinkBase="/thu-ngan/lich-hen" emptyText="Bác sĩ chưa có ngày nghỉ nào từ 30 ngày trước đến 6 tháng tới." />
      ) : (
        <Panel>
          <EmptyState title="Chọn một bác sĩ" text="Chọn bác sĩ ở trên để xem và ghi nhận lịch nghỉ." />
        </Panel>
      )}

      <Sheet
        open={open}
        title="Ghi nhận bác sĩ nghỉ"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button variant="primary" loading={isPending('save')} onClick={submit}>
              Ghi nhận
            </Button>
          </>
        }
      >
        {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}
        <TimeOffForm value={form} onChange={setForm} />
      </Sheet>
      <ConfirmDialog
        open={withdrawing !== null}
        title="Rút lại lịch nghỉ?"
        text={withdrawing ? `Ngày ${formatDate(withdrawing.off_date)} sẽ mở nhận đặt lịch trở lại.` : undefined}
        confirmLabel="Rút lại"
        loading={isPending('withdraw')}
        onConfirm={withdraw}
        onClose={() => setWithdrawing(null)}
      />
    </>
  );
};

export default DoctorTimeOffDeskPage;
