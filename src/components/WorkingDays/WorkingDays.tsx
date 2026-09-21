import type { DoctorWorkingHours } from '../../api/types';
import { summarizeWorkingHours } from '../../utils/workingHours';
import './WorkingDays.css';

/**
 * Tuần làm việc gọn: 7 ô thứ và khung giờ chính. Ô đậm là ngày làm đúng khung chính, ô viền là ngày
 * làm giờ khác (rê chuột xem giờ), ô xám là ngày nghỉ.
 */
export const WorkingDays = ({ rows }: { rows: DoctorWorkingHours[] }) => {
  const { days, mainHours } = summarizeWorkingHours(rows);

  if (!mainHours) {
    return <span className="working-days-empty">Chưa có lịch làm việc</span>;
  }

  const summary = days.map((day) => `${day.label}: ${day.hours ?? 'nghỉ'}`).join('; ');

  return (
    <div className="working-days" role="img" aria-label={`Lịch làm việc — ${summary}`}>
      <div className="working-days-pills" aria-hidden="true">
        {days.map((day) => (
          <span
            key={day.day}
            className={`working-day ${day.hours === null ? 'off' : day.isMain ? 'main' : 'other'}`}
            title={`${day.label}: ${day.hours ?? 'nghỉ'}`}
          >
            {day.label}
          </span>
        ))}
      </div>
      <span className="working-days-hours">{mainHours}</span>
    </div>
  );
};
