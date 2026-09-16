import { useState } from 'react';
import { CalendarOff } from 'lucide-react';
import { apiGetDoctorTimeOff, apiRecordDoctorTimeOff } from '../../api/functions/desk';
import type { TimeOff } from '../../api/staffTypes';
import { useAction, useApiQuery } from '../hooks';
import { todayIso } from '../format';
import { useToast } from '../components/toastContext';
import { DoctorSelect } from '../components/pickers';
import { TimeOffForm, TimeOffList } from '../components/timeOff';
import { emptyTimeOff, timeOffPayload } from '../components/timeOffForm';
import type { TimeOffFormValue } from '../components/timeOffForm';
import { Alert, Button, EmptyState, PageHeader, Panel, Sheet } from '../components/ui';

/** Quầy ghi nhận bác sĩ nghỉ thay bác sĩ, rồi dời các lịch hẹn bị ảnh hưởng. */
const DoctorTimeOffDeskPage = () => {
  const toast = useToast();
  const { run, isPending } = useAction();
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TimeOffFormValue>(emptyTimeOff);
  const [error, setError] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<TimeOff | null>(null);

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

      {recorded && recorded.affected_appointments.length > 0 && (
        <Alert tone="warning" className="st-alert-gap">
          {recorded.affected_appointments.length} lịch hẹn bị ảnh hưởng. Mở từng lịch hẹn trong bảng bên dưới để dời sang giờ khác.
        </Alert>
      )}

      {doctorId ? (
        <TimeOffList query={query} appointmentLinkBase="/thu-ngan/lich-hen" emptyText="Bác sĩ chưa có ngày nghỉ nào từ 30 ngày trước đến 6 tháng tới." />
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
    </>
  );
};

export default DoctorTimeOffDeskPage;
