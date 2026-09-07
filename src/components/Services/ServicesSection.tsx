import React, { useState } from 'react';
import {
  UserCheck,
  Stethoscope,
  Droplets,
  Sparkles,
  ShieldCheck,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { ServiceItem } from '../../types';

interface ServicesSectionProps {
  onSelectService?: (serviceTitle: string) => void;
}

const allServicesData: ServiceItem[] = [
  {
    id: 'basic-exam',
    iconType: 'basic',
    title: 'Khám da liễu cơ bản',
    description: 'Kiểm tra và đánh giá tình trạng da tổng quát',
  },
  {
    id: 'skin-analysis',
    iconType: 'deep',
    title: 'Soi da chuyên sâu',
    description: 'Phân tích chi tiết các vấn đề tiềm ẩn của làn da',
  },
  {
    id: 'acne-treatment',
    iconType: 'acne',
    title: 'Điều trị mụn',
    description: 'Tư vấn và điều trị mụn theo tình trạng da',
  },
  {
    id: 'laser-tech',
    iconType: 'laser',
    title: 'Laser thẩm mỹ',
    description: 'Điều trị nám, tàn nhang và sẹo rỗ công nghệ cao',
  },
  {
    id: 'skin-rejuvenation',
    iconType: 'rejuvenation',
    title: 'Trẻ hóa làn da',
    description: 'Cải thiện độ đàn hồi và phục hồi cấu trúc da',
  },
  {
    id: 'skin-whitening',
    iconType: 'whitening',
    title: 'Dưỡng sáng chuyên sâu',
    description: 'Liệu trình nuôi dưỡng làn da trắng hồng tự nhiên',
  },
];

const renderServiceIcon = (type: ServiceItem['iconType']) => {
  switch (type) {
    case 'basic':
      return <UserCheck size={26} />;
    case 'deep':
      return <Stethoscope size={26} />;
    case 'acne':
      return <Droplets size={26} />;
    case 'laser':
      return <Sparkles size={26} />;
    case 'rejuvenation':
      return <ShieldCheck size={26} />;
    case 'whitening':
      return <HeartPulse size={26} />;
    default:
      return <Sparkles size={26} />;
  }
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 3;
  const maxIndex = Math.max(0, allServicesData.length - itemsPerPage);

  const handlePrev = () => {
    setStartIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
  };

  const visibleServices = allServicesData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section id="services" className="services-section">
      <div className="container services-container">
        {/* Section Heading */}
        <div className="section-header-centered">
          <h2 className="section-main-title">Dịch vụ của chúng tôi</h2>
          <p className="section-main-subtitle">
            Cung cấp các dịch vụ chăm sóc da chất lượng cao
          </p>
        </div>

        {/* Carousel Wrapper with Left & Right Arrows */}
        <div className="services-carousel-wrapper">
          {/* Prev Arrow */}
          <button
            type="button"
            className="carousel-arrow-btn arrow-prev"
            onClick={handlePrev}
            aria-label="Previous services"
          >
            <ChevronLeft size={38} strokeWidth={1.5} />
          </button>

          {/* 3 Service Cards Grid */}
          <div className="services-grid">
            {visibleServices.map((service) => (
              <div
                key={service.id}
                className="service-card"
                onClick={() => onSelectService?.(service.title)}
              >
                <div className="service-icon-wrapper">
                  {renderServiceIcon(service.iconType)}
                </div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
              </div>
            ))}
          </div>

          {/* Next Arrow */}
          <button
            type="button"
            className="carousel-arrow-btn arrow-next"
            onClick={handleNext}
            aria-label="Next services"
          >
            <ChevronRight size={38} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
};
