import React, { useState } from 'react';
import type { TestimonialItem } from '../../types';

const defaultTestimonials: TestimonialItem[] = [
  {
    id: '1',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    quote:
      'Dịch vụ rất chuyên nghiệp, bác sĩ tận tâm. Tôi rất hài lòng với quá trình điều trị tại đây',
    author: 'Chị Nguyễn Thị A',
  },
  {
    id: '2',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    quote:
      'Liệu trình điều trị mụn rất hiệu quả, da mình cải thiện rõ rệt chỉ sau 3 tuần. Bác sĩ tư vấn rất kỹ.',
    author: 'Chị Lê Thị B',
  },
  {
    id: '3',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    quote:
      'Không gian phòng khám sạch sẽ, thiết bị soi da hiện đại bậc nhất. Rất đáng tin cậy!',
    author: 'Anh Trần Minh C',
  },
];

export const TestimonialsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTestimonial = defaultTestimonials[currentIndex];

  return (
    <section id="testimonials" className="testimonials-section">
      <div className="container testimonials-container">
        {/* Section Heading */}
        <div className="section-header-centered">
          <h2 className="section-main-title">Đánh giá từ bệnh nhân</h2>
        </div>

        {/* Main Testimonial Card */}
        <div className="testimonial-card-wrapper">
          <div className="testimonial-card">
            <div className="testimonial-avatar-wrapper">
              <img
                src={currentTestimonial.avatar}
                alt={currentTestimonial.author}
                className="testimonial-avatar"
              />
            </div>

            <blockquote className="testimonial-quote">
              &ldquo;{currentTestimonial.quote}&rdquo;
            </blockquote>

            <div className="testimonial-author">
              {currentTestimonial.author}
            </div>

            {/* Pagination Dots */}
            {defaultTestimonials.length > 1 && (
              <div className="testimonial-dots">
                {defaultTestimonials.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`dot-btn ${idx === currentIndex ? 'active' : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Xem đánh giá ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
