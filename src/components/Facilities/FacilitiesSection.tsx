import React, { useState, useEffect } from 'react';

interface FacilitiesSectionProps {
  onViewDetail?: () => void;
}

const facilityImages = [
  {
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1400&q=80',
    title: 'Phòng khám hiện đại',
    desc: 'Không gian rộng rãi, trang thiết bị tân tiến',
  },
  {
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80',
    title: 'Sảnh đón tiếp sang trọng',
    desc: 'Không gian rộng rãi, tiện nghi và ấm cúng',
  },
  {
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1400&q=80',
    title: 'Phòng laser & chăm sóc da',
    desc: 'Công nghệ tái tạo và trẻ hóa da tiên tiến nhất',
  },
  {
    url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1400&q=80',
    title: 'Phòng tư vấn chuyên sâu',
    desc: 'Bác sĩ da liễu trực tiếp thăm khám 1:1',
  },
];

export const FacilitiesSection: React.FC<FacilitiesSectionProps> = ({ onViewDetail }) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  // Auto-play 4 images loop like a video
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % facilityImages.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="facilities" className="facilities-section">
      <div className="container facilities-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <h2 className="section-main-title">Khám phá phòng khám da liễu</h2>
          <p className="section-main-subtitle">
            Cơ sở vật chất hiện đại, dịch vụ chuyên nghiệp
          </p>
        </div>

        {/* Image Loop Showcase – clickable */}
        <div
          className="facility-showcase-wrapper"
          onClick={onViewDetail}
          role={onViewDetail ? 'button' : undefined}
          tabIndex={onViewDetail ? 0 : undefined}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && onViewDetail) {
              onViewDetail();
            }
          }}
          title={onViewDetail ? 'Nhấn để xem chi tiết phòng khám' : undefined}
        >
          {/* Slides */}
          <div className="facility-slides-container">
            {facilityImages.map((item, idx) => (
              <div
                key={idx}
                className={`facility-slide ${idx === currentIdx ? 'active' : ''}`}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="facility-image-slide"
                />
              </div>
            ))}
          </div>

          {/* Center Glassmorphism Card – title + desc only */}
          <div className="facility-glass-card">
            <h3 className="facility-card-title">{facilityImages[currentIdx].title}</h3>
            <p className="facility-card-desc">{facilityImages[currentIdx].desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
