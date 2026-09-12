import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, ChevronDown, ArrowRight, Info, Check, GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import type { BookingDoctor } from '../../../../types/booking';
import { apiGetDoctors } from '../../../../api/functions/doctors';
import type { DoctorListItem } from '../../../../api/types';
import { formatCurrency } from '../../bookingFormat';
import './Step1Doctor.css';

interface Step1DoctorProps {
  selectedDoctor: BookingDoctor | null;
  onSelectDoctor: (doctor: BookingDoctor) => void;
  onNextStep: () => void;
}

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80';

/** DoctorListItem của API → hình dạng luồng đặt lịch đang dùng. */
function toBookingDoctor(doctor: DoctorListItem): BookingDoctor {
  return {
    id: `doc-${doctor.doctor_id}`,
    doctorId: doctor.doctor_id,
    name: doctor.full_name,
    specialty: doctor.specialty_name,
    specialtyId: doctor.specialty_id,
    experienceYears: doctor.years_of_experience,
    degree: doctor.degree ?? undefined,
    avatar: doctor.avatar_url ?? FALLBACK_AVATAR,
    price: doctor.consultation_fee,
  };
}

export const Step1Doctor: React.FC<Step1DoctorProps> = ({
  selectedDoctor,
  onSelectDoctor,
  onNextStep,
}) => {
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [specialtyId, setSpecialtyId] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const result = await apiGetDoctors({ page_size: 50 });

      if (cancelled) {
        return;
      }

      if (!result.ok || !result.data) {
        setError(result.error);
        setDoctors([]);
      } else {
        setError(null);
        setDoctors(result.data.items);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Bộ lọc chuyên khoa dựng từ chính danh sách trả về, nên không cần thêm một endpoint
  // tra cứu chuyên khoa nữa. Mỗi bác sĩ mang đủ danh sách chuyên khoa họ hành nghề.
  const specialties = useMemo(() => {
    const seen = new Map<number, string>();

    for (const doctor of doctors) {
      for (const specialty of doctor.specialties.length > 0
        ? doctor.specialties
        : [{ specialty_id: doctor.specialty_id, specialty_name: doctor.specialty_name }]) {
        seen.set(specialty.specialty_id, specialty.specialty_name);
      }
    }

    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [doctors]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesSpecialty =
        specialtyId === 'all' ||
        doctor.specialty_id === specialtyId ||
        doctor.specialties.some((specialty) => specialty.specialty_id === specialtyId);

      const matchesSearch = !keyword || doctor.full_name.toLowerCase().includes(keyword);

      return matchesSpecialty && matchesSearch;
    });
  }, [doctors, specialtyId, search]);

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
          <div className="filter-group">
            <label className="filter-label" htmlFor="step1-specialty">
              Chọn chuyên khoa
            </label>
            <div className="select-wrapper">
              <select
                id="step1-specialty"
                className="filter-select"
                value={specialtyId}
                onChange={(event) =>
                  setSpecialtyId(event.target.value === 'all' ? 'all' : Number(event.target.value))
                }
              >
                <option value="all">Tất cả chuyên khoa</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="select-chevron" />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="step1-search">
              Tìm theo tên
            </label>
            <input
              id="step1-search"
              className="filter-select"
              type="search"
              placeholder="Nhập tên bác sĩ"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
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

          {error && (
            <div className="account-alert error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="full-page-loader">
              <Loader2 className="full-page-loader-icon" size={32} />
              <span>Đang tải danh sách bác sĩ...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="no-doctors-msg">
              {doctors.length === 0
                ? 'Phòng khám chưa công bố bác sĩ nhận lịch. Vui lòng liên hệ hotline để được hỗ trợ.'
                : 'Không tìm thấy bác sĩ phù hợp với bộ lọc.'}
            </div>
          ) : (
            <div className="doctor-rows">
              {filtered.map((item) => {
                const doctor = toBookingDoctor(item);
                const isSel = selectedDoctor?.doctorId === doctor.doctorId;

                return (
                  <div
                    key={doctor.id}
                    className={`doctor-row-card ${isSel ? 'is-selected' : ''}`}
                    onClick={() => onSelectDoctor(doctor)}
                  >
                    {isSel && (
                      <div className="card-top-right-badge">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}

                    <div className="row-avatar-wrap">
                      <img
                        src={doctor.avatar}
                        alt={doctor.name}
                        className="row-avatar"
                        onError={(event) => {
                          (event.target as HTMLImageElement).src = FALLBACK_AVATAR;
                        }}
                      />
                    </div>

                    <div className="row-info">
                      <h4 className="row-doctor-name">{doctor.name}</h4>
                      <p className="row-specialty">{doctor.specialty}</p>

                      {/* Không hiển thị điểm đánh giá: backend chưa ghi average_rating nên
                          nó luôn bằng 0, và một con số bịa ra ở đây sẽ bị đọc là thật. */}
                      <div className="row-meta">
                        <span className="row-exp">
                          <Briefcase size={13} className="exp-icon" />
                          <span>{doctor.experienceYears} năm kinh nghiệm</span>
                        </span>
                        {doctor.degree && (
                          <span className="row-exp">
                            <GraduationCap size={13} className="exp-icon" />
                            <span>{doctor.degree}</span>
                          </span>
                        )}
                      </div>

                      <p className="row-fee">Phí khám: {formatCurrency(doctor.price ?? 0)}</p>
                    </div>

                    <button
                      type="button"
                      className={`btn-choose-doctor ${isSel ? 'chosen' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectDoctor(doctor);
                      }}
                    >
                      Chọn bác sĩ
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Next button */}
          <div className="step1-next-row">
            <button
              type="button"
              className="step1-next-btn"
              onClick={onNextStep}
              disabled={!selectedDoctor}
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
