import React from 'react';
import { UserCheck, Building2, ShieldCheck, Clock } from 'lucide-react';
import type { StatItem } from '../../types';

const statsData: StatItem[] = [
  { value: '15+', label: 'Năm kinh nghiệm' },
  { value: '50+', label: 'Bác sĩ chuyên môn' },
  { value: '10k+', label: 'Bệnh nhân hài lòng' },
  { value: '24/7', label: 'Hỗ trợ tư vấn' },
];

const aboutFeatures = [
  {
    icon: <UserCheck size={22} />,
    title: 'Đội ngũ chuyên môn cao',
    description: 'Bác sĩ da liễu giàu kinh nghiệm, tận tâm',
  },
  {
    icon: <Building2 size={22} />,
    title: 'Công nghệ hiện đại',
    description: 'Thiết bị tiên tiến, không gian chuyên nghiệp',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Điều trị cá nhân hóa',
    description: 'Phác đồ phù hợp với từng tình trạng da',
  },
  {
    icon: <Clock size={22} />,
    title: 'Tư vấn tận tâm 24/7',
    description: 'Luôn sẵn sàng hỗ trợ và giải đáp',
  },
];

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="about-section">
      <div className="container about-container">
        {/* Left: Image with floating Stats Box */}
        <div className="about-media-col">
          <div className="about-image-wrapper">
            <img
              src="/images/treatment_room.jpg"
              alt="Phòng khám và chăm sóc da"
              className="about-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80';
              }}
            />

            {/* Floating Stats Card */}
            <div className="about-stats-card">
              <div className="stats-grid">
                {statsData.map((stat, idx) => (
                  <div key={idx} className="stat-box">
                    <span className="stat-value">{stat.value}</span>
                    <span className="stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Content & Features */}
        <div className="about-content-col">
          <div className="section-badge">
            <span>Về chúng tôi</span>
          </div>

          <h2 className="about-title">
            Chăm sóc làn da khỏe đẹp
            <br />
            cùng đội ngũ chuyên gia
          </h2>

          <p className="about-description">
            Với đội ngũ bác sĩ giàu kinh nghiệm trong lĩnh vực da liễu, chúng tôi mang đến
            các giải pháp chăm sóc và điều trị chuyên sâu, giúp bạn tự tin với làn da
            khỏe mạnh và rạng rỡ.
          </p>

          <div className="about-features-grid">
            {aboutFeatures.map((item, idx) => (
              <div key={idx} className="about-feature-card">
                <div className="feature-icon-wrapper">{item.icon}</div>
                <div className="feature-text-group">
                  <h3 className="feature-title">{item.title}</h3>
                  <p className="feature-desc">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
