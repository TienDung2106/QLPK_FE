import type { DoctorWorkingHours } from '../../api/types';
import { DAY_SHORT, SESSION_LABEL, groupWorkingHours } from '../../utils/workingHours';
import './WorkingDays.css';

/** Tuần làm việc theo buổi, mỗi buổi một dòng: "Sáng 07:30–11:30 · T2 T4 T6". Ngày nghỉ không hiện. */
export const WorkingDays = ({ rows }: { rows: DoctorWorkingHours[] }) => {
  const groups = groupWorkingHours(rows);

  if (groups.length === 0) {
    return <span className="working-days-empty">Chưa có lịch làm việc</span>;
  }

  const summary = groups
    .map((group) => `${SESSION_LABEL[group.session]} ${group.hours}: ${group.days.map((day) => DAY_SHORT[day]).join(', ')}`)
    .join('; ');

  return (
    <div className="working-days" role="img" aria-label={`Lịch làm việc — ${summary}`}>
      {groups.map((group) => (
        <div key={`${group.session}|${group.hours}`} className="working-days-row" aria-hidden="true">
          <span className={`working-days-session ${group.session}`}>{SESSION_LABEL[group.session]}</span>
          <span className="working-days-hours">{group.hours}</span>
          <span className="working-days-pills">
            {group.days.map((day) => (
              <span key={day} className={`working-day ${group.session}`}>
                {DAY_SHORT[day]}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
};
