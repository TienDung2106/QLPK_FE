import React, { useEffect } from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer/Footer';
import './ClinicDetailPage.css';

interface ClinicDetailPageProps {
  onBackToHome: () => void;
  onOpenBooking: () => void;
}

export const ClinicDetailPage: React.FC<ClinicDetailPageProps> = ({
  onBackToHome,
  onOpenBooking,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const facilityImages = [
    {
      url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80',
      title: 'Phòng khám đa năng & điều trị',
    },
    {
      url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
      title: 'Phòng chăm sóc da chuyên sâu',
    },
    {
      url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
      title: 'Hệ thống thiết bị Laser thẩm mỹ',
    },
    {
      url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
      title: 'Khu vực phục hồi & trị liệu',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Đặt lịch khám',
      desc: 'Khách đặt lịch qua website hoặc hotline',
    },
    {
      number: '02',
      title: 'Tiếp nhận thông tin',
      desc: 'Xác nhận lịch hẹn và tư vấn sơ bộ',
    },
    {
      number: '03',
      title: 'Thăm khám & Tư vấn',
      desc: 'Bác sĩ thăm khám và đưa ra phác đồ phù hợp',
    },
    {
      number: '04',
      title: 'Điều trị & Theo dõi',
      desc: 'Tiến hành điều trị và hẹn lịch tái khám',
    },
  ];

  const doctors = [
    {
      name: 'BS. Nguyễn Thu Hà',
      title: 'Chuyên khoa da liễu',
      exp: 'Kinh nghiệm 10 năm',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'BS. Trần Minh Anh',
      title: 'Chuyên khoa da liễu & Laser',
      exp: 'Kinh nghiệm 8 năm',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'BS. Lê Hoàng Nam',
      title: 'Chuyên khoa da liễu tổng quát',
      exp: 'Kinh nghiệm 12 năm',
      image: 'https://images.unsplash.com/photo-1594824813515-78335025d2c4?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'BS. Phạm Quỳnh Trang',
      title: 'Chuyên khoa thẩm mỹ da',
      exp: 'Kinh nghiệm 9 năm',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="clinic-detail-page">
      {/* Top Header */}
      <Header onOpenBooking={onOpenBooking} />

      {/* Breadcrumb Bar */}
      <div className="clinic-breadcrumb-bar">
        <div className="container">
          <nav className="breadcrumb-nav">
            <button className="breadcrumb-btn" onClick={onBackToHome}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Trang chủ
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Phòng khám Da Liễu</span>
          </nav>
        </div>
      </div>

      {/* 1. HERO BANNER */}
      <section className="clinic-hero-banner">
        <div className="clinic-hero-bg-overlay" />
        <div className="container clinic-hero-content">
          <div className="clinic-hero-text">
            <span className="clinic-hero-tag">Phòng khám da liễu</span>
            <h1 className="clinic-hero-heading">
              Chăm sóc làn da khỏe đẹp<br />cùng đội ngũ chuyên gia
            </h1>
            <div className="clinic-hero-actions">
              <button className="clinic-btn-primary" onClick={onOpenBooking}>
                Đặt lịch khám ngay
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
              <button className="clinic-btn-outline" onClick={onBackToHome}>
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT CONTAINER */}
      <div className="container clinic-detail-body">
        {/* 2. GIỚI THIỆU VỀ PHÒNG KHÁM */}
        <section className="figma-section figma-about-section">
          <h2 className="figma-section-title">Giới thiệu về phòng khám</h2>
          
          <div className="figma-about-grid">
            {/* Left Content */}
            <div className="figma-about-left">
              <p className="figma-about-desc">
                Phòng khám Da Liễu tự hào là đơn vị y tế chuyên sâu, cung cấp các dịch vụ khám, chẩn đoán và điều trị toàn diện các bệnh lý về da cũng như thẩm mỹ da chuẩn y khoa. Chúng tôi kết hợp phác đồ chuẩn quốc tế cùng kỹ thuật hiện đại nhằm đem lại hiệu quả bền vững và an toàn tuyệt đối.
              </p>

              <div className="figma-features-row">
                {/* Feature 1 */}
                <div className="figma-feature-item">
                  <div className="figma-feature-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1877f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h4 className="figma-feature-title">Đội ngũ chuyên gia</h4>
                  <p className="figma-feature-sub">Bác sĩ da liễu giàu kinh nghiệm</p>
                </div>

                {/* Feature 2 */}
                <div className="figma-feature-item">
                  <div className="figma-feature-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1877f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      <path d="M12 7v6" />
                      <path d="M9 10h6" />
                    </svg>
                  </div>
                  <h4 className="figma-feature-title">Trang thiết bị hiện đại</h4>
                  <p className="figma-feature-sub">Công nghệ tiên tiến, hiện đại</p>
                </div>

                {/* Feature 3 */}
                <div className="figma-feature-item">
                  <div className="figma-feature-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1877f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  </div>
                  <h4 className="figma-feature-title">Dịch vụ tận tâm</h4>
                  <p className="figma-feature-sub">Chăm sóc khách hàng chu đáo</p>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="figma-about-right">
              <div className="figma-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80"
                  alt="Đội ngũ bác sĩ da liễu hội chẩn"
                  className="figma-team-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. CƠ SỞ VẬT CHẤT */}
        <section className="figma-section figma-facility-section">
          <h2 className="figma-section-title">Cơ sở vật chất</h2>
          <div className="figma-facilities-grid">
            {facilityImages.map((fac, idx) => (
              <div key={idx} className="figma-facility-card">
                <div className="figma-facility-thumb-box">
                  <img
                    src={fac.url}
                    alt={fac.title}
                    className="figma-facility-thumb"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. QUY TRÌNH KHÁM */}
        <section className="figma-section figma-process-section">
          <h2 className="figma-section-title">Quy trình khám</h2>
          <div className="figma-process-timeline">
            <div className="figma-process-track-line" />
            <div className="figma-process-steps-grid">
              {steps.map((step, idx) => (
                <div key={idx} className="figma-process-step-col">
                  <div className="figma-step-badge-wrap">
                    <div className="figma-step-badge">{step.number}</div>
                  </div>
                  <h4 className="figma-step-title">{step.title}</h4>
                  <p className="figma-step-desc">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="figma-divider-line" />
        </section>

        {/* 5. ĐỘI NGŨ BÁC SĨ */}
        <section className="figma-section figma-doctors-section">
          <h2 className="figma-section-title">Đội ngũ bác sĩ</h2>
          <div className="figma-doctors-grid">
            {doctors.map((doc, idx) => (
              <div key={idx} className="figma-doctor-card">
                <div className="figma-doctor-img-wrap">
                  <img
                    src={doc.image}
                    alt={doc.name}
                    className="figma-doctor-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                </div>
                <div className="figma-doctor-info">
                  <h3 className="figma-doctor-name">{doc.name}</h3>
                  <p className="figma-doctor-spec">{doc.title}</p>
                  <p className="figma-doctor-exp">{doc.exp}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. CALL TO ACTION BANNER */}
        <div className="clinic-bottom-cta">
          <div className="clinic-cta-content">
            <h3 className="clinic-cta-title">Sẵn sàng trải nghiệm dịch vụ chuẩn y khoa?</h3>
            <p className="clinic-cta-desc">Đặt lịch ngay hôm nay để nhận tư vấn trực tiếp cùng đội ngũ bác sĩ chuyên khoa da liễu đầu ngành.</p>
          </div>
          <button className="clinic-btn-cta" onClick={onOpenBooking}>
            Đặt lịch khám ngay
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};
