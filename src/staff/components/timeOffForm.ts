import type { TimeOffPayload } from '../../api/staffTypes';
import { toApiTime } from '../format';

export interface TimeOffFormValue {
  off_date: string;
  whole_day: boolean;
  start_time: string;
  end_time: string;
  reason: string;
}

export const emptyTimeOff: TimeOffFormValue = {
  off_date: '',
  whole_day: true,
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
  if (!form.whole_day) {
    if (!form.start_time || !form.end_time) {
      return 'Nhập đủ giờ bắt đầu và giờ kết thúc, hoặc chọn nghỉ cả ngày.';
    }
    if (form.end_time <= form.start_time) {
      return 'Giờ kết thúc phải sau giờ bắt đầu.';
    }
  }
  return {
    off_date: form.off_date,
    start_time: form.whole_day ? undefined : toApiTime(form.start_time),
    end_time: form.whole_day ? undefined : toApiTime(form.end_time),
    reason: form.reason.trim(),
  };
}
