import React from 'react';
import { Header } from '../components/Header';
import { HeroSection } from '../components/Hero/HeroSection';
import { AboutSection } from '../components/About/AboutSection';
import { FacilitiesSection } from '../components/Facilities/FacilitiesSection';
import { TestimonialsSection } from '../components/Testimonials/TestimonialsSection';
import { ServicesSection } from '../components/Services/ServicesSection';
import { DoctorsSection } from '../components/Doctors/DoctorsSection';
import { ContactSection } from '../components/Contact/ContactSection';
import { NewsSection } from '../components/News/NewsSection';
import { Footer } from '../components/Footer/Footer';
import type { DoctorItem, NewsItem } from '../types';

interface HomePageProps {
  onNavigateToBooking: () => void;
  onNavigateToClinicDetail?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToBooking,
  onNavigateToClinicDetail,
}) => {
  const handleViewServices = () => {
    const section = document.getElementById('services');
    section?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectService = (_serviceTitle: string) => {
    onNavigateToBooking();
  };

  const handleSelectDoctor = (_doctor: DoctorItem) => {
    onNavigateToBooking();
  };

  const handleReadMoreNews = (_news: NewsItem) => {
    // Navigate to blog detail
  };

  return (
    <div className="home-page-layout">
      {/* 1. Header (TopBar + Navbar) */}
      <Header onOpenBooking={onNavigateToBooking} />

      <main>
        {/* 2. Hero Section */}
        <HeroSection
          onOpenBooking={onNavigateToBooking}
          onViewServices={handleViewServices}
        />

        {/* 3. About Section (Về chúng tôi) */}
        <AboutSection />

        {/* 4. Facilities Section (Khám phá phòng khám da liễu) */}
        <FacilitiesSection onViewDetail={onNavigateToClinicDetail} />

        {/* 5. Testimonials Section (Đánh giá từ bệnh nhân) */}
        <TestimonialsSection />

        {/* 6. Services Section (Dịch vụ của chúng tôi) */}
        <ServicesSection onSelectService={handleSelectService} />

        {/* 7. Doctors Section (Đội ngũ bác sĩ) */}
        <DoctorsSection onSelectDoctor={handleSelectDoctor} />

        {/* 8. Contact Section (Liên hệ với chúng tôi) */}
        <ContactSection />

        {/* 9. News Section (Một vài tin tức y tế hot) */}
        <NewsSection onReadMore={handleReadMoreNews} />
      </main>

      {/* 10. Footer (Chân trang phong cách phòng khám) */}
      <Footer />
    </div>
  );
};
