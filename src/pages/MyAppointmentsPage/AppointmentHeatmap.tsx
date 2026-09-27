import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { apiGetMyAppointments } from '../../api/functions/appointments';
import { APPOINTMENT_STATUS } from '../../api/types';
import { formatDate } from '../../staff/format';

const DAY_MS = 86_400_000;
const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2];
const WEEKDAYS = ['T2', '', 'T4', '', 'T6', '', ''];
const SKIPPED = new Set<string>([APPOINTMENT_STATUS.Cancelled, APPOINTMENT_STATUS.NoShow]);

interface DayCount {
  booked: number;
  done: number;
}

/** Mọi ngày trong năm, kèm số ô trống đầu lưới để ngày 1/1 rơi đúng thứ (tuần bắt đầu thứ Hai). */
function yearDays(year: number) {
  const first = Date.UTC(year, 0, 1);
  const offset = (new Date(first).getUTCDay() + 6) % 7;
  const length = (Date.UTC(year + 1, 0, 1) - first) / DAY_MS;
  const dates = Array.from({ length }, (_, index) => new Date(first + index * DAY_MS).toISOString().slice(0, 10));
  return { offset, dates };
}

interface Props {
  /** Tăng lên sau khi huỷ hoặc dời lịch để nạp lại. */
  refreshKey: number;
}

/** Lịch hẹn cả năm dạng ô vuông như contributions của GitHub: ô càng đậm càng nhiều lịch khám. */
export const AppointmentHeatmap = ({ refreshKey }: Props) => {
  const [year, setYear] = useState(THIS_YEAR);
  const [counts, setCounts] = useState<Map<string, DayCount> | null>(null);

  useEffect(() => {
    let cancelled = false;
    // ponytail: một trang 100 lịch/năm là đủ cho một bệnh nhân; cần hơn thì thêm endpoint đếm theo ngày
    apiGetMyAppointments({ from_date: `${year}-01-01`, to_date: `${year}-12-31`, page_size: 100 }).then((result) => {
      if (cancelled) return;
      const map = new Map<string, DayCount>();
      for (const item of result.data?.items ?? []) {
        if (SKIPPED.has(item.status)) continue;
        const day = map.get(item.appointment_date) ?? { booked: 0, done: 0 };
        day.booked += 1;
        if (item.status === APPOINTMENT_STATUS.Completed) day.done += 1;
        map.set(item.appointment_date, day);
      }
      setCounts(map);
    });
    return () => {
      cancelled = true;
    };
  }, [year, refreshKey]);

  const { offset, dates } = yearDays(year);
  const total = counts ? [...counts.values()].reduce((sum, day) => sum + day.booked, 0) : 0;
  const done = counts ? [...counts.values()].reduce((sum, day) => sum + day.done, 0) : 0;
  const monthColumns = Array.from({ length: 12 }, (_, month) => {
    const dayOfYear = (Date.UTC(year, month, 1) - Date.UTC(year, 0, 1)) / DAY_MS;
    return Math.floor((offset + dayOfYear) / 7) + 1;
  });

  return (
    <section className="heatmap-card" aria-label={`Lịch khám năm ${year}`}>
      <div className="heatmap-main">
        <p className="heatmap-summary">
          {counts ? (
            <><strong>{total}</strong> lịch khám trong {year}{done > 0 && <> · <strong>{done}</strong> đã khám</>}</>
          ) : (
            'Đang tải…'
          )}
        </p>

        <div className="heatmap-scroll" style={{ '--weeks': Math.ceil((offset + dates.length) / 7) } as CSSProperties}>
          <div className="heatmap-months" aria-hidden="true">
            {monthColumns.map((column, month) => (
              <span key={month} style={{ gridColumn: column }}>Th{month + 1}</span>
            ))}
          </div>
          <div className="heatmap-body">
            <div className="heatmap-weekdays" aria-hidden="true">
              {WEEKDAYS.map((label, index) => <span key={index}>{label}</span>)}
            </div>
            <div className="heatmap-grid" role="img" aria-label={`${total} lịch khám trong năm ${year}`}>
              {Array.from({ length: offset }, (_, index) => <span key={`pad-${index}`} />)}
              {dates.map((date) => {
                const day = counts?.get(date);
                const level = !day ? 0 : Math.min(day.booked, 3);
                const title = day
                  ? `${formatDate(date)}: ${day.booked} lịch${day.done ? ` (${day.done} đã khám)` : ''}`
                  : `${formatDate(date)}: không có lịch`;
                return <i key={date} className={`heatmap-cell level-${level}`} title={title} />;
              })}
            </div>
          </div>
        </div>

        <div className="heatmap-legend" aria-hidden="true">
          Ít {[0, 1, 2, 3].map((level) => <i key={level} className={`heatmap-cell level-${level}`} />)} Nhiều
        </div>
      </div>

      <div className="heatmap-years" role="group" aria-label="Chọn năm">
        {YEARS.map((option) => (
          <button key={option} type="button" aria-pressed={option === year} onClick={() => setYear(option)}>
            {option}
          </button>
        ))}
      </div>
    </section>
  );
};
