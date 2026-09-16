import { useState } from 'react';
import { CalendarOff } from 'lucide-react';
import { apiGetOwnTimeOff, apiReportOwnTimeOff, apiWithdrawOwnTimeOff } from '../../api/functions/doctorWork';
import type { TimeOff, TimeOffPayload } from '../../api/staffTypes';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, todayIso } from '../format';
import { useToast } from '../components/toastContext';
import { Button, ConfirmDialog, PageHeader, Sheet, Alert } from '../components/ui';
import { TimeOffForm, TimeOffList } from '../components/timeOff';
import { emptyTimeOff, timeOffPayload } from '../components/timeOffForm';
import type { TimeOffFormValue } from '../components/timeOffForm';

/** Bác sĩ tự báo nghỉ; hệ thống trả về các lịch hẹn bị ảnh hưởng để quầy dời lịch. */
const DoctorTimeOffPage = () => {
  const toast = useToast();
  const { run, isPending } = useAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TimeOffFormValue>(emptyTimeOff);
  const [error, setError] = useState<string | null>(null);
  const [lastReported, setLastReported] = useState<TimeOff | null>(null);
  const [withdrawing, setWithdrawing] = useState<TimeOff | null>(null);

  const query = useApiQuery(() => apiGetOwnTimeOff({ from_date: todayIso(-30), to_date: todayIso(180) }), []);

  const submit = async () => {
    const payload: TimeOffPayload | string = timeOffPayload(form);
    if (typeof payload === 'string') {
      setError(payload);
      return;
    }
    const result = await run('save', () => apiReportOwnTimeOff(payload));
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setForm(emptyTimeOff);
    setLastReported(result.data);
    toast.success('Đã báo nghỉ. Quầy lễ tân sẽ dời các lịch hẹn bị ảnh hưởng.');
    query.reload();
  };

  const withdraw = async () => {
    if (!withdrawing) {
      return;
    }
    const result = await run('withdraw', () => apiWithdrawOwnTimeOff(withdrawing.doctor_time_off_id));
    setWithdrawing(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Đã rút lại ngày nghỉ. Khung giờ mở nhận lịch trở lại.');
    query.reload();
  };

  return (
    <>
      <PageHeader
        title="Báo nghỉ"
        description="Báo nghỉ cả ngày hoặc một khoảng giờ. Khung giờ đó sẽ không nhận đặt lịch mới."
        actions={
          <Button
            variant="primary"
            icon={<CalendarOff size={16} />}
            onClick={() => {
              setError(null);
              setOpen(true);
            }}
          >
            Báo nghỉ
          </Button>
        }
      />

      {lastReported && lastReported.affected_appointments.length > 0 && (
        <Alert tone="warning" className="st-alert-gap">
          Có {lastReported.affected_appointments.length} lịch hẹn rơi vào thời gian nghỉ vừa báo. Quầy lễ tân sẽ liên hệ bệnh nhân để dời lịch.
        </Alert>
      )}

      <TimeOffList query={query} onWithdraw={setWithdrawing} emptyText="Bạn chưa báo nghỉ ngày nào trong khoảng 30 ngày trước đến 6 tháng tới." />

      <Sheet
        open={open}
        title="Báo nghỉ"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button variant="primary" loading={isPending('save')} onClick={submit}>
              Gửi báo nghỉ
            </Button>
          </>
        }
      >
        {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}
        <TimeOffForm value={form} onChange={setForm} />
      </Sheet>
      <ConfirmDialog
        open={withdrawing !== null}
        title="Rút lại ngày nghỉ?"
        text={withdrawing ? `Ngày ${formatDate(withdrawing.off_date)} sẽ mở nhận đặt lịch trở lại.` : undefined}
        confirmLabel="Rút lại"
        loading={isPending('withdraw')}
        onConfirm={withdraw}
        onClose={() => setWithdrawing(null)}
      />
    </>
  );
};

export default DoctorTimeOffPage;
