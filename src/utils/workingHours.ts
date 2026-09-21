import type { DoctorWorkingHours } from '../api/types';

const DAY_SHORT: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };

const hhmm = (time: string) => time.slice(0, 5);

export interface WorkingDay {
  /** 1 = thứ Hai … 7 = Chủ nhật. */
  day: number;
  label: string;
  /** "07:30–11:30, 13:30–17:30"; null là ngày nghỉ. */
  hours: string | null;
  /** Ngày làm đúng khung giờ chính. */
  isMain: boolean;
}

/**
 * Tuần làm việc của bác sĩ, đủ 7 ngày: ca liền nhau trong ngày gộp thành một khoảng, và khung giờ
 * gặp ở nhiều ngày nhất là khung chính. Ngày có giờ khác khung chính được đánh dấu isMain = false.
 */
export function summarizeWorkingHours(rows: DoctorWorkingHours[]): { days: WorkingDay[]; mainHours: string | null } {
  const hoursByDay = new Map<number, string>();

  for (let day = 1; day <= 7; day++) {
    const ranges: [string, string][] = [];

    for (const row of rows.filter((r) => r.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time))) {
      const last = ranges[ranges.length - 1];
      if (last && last[1] === row.start_time) {
        last[1] = row.end_time;
      } else {
        ranges.push([row.start_time, row.end_time]);
      }
    }

    if (ranges.length > 0) {
      hoursByDay.set(day, ranges.map(([start, end]) => `${hhmm(start)}–${hhmm(end)}`).join(', '));
    }
  }

  const counts = new Map<string, number>();
  for (const hours of hoursByDay.values()) {
    counts.set(hours, (counts.get(hours) ?? 0) + 1);
  }
  const mainHours = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const days = [1, 2, 3, 4, 5, 6, 7].map((day) => {
    const hours = hoursByDay.get(day) ?? null;
    return { day, label: DAY_SHORT[day], hours, isMain: hours !== null && hours === mainHours };
  });

  return { days, mainHours };
}
