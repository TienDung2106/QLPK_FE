import React from 'react';
import { Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onOpenBooking?: () => void;
  onViewServices?: () => void;
}

const keyFeatures = [
  'Đội ngũ bác sĩ chuyên môn cao',
  'Trang thiết bị hiện đại',
  'Điều trị cá nhân hóa',
  'Chi phí hợp lí',
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenBooking,
  onViewServices,
}) => {
  return (
    <section id="home" className="hero-section">
      <div className="container hero-container">
        {/* Left Content */}
        <div className="hero-content">
          <div className="hero-badge">
            <span>Phòng khám uy tín hàng đầu</span>
          </div>

          <h1 className="hero-title">
            Chăm Sóc Sức Khỏe
            <br />
            Làn Da Của Bạn
          </h1>

          <p className="hero-description">
            Phòng khám Da Liễu với đội ngũ y bác sĩ chuyên môn cao, trang thiết bị
            hiện đại, cam kết mang đến dịch vụ y tế chăm sóc da chất lượng tốt nhất cho bạn
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary hero-btn-booking"
              onClick={onOpenBooking}
            >
              <Calendar size={18} />
              <span>Đặt lịch khám</span>
            </button>

            <button
              type="button"
              className="btn btn-outline hero-btn-services"
              onClick={onViewServices}
            >
              <FileText size={18} />
              <span>Xem dịch vụ</span>
            </button>
          </div>

          <div className="hero-feature-list">
            {keyFeatures.map((feature, idx) => (
              <div key={idx} className="hero-feature-item">
                <CheckCircle2 size={18} className="check-icon" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Image */}
        <div className="hero-media">
          <div className="hero-image-wrapper">
            <img
              src="/images/hero_doctors.jpg"
              alt="Đội ngũ bác sĩ da liễu"
              className="hero-image"
              onError={(e) => {
                // Fallback high-quality medical image if local image not yet loaded
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1000&q=80';
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
