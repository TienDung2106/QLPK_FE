import { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { BookingPage } from './pages/BookingPage/BookingPage';
import { ClinicDetailPage } from './pages/ClinicDetailPage/ClinicDetailPage';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'booking' | 'clinic-detail'>('home');

  const handleNavigateToBooking = () => {
    setCurrentPage('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToClinicDetail = () => {
    setCurrentPage('clinic-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {currentPage === 'home' && (
        <HomePage
          onNavigateToBooking={handleNavigateToBooking}
          onNavigateToClinicDetail={handleNavigateToClinicDetail}
        />
      )}
      {currentPage === 'booking' && (
        <BookingPage onBackToHome={handleBackToHome} />
      )}
      {currentPage === 'clinic-detail' && (
        <ClinicDetailPage
          onBackToHome={handleBackToHome}
          onOpenBooking={handleNavigateToBooking}
        />
      )}
    </div>
  );
}

export default App;