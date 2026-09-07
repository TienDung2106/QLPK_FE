import React from 'react';
import { MapPin, Clock, Mail, Phone } from 'lucide-react';

export const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="contact-section">
      <div className="container contact-container">
        {/* Section Heading */}
        <div className="section-header-centered">
          <h2 className="section-main-title">Liên hệ với chúng tôi</h2>
          <p className="section-main-subtitle">Chúng tôi luôn sẵn sàng hỗ trợ bạn!</p>
        </div>

        {/* 2-Column Contact Info & Map */}
        <div className="contact-grid">
          {/* Left Column: Info List */}
          <div className="contact-info-list">
            {/* Address Item */}
            <div className="contact-item">
              <div className="contact-icon-box">
                <MapPin size={22} />
              </div>
              <div className="contact-item-content">
                <h3 className="contact-item-title">Địa chỉ</h3>
                <div className="contact-item-text">
                  <p><strong>Cơ sở 1:</strong> 152 Chu Văn An, Bình Hiên, Hải Châu, Đà Nẵng</p>
                  <p><strong>Cơ sở 2:</strong> 3130 Hoàng Văn Thụ, Phường 9, Phú Nhuận, TP. Hồ Chí Minh</p>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="contact-item">
              <div className="contact-icon-box">
                <Clock size={22} />
              </div>
              <div className="contact-item-content">
                <h3 className="contact-item-title">Thời gian</h3>
                <div className="contact-item-text">
                  <p>Thứ 2 – Thứ 6: 8am – 6pm</p>
                  <p>Thứ 7: 8am – 12am</p>
                  <p>Chủ nhật: Nghỉ</p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="contact-item">
              <div className="contact-icon-box">
                <Mail size={22} />
              </div>
              <div className="contact-item-content">
                <h3 className="contact-item-title">Email</h3>
                <div className="contact-item-text">
                  <a href="mailto:info.chamuseum.danang.vn@gmail.com" className="contact-link">
                    info.chamuseum.danang.vn@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="contact-item">
              <div className="contact-icon-box">
                <Phone size={22} />
              </div>
              <div className="contact-item-content">
                <h3 className="contact-item-title">Điện thoại</h3>
                <div className="contact-item-text">
                  <p>
                    <a href="tel:19009004" className="contact-link">1900 9004</a>
                    {' – '}
                    <a href="tel:0974567513" className="contact-link">097 4567 513</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Google Maps */}
          <div className="contact-map-col">
            <div className="map-wrapper">
              <iframe
                title="Bản đồ phòng khám"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.1104354228965!2d108.2173167!3d16.0597816!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c6292524a1%3A0xf639890280eb4c71!2zMTUyIENodSBWxINuIEFuLCBCw6xuaCBIacOqbiwgSOG6o2kgQ2jDonUsIMSQw6AgTuG6tW5n!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
