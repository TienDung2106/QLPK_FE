import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AppointmentListItem } from '../../api/types';
import { todayIso } from '../../staff/format';
import { monthDays, shiftMonth } from '../../staff/desk/calendarDates';
import { countByGroup, GROUPS, groupOf } from './statusGroups';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

interface Props {
  appointments: AppointmentListItem[];
  /** Ngày đang lọc ở danh sách, khoanh đậm trên lịch. */
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

/** Lịch tháng có chấm màu: liếc là biết ngày nào có lịch và lịch nào còn phải làm gì. */
export const AppointmentOverview = ({ appointments, selectedDate, onSelectDate }: Props) => {
  const today = todayIso();
  // mở ở tháng có lịch sắp tới gần nhất, không có thì tháng hiện tại
  const [month, setMonth] = useState(() =>
    (appointments.map((a) => a.appointment_date).filter((date) => date >= today).sort()[0] ?? today).slice(0, 7),
  );
  // chọn ngày ở ô tìm kiếm thì lịch nhảy tới tháng đó
  const [shownDate, setShownDate] = useState(selectedDate);
  if (selectedDate !== shownDate) {
    setShownDate(selectedDate);
    if (selectedDate) setMonth(selectedDate.slice(0, 7));
  }
  const [year, monthNumber] = month.split('-').map(Number);

  const byDate = new Map<string, AppointmentListItem[]>();
  for (const appointment of appointments) {
    byDate.set(appointment.appointment_date, [...(byDate.get(appointment.appointment_date) ?? []), appointment]);
  }

  return (
    <div className="appointment-overview">
      <div className="overview-nav">
        <button type="button" aria-label="Tháng trước" onClick={() => setMonth(shiftMonth(month, -1))}>
          <ChevronLeft size={16} />
        </button>
        <strong>Tháng {monthNumber}, {year}</strong>
        <button type="button" aria-label="Tháng sau" onClick={() => setMonth(shiftMonth(month, 1))}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="overview-grid" aria-hidden="true">
        {WEEKDAYS.map((day) => <span key={day} className="overview-weekday">{day}</span>)}
      </div>
      <div className="overview-grid">
        {monthDays(year, monthNumber).map((date, index) => {
          if (!date) return <span key={`blank-${index}`} />;
          const items = byDate.get(date) ?? [];
          const day = Number(date.slice(8));
          const className = `overview-day${date === today ? ' is-today' : ''}${date === selectedDate ? ' is-selected' : ''}`;
          if (items.length === 0) return <span key={date} className={className}>{day}</span>;
          const summary = countByGroup(items).map(({ group, count }) => `${count} ${group.label.toLowerCase()}`).join(', ');
          const label = `${day}/${monthNumber}: ${items.length} lịch — ${summary}`;
          return (
            <button key={date} type="button" className={`${className} has-items`} title={label} aria-label={label} aria-pressed={date === selectedDate} onClick={() => onSelectDate(date)}>
              {day}
              <span className="overview-dots">
                {items.slice(0, 3).map((a) => <i key={a.appointment_id} className={`dot-${groupOf(a.status).key}`} />)}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="overview-legend">
        {GROUPS.map((group) => (
          <li key={group.key}>
            <i className={`dot-${group.key}`} aria-hidden="true" />
            {group.label}
            <strong>{appointments.filter((a) => groupOf(a.status) === group).length}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};
