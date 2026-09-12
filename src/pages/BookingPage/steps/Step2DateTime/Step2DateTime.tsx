import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Sun,
  Cloud,
  Moon,
  Loader2,
  User,
  Check,
} from 'lucide-react';
import type { BookingDoctor } from '../../../../types/booking';
import { apiGetDoctorSlots } from '../../../../api/functions/doctors';
import type { AvailableSlot } from '../../../../api/types';
import { formatDateLabel, formatTimeLabel, monthGrid, todayIso, toIsoDate } from '../../bookingFormat';
import './Step2DateTime.css';

interface Step2DateTimeProps {
  selectedDoctor: BookingDoctor | null;
  /** 'yyyy-MM-dd'. */
  selectedDate: string;
  /** 'HH:mm:ss'. */
  selectedTime: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onChangeDoctor?: () => void;
}

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80';

const MONTH_LABELS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

/** Slot chia theo buổi để đọc cho nhanh; mốc giờ khớp với cách phòng khám nói về ca. */
function partOfDay(startTime: string): 'morning' | 'afternoon' | 'evening' {
  const hour = Number(startTime.slice(0, 2));

  if (hour < 12) {
    return 'morning';
  }

  return hour < 17 ? 'afternoon' : 'evening';
}

export const Step2DateTime: React.FC<Step2DateTimeProps> = ({
  selectedDoctor,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  onPrevStep,
  onNextStep,
  onChangeDoctor,
}) => {
  const today = todayIso();
  const [year, month] = selectedDate
    ? selectedDate.split('-').map(Number)
    : today.split('-').map(Number);

  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);

  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const result = await apiGetDoctorSlots(selectedDoctor.doctorId, selectedDate);

      if (cancelled) {
        return;
      }

      if (!result.ok || !result.data) {
        setError(result.error);
        setSlots([]);
        setIsHoliday(false);
      } else {
        setSlots(result.data.slots);
        setIsHoliday(result.data.is_clinic_holiday);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedDoctor, selectedDate]);

  const grouped = useMemo(() => {
    const buckets: Record<'morning' | 'afternoon' | 'evening', AvailableSlot[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };

    for (const slot of slots) {
      buckets[partOfDay(slot.start_time)].push(slot);
    }

    return buckets;
  }, [slots]);

  const days = useMemo(() => monthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const shiftMonth = (delta: number) => {
    const shifted = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(shifted.getFullYear());
    setViewMonth(shifted.getMonth() + 1);
  };

  const doctor = selectedDoctor;

  if (!doctor) {
    return (
      <div className="step2-container">
        <h2 className="step2-main-heading">BƯỚC 2: CHỌN NGÀY &amp; GIỜ KHÁM</h2>
        <div className="account-alert error" role="alert">
          <AlertCircle size={16} />
          <span>Vui lòng quay lại bước 1 và chọn bác sĩ trước.</span>
        </div>
        <div className="step2-bottom-actions">
          <button type="button" className="btn-back-step" onClick={onPrevStep}>
            <ArrowLeft size={15} />
            <span>Quay lại</span>
          </button>
        </div>
      </div>
    );
  }

  const renderSlotGroup = (
    key: 'morning' | 'afternoon' | 'evening',
    label: string,
    icon: React.ReactNode,
    labelClass: string,
  ) => {
    const group = grouped[key];

    if (group.length === 0) {
      return null;
    }

    return (
      <div className="time-section-block">
        <div className={`time-section-label ${labelClass}`}>
          {icon}
          <span>{label}</span>
        </div>
        <div className="time-slots-row">
          {group.map((slot) => {
            const isSelected = selectedTime === slot.start_time;

            return (
              <button
                key={slot.start_time}
                type="button"
                className={`time-slot-btn ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelectTime(slot.start_time)}
              >
                <span>{formatTimeLabel(slot.start_time)}</span>
                {isSelected && <Check size={12} strokeWidth={3} className="slot-check" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="step2-container">
      <h2 className="step2-main-heading">BƯỚC 2: CHỌN NGÀY &amp; GIỜ KHÁM</h2>

      {/* ── Top Doctor Card ── */}
      <div className="step2-doctor-card">
        <div className="step2-doc-left">
          <img
            src={doctor.avatar ?? FALLBACK_AVATAR}
            alt={doctor.name}
            className="step2-doc-avatar"
            onError={(event) => {
              (event.target as HTMLImageElement).src = FALLBACK_AVATAR;
            }}
          />
          <div className="step2-doc-info">
            <h3 className="step2-doc-name">{doctor.name}</h3>
            <p className="step2-doc-spec">Chuyên khoa: {doctor.specialty}</p>
            <div className="step2-doc-meta">
              <span className="doc-meta-item">
                <User size={13} className="meta-icon" />
                <span>{doctor.experienceYears} năm kinh nghiệm</span>
              </span>
              {doctor.degree && <span className="doc-meta-item">{doctor.degree}</span>}
            </div>
          </div>
        </div>
        <button type="button" className="btn-change-doctor" onClick={onChangeDoctor}>
          Đổi bác sĩ
        </button>
      </div>

      {/* ── 2 Column Grid: Calendar & Time Slots ── */}
      <div className="step2-selection-grid">
        {/* Left: Calendar Card */}
        <div className="step2-calendar-card">
          <div className="calendar-header">
            <h4 className="calendar-title">Chọn ngày khám</h4>
            <div className="calendar-month-nav">
              <button
                type="button"
                className="month-nav-btn"
                onClick={() => shiftMonth(-1)}
                aria-label="Tháng trước"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="month-nav-label">
                {MONTH_LABELS[viewMonth - 1]}, {viewYear}
              </span>
              <button
                type="button"
                className="month-nav-btn"
                onClick={() => shiftMonth(1)}
                aria-label="Tháng sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="calendar-weekdays">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span>CN</span>
          </div>

          <div className="calendar-days-grid">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`blank-${index}`} className="cal-day prev-month" />;
              }

              const iso = toIsoDate(new Date(viewYear, viewMonth - 1, day));
              const isSelected = iso === selectedDate;

              // Ngày đã qua không đặt được; backend cũng sẽ từ chối, nhưng chặn ở đây thì
              // người dùng không phải bấm mới biết.
              const isPast = iso < today;

              return (
                <button
                  key={iso}
                  type="button"
                  className={`cal-day current-month ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => onSelectDate(iso)}
                  disabled={isPast}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot dot-available" />
              <span>Ngày có thể đặt</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot dot-off" />
              <span>Ngày đã qua</span>
            </div>
          </div>
        </div>

        {/* Right: Time Slots Card */}
        <div className="step2-times-card">
          <h4 className="times-card-title">Chọn giờ khám cho ngày {formatDateLabel(selectedDate)}</h4>

          {error && (
            <div className="account-alert error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="full-page-loader">
              <Loader2 className="full-page-loader-icon" size={28} />
              <span>Đang tải khung giờ trống...</span>
            </div>
          ) : isHoliday ? (
            <div className="no-doctors-msg">Phòng khám nghỉ vào ngày này. Vui lòng chọn ngày khác.</div>
          ) : slots.length === 0 ? (
            <div className="no-doctors-msg">
              Bác sĩ không còn khung giờ trống trong ngày này. Vui lòng chọn ngày khác hoặc đổi bác sĩ.
            </div>
          ) : (
            <>
              {renderSlotGroup('morning', 'BUỔI SÁNG', <Sun size={14} className="time-icon-morning" />, 'label-morning')}
              {renderSlotGroup('afternoon', 'BUỔI CHIỀU', <Cloud size={14} className="time-icon-afternoon" />, 'label-afternoon')}
              {renderSlotGroup('evening', 'BUỔI TỐI', <Moon size={14} className="time-icon-evening" />, 'label-evening')}
            </>
          )}
        </div>
      </div>

      {/* ── Bottom Action Buttons ── */}
      <div className="step2-bottom-actions">
        <button type="button" className="btn-back-step" onClick={onPrevStep}>
          <ArrowLeft size={15} />
          <span>Quay lại</span>
        </button>
        <button
          type="button"
          className="btn-next-step"
          onClick={onNextStep}
          disabled={!selectedTime}
        >
          <span>Tiếp tục</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};
