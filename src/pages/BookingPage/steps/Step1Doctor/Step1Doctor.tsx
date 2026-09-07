import React, { useState } from 'react';
import { Star, Briefcase, ChevronDown, ArrowRight, Info, Check } from 'lucide-react';
import type { BookingDoctor } from '../../../../types/booking';
import './Step1Doctor.css';

interface Step1DoctorProps {
  selectedDoctor: BookingDoctor | null;
  onSelectDoctor: (doctor: BookingDoctor) => void;
  onNextStep: () => void;
}

export const ALL_DOCTORS: BookingDoctor[] = [
  {
    id: 'doc-1',
    name: 'BS. Nguyễn Văn A',
    specialty: 'Da liễu tổng quát',
    specialtyId: 'tong-quat',
    rating: 4.9,
    reviewCount: 120,
    experienceYears: 8,
    gender: 'male',
    hasAvailableSlot: true,
    avatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
    price: 300000,
  },
  {
    id: 'doc-2',
    name: 'BS. Trần Thị B',
    specialty: 'Da liễu thẩm mỹ',
    specialtyId: 'tham-my',
    rating: 4.8,
    reviewCount: 96,
    experienceYears: 7,
    gender: 'female',
    hasAvailableSlot: true,
    avatar:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80',
    price: 400000,
  },
  {
    id: 'doc-3',
    name: 'BS. Lê Minh C',
    specialty: 'Da liễu nhi',
    specialtyId: 'nhi',
    rating: 4.7,
    reviewCount: 85,
    experienceYears: 6,
    gender: 'male',
    hasAvailableSlot: true,
    avatar:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80',
    price: 350000,
  },
];

const SPECIALTIES = [
  { value: 'tong-quat', label: 'Da liễu tổng quát' },
  { value: 'tham-my', label: 'Da liễu thẩm mỹ' },
  { value: 'nhi', label: 'Da liễu nhi' },
  { value: 'all', label: 'Tất cả chuyên khoa' },
];

export const Step1Doctor: React.FC<Step1DoctorProps> = ({
  selectedDoctor,
  onSelectDoctor,
  onNextStep,
}) => {
  const [specialty, setSpecialty] = useState('tong-quat');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [onlyFemale, setOnlyFemale] = useState(false);

  // We filter doctors based on selection, or show all 3 if matched
  const filtered = ALL_DOCTORS.filter((d) => {
    if (onlyFemale && d.gender !== 'female') return false;
    return true;
  });

  return (
    <div className="step1-wrapper">
      {/* ── Step Badge Header ── */}
      <div className="step1-badge-header">
        <div className="step-number-badge">1</div>
        <h2 className="step1-heading">BƯỚC 1: CHỌN BÁC SĨ</h2>
      </div>

      {/* ── Body: filter sidebar + doctor list ── */}
      <div className="step1-body">
        {/* Left: Filter Sidebar */}
        <aside className="step1-filter-sidebar">
          {/* Specialty Dropdown */}
          <div className="filter-group">
            <label className="filter-label">Chọn chuyên khoa</label>
            <div className="select-wrapper">
              <select
                className="filter-select"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                {SPECIALTIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="select-chevron" />
            </div>
          </div>

          {/* Other Filters */}
          <div className="filter-group">
            <label className="filter-label">Bộ lọc khác</label>
            <div className="filter-checkboxes">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="filter-checkbox"
                />
                <span>Chỉ hiển thị bác sĩ có lịch trống</span>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={onlyFemale}
                  onChange={(e) => setOnlyFemale(e.target.checked)}
                  className="filter-checkbox"
                />
                <span>Bác sĩ nữ</span>
              </label>
            </div>
          </div>

          {/* Guide Box */}
          <div className="filter-guide-box">
            <div className="guide-icon-row">
              <Info size={14} className="guide-icon" />
              <strong>Hướng dẫn</strong>
            </div>
            <p>
              Vui lòng chọn bác sĩ mà bạn muốn đặt lịch khám. Hệ thống sẽ hiển thị các khung giờ
              còn trống phù hợp với lịch làm việc của bác sĩ.
            </p>
          </div>
        </aside>

        {/* Right: Doctor List */}
        <div className="step1-doctor-list">
          <h3 className="doctor-list-heading">Danh sách bác sĩ</h3>

          {filtered.length === 0 && (
            <div className="no-doctors-msg">Không tìm thấy bác sĩ phù hợp.</div>
          )}

          <div className="doctor-rows">
            {filtered.map((doctor) => {
              const isSel = (selectedDoctor?.id ?? 'doc-1') === doctor.id;
              return (
                <div
                  key={doctor.id}
                  className={`doctor-row-card ${isSel ? 'is-selected' : ''}`}
                  onClick={() => onSelectDoctor(doctor)}
                >
                  {/* Selected check badge at top-right */}
                  {isSel && (
                    <div className="card-top-right-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="row-avatar-wrap">
                    <img
                      src={doctor.avatar}
                      alt={doctor.name}
                      className="row-avatar"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="row-info">
                    <h4 className="row-doctor-name">{doctor.name}</h4>
                    <p className="row-specialty">{doctor.specialty}</p>
                    <div className="row-meta">
                      <span className="row-rating">
                        <Star size={13} className="star-icon" fill="#f59e0b" />
                        <span className="rating-score">{doctor.rating}</span>
                        <span className="review-count">({doctor.reviewCount} đánh giá)</span>
                      </span>
                      <span className="row-exp">
                        <Briefcase size={13} className="exp-icon" />
                        <span>{doctor.experienceYears} năm kinh nghiệm</span>
                      </span>
                    </div>
                  </div>

                  {/* Select Button */}
                  <button
                    type="button"
                    className={`btn-choose-doctor ${isSel ? 'chosen' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDoctor(doctor);
                    }}
                  >
                    Chọn bác sĩ
                  </button>
                </div>
              );
            })}
          </div>

          {/* Next button */}
          <div className="step1-next-row">
            <button
              type="button"
              className="step1-next-btn"
              onClick={onNextStep}
            >
              <span>Tiếp tục</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
