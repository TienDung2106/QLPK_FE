import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Sun,
  Cloud,
  Moon,
  Star,
  User,
  Check,
} from 'lucide-react';
import type { BookingDoctor } from '../../../../types/booking';
import './Step2DateTime.css';

interface Step2DateTimeProps {
  selectedDoctor: BookingDoctor | null;
  selectedDate: string;
  selectedTime: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onChangeDoctor?: () => void;
}

const MORNING_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const AFTERNOON_SLOTS = ['13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
const EVENING_SLOTS = ['18:00', '18:30', '19:00', '19:30'];

// Disabled/Booked slots as shown in the screenshot
const DISABLED_SLOTS = ['13:30', '19:00', '19:30'];

export const Step2DateTime: React.FC<Step2DateTimeProps> = ({
  selectedDoctor,
  selectedTime = '09:00',
  onSelectDate,
  onSelectTime,
  onPrevStep,
  onNextStep,
  onChangeDoctor,
}) => {
  const [selectedDayNumber, setSelectedDayNumber] = useState(25);
  const [currentMonth, setCurrentMonth] = useState('Tháng 5, 2026');

  const doctor = selectedDoctor ?? {
    id: 'doc-1',
    name: 'BS. Nguyễn Văn A',
    specialty: 'Da liễu tổng quát',
    rating: 4.8,
    reviewCount: 120,
    experienceYears: 8,
    avatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
  };

  const handleDateClick = (day: number) => {
    setSelectedDayNumber(day);
    const dateStr = `${String(day).padStart(2, '0')}/05/2026`;
    onSelectDate(dateStr);
  };

  const handleSlotClick = (slot: string) => {
    if (!DISABLED_SLOTS.includes(slot)) {
      onSelectTime(slot);
    }
  };

  // Calendar days matching May 2026 layout from screenshot
  // Row 1: 27, 28, 29, 30 (prev month), 1, 2, 3
  // Row 2: 4, 5, 6, 7 (highlighted), 8, 9, 10
  // Row 3: 11, 12, 13, 14, 15 (highlighted), 16, 17
  // Row 4: 18, 19, 20, 21, 22, 23, 24
  // Row 5: 25 (selected), 26, 27, 28, 29, 30, 31
  const prevMonthDays = [27, 28, 29, 30];
  const currentMonthDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="step2-container">
      {/* ── Main Step Heading ── */}
      <h2 className="step2-main-heading">BƯỚC 2: CHỌN NGÀY & GIỜ KHÁM</h2>

      {/* ── Top Doctor Card ── */}
      <div className="step2-doctor-card">
        <div className="step2-doc-left">
          <img
            src={doctor.avatar}
            alt={doctor.name}
            className="step2-doc-avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80';
            }}
          />
          <div className="step2-doc-info">
            <h3 className="step2-doc-name">{doctor.name}</h3>
            <p className="step2-doc-spec">Chuyên khoa: {doctor.specialty}</p>
            <div className="step2-doc-meta">
              <span className="doc-meta-item">
                <User size={13} className="meta-icon" />
                <span>{doctor.experienceYears ?? 8} năm kinh nghiệm</span>
              </span>
              <span className="doc-meta-item">
                <Star size={13} className="star-icon" fill="#f59e0b" />
                <span className="star-score">{doctor.rating ?? 4.8}</span>
                <span className="review-text">({doctor.reviewCount ?? 120} đánh giá)</span>
              </span>
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
                onClick={() => setCurrentMonth('Tháng 4, 2026')}
                aria-label="Tháng trước"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="month-nav-label">{currentMonth}</span>
              <button
                type="button"
                className="month-nav-btn"
                onClick={() => setCurrentMonth('Tháng 6, 2026')}
                aria-label="Tháng sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="calendar-weekdays">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span>CN</span>
          </div>

          {/* Days Grid */}
          <div className="calendar-days-grid">
            {prevMonthDays.map((d) => (
              <div key={`prev-${d}`} className="cal-day prev-month">
                {d}
              </div>
            ))}
            {currentMonthDays.map((d) => {
              const isSelected = selectedDayNumber === d;
              const isHighlighted = d === 7 || d === 15;
              return (
                <button
                  key={`day-${d}`}
                  type="button"
                  className={`cal-day current-month ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
                  onClick={() => handleDateClick(d)}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot dot-available" />
              <span>Ngày có thể đặt</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot dot-booked" />
              <span>Ngày đã kín</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot dot-off" />
              <span>Ngày nghỉ</span>
            </div>
          </div>
        </div>

        {/* Right: Time Slots Card */}
        <div className="step2-times-card">
          <h4 className="times-card-title">
            Chọn giờ khám cho ngày {String(selectedDayNumber).padStart(2, '0')}/05/2026
          </h4>

          {/* Morning */}
          <div className="time-section-block">
            <div className="time-section-label label-morning">
              <Sun size={14} className="time-icon-morning" />
              <span>BUỔI SÁNG</span>
            </div>
            <div className="time-slots-row">
              {MORNING_SLOTS.map((slot) => {
                const isSelected = selectedTime === slot;
                const isDisabled = DISABLED_SLOTS.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    className={`time-slot-btn ${isSelected ? 'is-selected' : ''} ${isDisabled ? 'is-disabled' : ''}`}
                    onClick={() => handleSlotClick(slot)}
                    disabled={isDisabled}
                  >
                    <span>{slot}</span>
                    {isSelected && <Check size={12} strokeWidth={3} className="slot-check" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Afternoon */}
          <div className="time-section-block">
            <div className="time-section-label label-afternoon">
              <Cloud size={14} className="time-icon-afternoon" />
              <span>BUỔI CHIỀU</span>
            </div>
            <div className="time-slots-row">
              {AFTERNOON_SLOTS.map((slot) => {
                const isSelected = selectedTime === slot;
                const isDisabled = DISABLED_SLOTS.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    className={`time-slot-btn ${isSelected ? 'is-selected' : ''} ${isDisabled ? 'is-disabled' : ''}`}
                    onClick={() => handleSlotClick(slot)}
                    disabled={isDisabled}
                  >
                    <span>{slot}</span>
                    {isSelected && <Check size={12} strokeWidth={3} className="slot-check" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Evening */}
          <div className="time-section-block">
            <div className="time-section-label label-evening">
              <Moon size={14} className="time-icon-evening" />
              <span>BUỔI TỐI</span>
            </div>
            <div className="time-slots-row">
              {EVENING_SLOTS.map((slot) => {
                const isSelected = selectedTime === slot;
                const isDisabled = DISABLED_SLOTS.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    className={`time-slot-btn ${isSelected ? 'is-selected' : ''} ${isDisabled ? 'is-disabled' : ''}`}
                    onClick={() => handleSlotClick(slot)}
                    disabled={isDisabled}
                  >
                    <span>{slot}</span>
                    {isSelected && <Check size={12} strokeWidth={3} className="slot-check" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Action Buttons ── */}
      <div className="step2-bottom-actions">
        <button type="button" className="btn-back-step" onClick={onPrevStep}>
          <ArrowLeft size={15} />
          <span>Quay lại</span>
        </button>
        <button type="button" className="btn-next-step" onClick={onNextStep}>
          <span>Tiếp tục</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};
