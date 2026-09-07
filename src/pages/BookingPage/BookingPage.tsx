import React, { useState } from 'react';
import { TopBar } from '../../components/Header/TopBar';
import { Footer } from '../../components/Footer/Footer';
import { BookingStepper } from './components/BookingStepper';
import { BookingSummary } from './components/BookingSummary';
import { BookingTrustBadges } from './components/BookingTrustBadges';
import { Step1Doctor, ALL_DOCTORS } from './steps/Step1Doctor';
import { Step2DateTime } from './steps/Step2DateTime';
import { Step3Service } from './steps/Step3Service';
import { Step4PatientInfo } from './steps/Step4PatientInfo';
import { Step5Confirm } from './steps/Step5Confirm';
import type { ServiceOption } from './steps/Step3Service';
import type { BookingDoctor, BookingState, PatientInfo } from '../../types/booking';
import { CheckCircle2 } from 'lucide-react';
import './BookingPage.css';

interface BookingPageProps {
  onBackToHome: () => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({ onBackToHome }) => {
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [state, setState] = useState<BookingState>({
    currentStep: 1,
    selectedDoctor: ALL_DOCTORS[0],
    selectedDate: '25/05/2026 (Thứ 2)',
    selectedTime: '09:00',
    selectedService: 'Khám da liễu cơ bản',
    servicePrice: 300000,
    discountCode: '',
    discountAmount: 0,
    patientInfo: {
      fullName: 'Nguyễn Thị Hoa',
      phone: '0912 345 678',
      email: 'hoa.nguyen95@gmail.com',
      gender: 'female',
      birthDate: '25/08/1995',
      address: '45 Nguyễn Chí Thanh, Đống Đa, Hà Nội',
      notes: 'Dị ứng thuốc penicillin, da nhạy cảm',
    },
  });

  const goToStep = (step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDoctor = (doctor: BookingDoctor) => {
    setState((prev) => ({
      ...prev,
      selectedDoctor: doctor,
      servicePrice: doctor.price ?? 300000,
    }));
  };

  const handleSelectService = (service: ServiceOption) => {
    setState((prev) => ({
      ...prev,
      selectedService: service.title,
      servicePrice: service.price,
    }));
  };

  const handleApplyDiscount = (code: string) => {
    // Simple demo: code "GIAM50K" = giảm 50,000đ
    const amount = code.toUpperCase() === 'GIAM50K' ? 50000 : 0;
    setState((prev) => ({ ...prev, discountCode: code, discountAmount: amount }));
  };

  const handleUpdatePatientInfo = (info: Partial<PatientInfo>) => {
    setState((prev) => ({
      ...prev,
      patientInfo: { ...prev.patientInfo, ...info },
    }));
  };

  const handleConfirmBooking = () => {
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="booking-page-root">
      {/* 1. TopBar (always visible, Navbar hidden in booking flow) */}
      <TopBar />

      {/* 2. Step wizard bar */}
      <BookingStepper
        currentStep={state.currentStep}
        onStepClick={goToStep}
        onBackToHome={onBackToHome}
      />

      {/* 3. Main content */}
      <main className="booking-main-body">
        <div className="container booking-content-grid">
          {/* Left: Active step */}
          <div className="booking-step-col">
            {state.currentStep === 1 && (
              <Step1Doctor
                selectedDoctor={state.selectedDoctor}
                onSelectDoctor={handleSelectDoctor}
                onNextStep={() => goToStep(2)}
              />
            )}

            {state.currentStep === 2 && (
              <Step2DateTime
                selectedDoctor={state.selectedDoctor}
                selectedDate={state.selectedDate}
                selectedTime={state.selectedTime}
                onSelectDate={(date) => setState((prev) => ({ ...prev, selectedDate: date }))}
                onSelectTime={(time) => setState((prev) => ({ ...prev, selectedTime: time }))}
                onPrevStep={() => goToStep(1)}
                onNextStep={() => goToStep(3)}
                onChangeDoctor={() => goToStep(1)}
              />
            )}

            {state.currentStep === 3 && (
              <Step3Service
                selectedDoctor={state.selectedDoctor}
                selectedService={state.selectedService}
                servicePrice={state.servicePrice}
                discountCode={state.discountCode}
                discountAmount={state.discountAmount ?? 0}
                onSelectService={handleSelectService}
                onApplyDiscount={handleApplyDiscount}
                onPrevStep={() => goToStep(2)}
                onNextStep={() => goToStep(4)}
              />
            )}

            {state.currentStep === 4 && (
              <Step4PatientInfo
                patientInfo={state.patientInfo}
                onUpdatePatientInfo={handleUpdatePatientInfo}
                onPrevStep={() => goToStep(3)}
                onNextStep={() => goToStep(5)}
              />
            )}

            {state.currentStep === 5 && (
              <Step5Confirm
                selectedDoctor={state.selectedDoctor}
                selectedDate={state.selectedDate}
                selectedTime={state.selectedTime}
                selectedService={state.selectedService}
                servicePrice={state.servicePrice}
                discountCode={state.discountCode}
                discountAmount={state.discountAmount ?? 0}
                patientInfo={state.patientInfo}
                onPrevStep={() => goToStep(4)}
                onConfirmBooking={handleConfirmBooking}
                onApplyDiscount={handleApplyDiscount}
              />
            )}
          </div>

          {/* Right: Summary sidebar */}
          <BookingSummary
            selectedDoctor={state.selectedDoctor}
            selectedDate={state.selectedDate}
            selectedTime={state.selectedTime}
            selectedService={state.selectedService}
            servicePrice={state.servicePrice}
            discountAmount={state.discountAmount ?? 0}
            currentStep={state.currentStep}
            onEditStep={goToStep}
          />
        </div>
      </main>

      {/* 4. Trust badges strip */}
      <BookingTrustBadges currentStep={state.currentStep} />

      {/* 5. Footer */}
      <Footer />

      {/* 6. Success Modal */}
      {isSuccessModalOpen && (
        <div className="booking-modal-overlay" onClick={() => setIsSuccessModalOpen(false)}>
          <div className="booking-success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon-box">
              <CheckCircle2 size={56} className="text-success-green" />
            </div>
            <h3 className="modal-title">Đặt lịch hẹn thành công!</h3>
            <p className="modal-desc">
              Cảm ơn bạn đã lựa chọn phòng khám. Mã phiếu hẹn của bạn là{' '}
              <strong className="text-primary-code">#PK-{Math.floor(100000 + Math.random() * 900000)}</strong>.
              Nhân viên tư vấn sẽ liên hệ xác nhận trong thời gian sớm nhất.
            </p>
            <div className="modal-info-summary">
              <div><strong>Bác sĩ:</strong> {state.selectedDoctor?.name}</div>
              <div><strong>Thời gian:</strong> {state.selectedTime} - {state.selectedDate}</div>
              <div><strong>Khách hàng:</strong> {state.patientInfo?.fullName} ({state.patientInfo?.phone})</div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-primary"
                onClick={onBackToHome}
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
