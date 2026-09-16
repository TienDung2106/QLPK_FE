import { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { apiGetStaffDoctorCalendar } from '../../api/functions/desk';
import { useApiQuery } from '../hooks';
import { todayIso } from '../format';
import { CALENDAR_DAY_STATUS, labelOf } from '../labels';
import { Alert, Button } from './ui';

const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Cả tháng lịch của một bác sĩ trong một lần gọi: ngày còn chỗ, kín, không làm, nghỉ lễ.
 * Bấm ngày còn chỗ để chọn; ngày không đặt được thì khoá.
 */
export const DoctorMonthCalendar = ({
  doctorId,
  value,
  onChange,
}: {
  doctorId: number;
  value: string;
  onChange: (date: string) => void;
}) => {
  const [month, setMonth] = useState(`${(value || todayIso()).slice(0, 7)}-01`);
  const query = useApiQuery(() => apiGetStaffDoctorCalendar(doctorId, month), [doctorId, month]);
  const days = query.data?.days ?? [];
  const [year, monthNumber] = month.split('-').map(Number);
  const firstWeekday = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const canGoBack = month > `${todayIso().slice(0, 7)}-01`;

  return (
    <div>
      <div className="st-cal-head">
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          aria-label="Tháng trước"
          disabled={!canGoBack}
          icon={<ChevronLeft size={16} />}
          onClick={() => setMonth(shiftMonth(month, -1))}
        />
        <span>
          Tháng {monthNumber}/{year} {query.loading && <Loader2 size={13} className="st-spin" />}
        </span>
        <Button size="sm" variant="ghost" iconOnly aria-label="Tháng sau" icon={<ChevronRight size={16} />} onClick={() => setMonth(shiftMonth(month, 1))} />
      </div>
      {query.error && <Alert tone="danger">{query.error}</Alert>}
      <div className="st-cal" role="grid" aria-label={`Lịch tháng ${monthNumber}/${year}`}>
        {DOW.map((label) => (
          <div key={label} className="st-cal-dow">
            {label}
          </div>
        ))}
        {Array.from({ length: firstWeekday }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {days.map((day) => {
          const bookable = day.status === 'available';
          const status = labelOf(CALENDAR_DAY_STATUS, day.status);
          return (
            <button
              key={day.date}
              type="button"
              className={`st-cal-day ${day.status} ${day.date === value ? 'active' : ''}`}
              disabled={!bookable}
              aria-pressed={day.date === value}
              title={bookable ? `${day.available_slots}/${day.total_slots} khung còn trống` : status.label}
              onClick={() => onChange(day.date)}
            >
              {Number(day.date.slice(8, 10))}
              <small>{bookable ? `${day.available_slots} trống` : status.label}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
};
