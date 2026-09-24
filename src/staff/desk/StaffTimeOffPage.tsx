import { useState } from 'react';
import { CalendarOff } from 'lucide-react';
import { apiGetOwnStaffTimeOff, apiReportOwnStaffTimeOff, apiWithdrawOwnStaffTimeOff } from '../../api/functions/desk';
import type { StaffTimeOff } from '../../api/staffTypes';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, todayIso } from '../format';
import { useToast } from '../components/toastContext';
import { Alert, Button, ConfirmDialog, PageHeader, Sheet } from '../components/ui';
import { TimeOffForm, TimeOffList } from '../components/timeOff';
import { emptyTimeOff, timeOffPayload } from '../components/timeOffForm';
import type { TimeOffFormValue } from '../components/timeOffForm';

/** Lễ tân tự báo nghỉ; chỉ ghi nhận, không động tới lịch hẹn. */
const StaffTimeOffPage = () => {
  const toast = useToast();
  const { run, isPending } = useAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TimeOffFormValue>(emptyTimeOff);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<StaffTimeOff | null>(null);

  const query = useApiQuery(() => apiGetOwnStaffTimeOff({ from_date: todayIso(-30), to_date: todayIso(180) }), []);

  const submit = async () => {
    const payload = timeOffPayload(form);
    if (typeof payload === 'string') {
      setError(payload);
      return;
    }
    const result = await run('save', () => apiReportOwnStaffTimeOff(payload));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setForm(emptyTimeOff);
    toast.success('Đã báo nghỉ.');
    query.reload();
  };

  const withdraw = async () => {
    if (!withdrawing) {
      return;
    }
    const result = await run('withdraw', () => apiWithdrawOwnStaffTimeOff(withdrawing.staff_time_off_id));
    setWithdrawing(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Đã rút lại ngày nghỉ.');
    query.reload();
  };

  return (
    <>
      <PageHeader
        title="Báo nghỉ"
        description="Báo nghỉ cả ngày, một buổi hoặc một ca."
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

      <TimeOffList
        query={query}
        rowKey={(item) => item.staff_time_off_id}
        onWithdraw={setWithdrawing}
        emptyText="Bạn chưa báo nghỉ ngày nào trong khoảng 30 ngày trước đến 6 tháng tới."
      />

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
        text={withdrawing ? `Bỏ ngày nghỉ ${formatDate(withdrawing.off_date)}.` : undefined}
        confirmLabel="Rút lại"
        loading={isPending('withdraw')}
        onConfirm={withdraw}
        onClose={() => setWithdrawing(null)}
      />
    </>
  );
};

export default StaffTimeOffPage;
