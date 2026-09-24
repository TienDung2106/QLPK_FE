import type { DoctorWorkingHours } from '../api/types';

export const DAY_SHORT: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };

const hhmm = (time: string) => time.slice(0, 5);

export type SessionKey = 'sang' | 'chieu' | 'ca-ngay';

export const SESSION_LABEL: Record<SessionKey, string> = { sang: 'Sáng', chieu: 'Chiều', 'ca-ngay': 'Cả ngày' };

/** Khoảng giờ kết thúc trước trưa là buổi sáng, bắt đầu từ trưa là buổi chiều, vắt qua trưa là cả ngày. */
export function sessionOf(start: string, end: string): SessionKey {
  if (end <= '12:00:00') {
    return 'sang';
  }
  return start >= '12:00:00' ? 'chieu' : 'ca-ngay';
}

export interface WorkingSession {
  session: SessionKey;
  /** "07:30–11:30". */
  hours: string;
  /** 1 = thứ Hai … 7 = Chủ nhật, tăng dần. */
  days: number[];
}

/** Các ca liền nhau trong cùng một ngày gộp thành một khoảng giờ. */
export function mergeDayRanges(rows: DoctorWorkingHours[], day: number): [string, string][] {
  const ranges: [string, string][] = [];
  for (const row of rows.filter((r) => r.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time))) {
    const last = ranges[ranges.length - 1];
    if (last && last[1] === row.start_time) {
      last[1] = row.end_time;
    } else {
      ranges.push([row.start_time, row.end_time]);
    }
  }
  return ranges;
}

/**
 * Tuần làm việc theo buổi: mỗi buổi + khung giờ là một nhóm, kèm các thứ làm buổi đó.
 * Vd sáng 07:30–11:30: T2, T4, T6 · chiều 13:30–17:30: T3, T5. Ngày làm cả hai buổi có ở cả hai nhóm.
 */
export function groupWorkingHours(rows: DoctorWorkingHours[]): WorkingSession[] {
  const groups = new Map<string, WorkingSession>();

  for (let day = 1; day <= 7; day++) {
    for (const [start, end] of mergeDayRanges(rows, day)) {
      const session = sessionOf(start, end);
      const hours = `${hhmm(start)}–${hhmm(end)}`;
      const key = `${session}|${hours}`;
      const group = groups.get(key) ?? { session, hours, days: [] };
      group.days.push(day);
      groups.set(key, group);
    }
  }

  const order: SessionKey[] = ['sang', 'chieu', 'ca-ngay'];
  return [...groups.values()].sort(
    (a, b) => order.indexOf(a.session) - order.indexOf(b.session) || a.hours.localeCompare(b.hours),
  );
}
