import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiGetStaffAppointmentCalendar } from '../../api/functions/desk';
import { Button } from '../components/ui';
import { formatDate, formatNumber, todayIso } from '../format';
import { useApiQuery } from '../hooks';
import { appointmentLevel, MAX_CALENDAR_YEAR, MIN_CALENDAR_YEAR, monthDays, shiftDay, shiftMonth } from './calendarDates';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const LEVELS = ['0 lịch', '1–2 lịch', '3–5 lịch', '6–9 lịch', '10+ lịch'];

interface Props {
  month: string;
  onMonthChange: (month: string) => void;
  fromDate: string;
  toDate: string;
  searching: boolean;
  onSelectDate: (date: string) => void;
  doctorId: number | null;
  status: string;
  refreshKey: number;
}

/** Lịch tháng nhỏ: ô càng đậm càng nhiều lịch hẹn, bấm ngày để lọc bảng. */
export default function AppointmentCalendar({ month, onMonthChange, fromDate, toDate, searching, onSelectDate, doctorId, status, refreshKey }: Props) {
  const [focusedDate, setFocusedDate] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const today = todayIso();
  const [year, monthNumber] = month.split('-').map(Number);
  const query = useApiQuery(
    () => apiGetStaffAppointmentCalendar({ year, doctor_id: doctorId ?? undefined, status: status || undefined }),
    [year, doctorId, status, refreshKey],
  );
  const known = !query.loading && !query.error && query.data !== null;
  const counts = new Map(known ? query.data!.map((day) => [day.date, day.count]) : []);
  const total = [...counts].reduce((sum, [date, count]) => sum + (date.startsWith(month) ? count : 0), 0);
  const selectedDate = !searching && fromDate === toDate ? fromDate : '';
  // Tháng hiện tại: bỏ các ngày đã qua để hôm nay nằm ở hàng đầu, mắt không lạc sang ngày cũ.
  const days = monthDays(year, monthNumber);
  const todayIndex = days.indexOf(today);
  const cells = todayIndex < 0 ? days : days.slice(todayIndex - (todayIndex % 7)).map((date) => (date && date < today ? null : date));
  const tabDate = [focusedDate, selectedDate, today].find((date) => date.startsWith(month)) || `${month}-01`;

  useEffect(() => {
    if (pendingFocus.current) {
      root.current?.querySelector<HTMLButtonElement>(`[data-calendar-date="${pendingFocus.current}"]`)?.focus();
      pendingFocus.current = null;
    }
  }, [month]);

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, date: string) => {
    const weekday = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -weekday, End: 6 - weekday };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    const target = shiftDay(date, offsets[event.key]);
    const targetYear = Number(target.slice(0, 4));
    if (targetYear < MIN_CALENDAR_YEAR || targetYear > MAX_CALENDAR_YEAR) return;
    const button = root.current?.querySelector<HTMLButtonElement>(`[data-calendar-date="${target}"]`);
    if (button) button.focus();
    else if (target.slice(0, 7) !== month) {
      pendingFocus.current = target;
      setFocusedDate(target);
      onMonthChange(target.slice(0, 7));
    }
  };

  return (
    <div className="st-appointment-calendar" ref={root}>
      <div className="st-calendar-controls">
        <Button size="sm" variant="ghost" iconOnly icon={<ChevronLeft size={16} />} aria-label="Tháng trước" disabled={year === MIN_CALENDAR_YEAR && monthNumber === 1} onClick={() => onMonthChange(shiftMonth(month, -1))} />
        <strong className="st-calendar-title">Tháng {monthNumber}, {year}</strong>
        <Button size="sm" variant="ghost" iconOnly icon={<ChevronRight size={16} />} aria-label="Tháng sau" disabled={year === MAX_CALENDAR_YEAR && monthNumber === 12} onClick={() => onMonthChange(shiftMonth(month, 1))} />
        <Button size="sm" onClick={() => { onMonthChange(today.slice(0, 7)); onSelectDate(today); }}>Hôm nay</Button>
      </div>
      <div className="st-calendar-weekdays" aria-hidden="true">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="st-calendar-days" role="group" aria-label={`Tháng ${monthNumber} năm ${year}`} aria-busy={query.loading}>
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} aria-hidden="true" />;
          const count = counts.get(date) ?? 0;
          const selected = !searching && !!fromDate && !!toDate && date >= fromDate && date <= toDate;
          const isToday = date === today;
          const description = `${formatDate(date)}: ${known ? `${count} lịch hẹn` : 'chưa có số liệu'}${isToday ? ', hôm nay' : ''}`;
          return (
            <button
              type="button"
              key={date}
              className={`st-calendar-day st-calendar-level-${known ? appointmentLevel(count) : 0}${selected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
              data-calendar-date={date}
              aria-label={description}
              aria-pressed={selected}
              aria-current={isToday ? 'date' : undefined}
              title={description}
              tabIndex={date === tabDate ? 0 : -1}
              onFocus={() => setFocusedDate(date)}
              onKeyDown={(event) => moveFocus(event, date)}
              onClick={() => onSelectDate(date)}
            >
              <span className="st-calendar-day-number">{Number(date.slice(-2))}</span>
              {known && count > 0 && <span className="st-calendar-day-count">{formatNumber(count)}</span>}
            </button>
          );
        })}
      </div>
      <div className="st-calendar-footer">
        <span role="status">
          {query.error ? (
            <>Lỗi tải số lịch · <button type="button" className="st-calendar-retry" onClick={query.reload}>Thử lại</button></>
          ) : known ? (
            <><strong>{formatNumber(total)}</strong> lịch trong tháng {monthNumber}</>
          ) : (
            'Đang tải…'
          )}
        </span>
        <span className="st-calendar-legend" aria-label="Màu càng đậm càng nhiều lịch hẹn">
          Ít{LEVELS.map((label, level) => <i key={level} className={`st-calendar-level-${level}`} title={label} aria-hidden="true" />)}Nhiều
        </span>
      </div>
    </div>
  );
}
