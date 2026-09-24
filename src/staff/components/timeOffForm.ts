import type { TimeOffPayload } from '../../api/staffTypes';
import { formatTime, toApiTime } from '../format';
import { STANDARD_SHIFTS } from '../labels';

export interface TimeOffFormValue {
  off_date: string;
  /** Khoá trong TIME_OFF_PERIODS: 'day', 'custom' hoặc một buổi/ca. */
  period: string;
  start_time: string;
  end_time: string;
  reason: string;
}

const [morning1, morning2, afternoon1, afternoon2] = STANDARD_SHIFTS;

/** Nút chọn khi báo nghỉ: cả ngày, một buổi, một ca chuẩn, hoặc tự nhập giờ. */
export const TIME_OFF_PERIODS: { key: string; label: string; start?: string; end?: string }[] = [
  { key: 'day', label: 'Cả ngày' },
  { key: 'morning', label: 'Buổi sáng', start: morning1.start_time, end: morning2.end_time },
  { key: 'afternoon', label: 'Buổi chiều', start: afternoon1.start_time, end: afternoon2.end_time },
  ...STANDARD_SHIFTS.map((shift) => ({ key: shift.label, label: shift.label, start: shift.start_time, end: shift.end_time })),
  { key: 'custom', label: 'Giờ khác' },
];

/** Tên buổi/ca nếu khoảng giờ khớp đúng một lựa chọn, không thì null. */
export const timeOffPeriodLabel = (start: string, end: string) =>
  TIME_OFF_PERIODS.find((period) => period.start === formatTime(start) && period.end === formatTime(end))?.label ?? null;

export const emptyTimeOff: TimeOffFormValue = {
  off_date: '',
  period: 'day',
  start_time: '',
  end_time: '',
  reason: '',
};

/** Trả payload, hoặc câu lỗi để hiện ngay trên form. */
export function timeOffPayload(form: TimeOffFormValue): TimeOffPayload | string {
  if (!form.off_date) {
    return 'Chọn ngày nghỉ.';
  }
  if (!form.reason.trim()) {
    return 'Nhập lý do nghỉ.';
  }
  const period = TIME_OFF_PERIODS.find((item) => item.key === form.period);
  const start = form.period === 'custom' ? form.start_time : period?.start;
  const end = form.period === 'custom' ? form.end_time : period?.end;
  if (form.period === 'custom') {
    if (!start || !end) {
      return 'Nhập đủ giờ bắt đầu và giờ kết thúc, hoặc chọn một ca.';
    }
    if (end <= start) {
      return 'Giờ kết thúc phải sau giờ bắt đầu.';
    }
  }
  return {
    off_date: form.off_date,
    start_time: start ? toApiTime(start) : undefined,
    end_time: end ? toApiTime(end) : undefined,
    reason: form.reason.trim(),
  };
}
