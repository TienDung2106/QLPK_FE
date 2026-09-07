import React, { useState } from 'react';
import {
  Info,
  Clock,
  Stethoscope,
  Scan,
  Sparkles,
  Shield,
  Sun,
  User,
  Tag,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import type { BookingDoctor } from '../../../../types/booking';
import './Step3Service.css';

export interface ServiceOption {
  id: string;
  title: string;
  badge?: string;
  description: string;
  duration: string;
  price: number;
  priceText?: string;
  icon: React.ReactNode;
}

interface Step3ServiceProps {
  selectedDoctor: BookingDoctor | null;
  selectedService: string;
  servicePrice: number;
  discountCode: string;
  discountAmount: number;
  onSelectService: (service: ServiceOption) => void;
  onApplyDiscount: (code: string) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
}

const SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: 'kham-co-ban',
    title: 'Khám da liễu cơ bản',
    badge: 'Phổ biến',
    description: 'Khám tổng quát sức khỏe làn da, tư vấn phác đồ và kê đơn điều trị mụn, viêm da...',
    duration: '30 phút',
    price: 300000,
    icon: <Stethoscope size={20} />,
  },
  {
    id: 'soi-da',
    title: 'Soi da chuyên sâu',
    description: 'Phân tích tình trạng da bằng máy công nghệ cao, đánh giá sắc tố và độ ẩm...',
    duration: '45 phút',
    price: 500000,
    icon: <Scan size={20} />,
  },
  {
    id: 'dieu-tri-mun',
    title: 'Điều trị mụn',
    description: 'Tư vấn và điều trị mụn chuyên sâu theo phác đồ bác sĩ cá nhân hóa phù hợp từng loại da...',
    duration: '60 phút',
    price: 700000,
    icon: <Sparkles size={20} />,
  },
  {
    id: 'nam-tan-nhang',
    title: 'Điều trị nám - tàn nhang',
    description: 'Điều trị sắc tố da bằng phương pháp tiên tiến kết hợp công nghệ Laser hiện đại...',
    duration: '60 phút',
    price: 1200000,
    icon: <Shield size={20} />,
  },
  {
    id: 'tre-hoa-da',
    title: 'Trẻ hóa da',
    description: 'Cải thiện nếp nhăn, nâng cơ mặt tăng sinh collagen giúp da căng bóng, khỏe đẹp...',
    duration: '90 phút',
    price: 1500000,
    icon: <Sun size={20} />,
  },
  {
    id: 'khac',
    title: 'Khác (theo yêu cầu)',
    description: 'Dịch vụ da liễu khác theo chỉ định của bác sĩ hoặc mong muốn từ phía khách hàng...',
    duration: 'Thời gian tùy chọn',
    price: 0,
    priceText: 'Liên hệ',
    icon: <User size={20} />,
  },
];

const formatVND = (price: number, text?: string) => {
  if (text) return text;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export const Step3Service: React.FC<Step3ServiceProps> = ({
  selectedService,
  onSelectService,
  onApplyDiscount,
  onPrevStep,
  onNextStep,
}) => {
  const [activeId, setActiveId] = useState<string>(selectedService || 'kham-co-ban');
  const [promoInput, setPromoInput] = useState('');
  const [showAll, setShowAll] = useState(false);

  const handleCardClick = (service: ServiceOption) => {
    setActiveId(service.id);
    onSelectService(service);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoInput.trim()) onApplyDiscount(promoInput.trim());
  };

  return (
    <div className="step3-container">
      <h2 className="step3-main-heading">BƯỚC 3: CHỌN DỊCH VỤ & MÃ GIẢM GIÁ</h2>

      {/* Info callout */}
      <div className="step3-callout">
        <Info size={16} className="callout-icon" />
        <span>Vui lòng chọn dịch vụ bạn muốn sử dụng trong buổi khám.</span>
      </div>

      {/* Services grid */}
      <section className="step3-services-section">
        <h3 className="step3-section-title">Dịch vụ phòng khám</h3>
        <div className="services-grid">
          {SERVICE_OPTIONS.map((service) => {
            const isSel = activeId === service.id;
            return (
              <div
                key={service.id}
                className={`service-card ${isSel ? 'is-selected' : ''}`}
                onClick={() => handleCardClick(service)}
              >
                {/* Top row */}
                <div className="card-top">
                  <div className="card-left">
                    <div className={`service-radio ${isSel ? 'checked' : ''}`}>
                      <div className="radio-dot" />
                    </div>
                    <h4 className="service-name">{service.title}</h4>
                    {service.badge && (
                      <span className="service-badge">{service.badge}</span>
                    )}
                  </div>
                  <div className="service-icon-box">{service.icon}</div>
                </div>

                {/* Description */}
                <p className="service-desc">{service.description}</p>

                {/* Bottom row */}
                <div className="card-bottom">
                  <div className="service-duration">
                    <Clock size={13} />
                    <span>{service.duration}</span>
                  </div>
                  <span className="service-price">
                    {formatVND(service.price, service.priceText)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {!showAll && (
          <div className="expand-btn-wrapper">
            <button type="button" className="expand-btn" onClick={() => setShowAll(true)}>
              <span>Xem thêm các dịch vụ</span>
              <ChevronDown size={15} />
            </button>
          </div>
        )}
      </section>

      {/* Discount section */}
      <section className="step3-discount-section">
        <h3 className="step3-section-title">Mã giảm giá (nếu có)</h3>
        <div className="discount-row">
          <form className="promo-form" onSubmit={handleApply}>
            <input
              type="text"
              className="promo-input"
              placeholder="Nhập mã giảm giá của bạn..."
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary promo-apply-btn">
              Áp dụng
            </button>
          </form>

          <div className="promo-info-box">
            <Tag size={16} className="tag-icon" />
            <div>
              <strong>Chưa có mã giảm giá</strong>
              <p>Bạn có thể bỏ qua bước này và áp dụng sau.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom nav */}
      <div className="step3-bottom-bar">
        <button type="button" className="btn-back-step" onClick={onPrevStep}>
          <ArrowLeft size={16} />
          <span>Quay lại</span>
        </button>
        <button type="button" className="btn btn-primary btn-next-step" onClick={onNextStep}>
          <span>Tiếp tục</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
