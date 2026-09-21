import type { DoctorWorkingHours } from '../api/types';

const DAY_SHORT: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };

const hhmm = (time: string) => time.slice(0, 5);

/**
 * Lịch tuần gọn trên một dòng: ca liền nhau trong ngày gộp thành một khoảng, các thứ liên tiếp có
 * cùng giờ gộp thành dải. Ví dụ "T2–T6: 07:30–11:30, 13:30–17:30 · T7: 07:30–11:30".
 */
export function formatWorkingHours(rows: DoctorWorkingHours[]): string {
  const byDay = new Map<number, string>();

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
      byDay.set(day, ranges.map(([start, end]) => `${hhmm(start)}–${hhmm(end)}`).join(', '));
    }
  }

  const parts: string[] = [];
  let day = 1;

  while (day <= 7) {
    const hours = byDay.get(day);
    if (!hours) {
      day++;
      continue;
    }
    let last = day;
    while (byDay.get(last + 1) === hours) {
      last++;
    }
    parts.push(`${DAY_SHORT[day]}${last > day ? `–${DAY_SHORT[last]}` : ''}: ${hours}`);
    day = last + 1;
  }

  return parts.length > 0 ? parts.join(' · ') : 'Chưa có lịch làm việc';
}
