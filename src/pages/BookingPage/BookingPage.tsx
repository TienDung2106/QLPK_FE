import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock3 } from 'lucide-react';
import { TopBar } from '../../components/Header/TopBar';
import { Footer } from '../../components/Footer/Footer';
import { BookingStepper } from './components/BookingStepper';
import { BookingSummary } from './components/BookingSummary';
import { BookingTrustBadges } from './components/BookingTrustBadges';
import { Step1Doctor } from './steps/Step1Doctor';
import { Step2DateTime } from './steps/Step2DateTime';
import { Step3Service } from './steps/Step3Service';
import { Step4PatientInfo } from './steps/Step4PatientInfo';
import { Step5Confirm } from './steps/Step5Confirm';
import { apiBookAppointment } from '../../api/functions/appointments';
import type { Appointment, ClinicService } from '../../api/types';
import { APPOINTMENT_STATUS } from '../../api/types';
import type { BookingDoctor, BookingState, PatientInfo } from '../../types/booking';
import { formatDateLabel, formatTimeLabel, todayIso } from './bookingFormat';
import './BookingPage.css';

interface BookingPageProps {
  onBackToHome: () => void;
}

const EMPTY_PATIENT: PatientInfo = {
  fullName: '',
  phone: '',
  email: '',
  gender: 'other',
  birthDate: '',
  address: '',
  notes: '',
};

export const BookingPage: React.FC<BookingPageProps> = ({ onBackToHome }) => {
  const navigate = useNavigate();

  const [booked, setBooked] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [state, setState] = useState<BookingState>({
    currentStep: 1,
    selectedDoctor: null,
    selectedPatientId: null,
    selectedDate: todayIso(),
    selectedTime: '',
    selectedService: '',
    selectedServiceId: null,
    servicePrice: 0,
    discountCode: '',
    reasonForVisit: '',
    patientInfo: EMPTY_PATIENT,
  });

  const goToStep = (step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDoctor = (doctor: BookingDoctor) => {
    setState((prev) => ({
      ...prev,

      // Đổi bác sĩ thì giờ đã chọn không còn ý nghĩa: slot thuộc về lịch làm việc của
      // đúng một người, và người mới gần như chắc chắn không rảnh đúng khung giờ đó.
      selectedTime: prev.selectedDoctor?.doctorId === doctor.doctorId ? prev.selectedTime : '',
      selectedDoctor: doctor,
    }));
  };

  const handleSelectService = (service: ClinicService) => {
    setState((prev) => ({
      ...prev,
      selectedService: service.service_name,
      selectedServiceId: service.service_id,
      servicePrice: service.price,
    }));
  };

  const handleSelectPatient = (patientId: number, info: PatientInfo) => {
    setState((prev) => ({ ...prev, selectedPatientId: patientId, patientInfo: info }));
  };

  const handleUpdatePatientInfo = (info: Partial<PatientInfo>) => {
    setState((prev) => ({ ...prev, patientInfo: { ...prev.patientInfo, ...info } }));
  };

  const handleConfirmBooking = async (captchaToken: string) => {
    if (state.selectedPatientId === null || !state.selectedDoctor || state.selectedServiceId === null) {
      setSubmitError('Thiếu thông tin đặt lịch. Vui lòng kiểm tra lại các bước trước.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const result = await apiBookAppointment(
      {
        patient_id: state.selectedPatientId,
        doctor_id: state.selectedDoctor.doctorId,
        appointment_date: state.selectedDate,
        appointment_time: state.selectedTime,
        reason_for_visit: state.reasonForVisit || undefined,
        primary_service_id: state.selectedServiceId,
        services: [{ service_id: state.selectedServiceId, quantity: 1 }],
        promotion_code: state.discountCode || undefined,
      },
      captchaToken,
    );

    setSubmitting(false);

    if (!result.ok || !result.data) {
      // 409 nghĩa là khung giờ vừa bị người khác lấy mất giữa lúc xem và lúc bấm xác nhận;
      // đưa họ về bước chọn giờ chứ không để họ bấm lại vào một slot đã mất.
      if (result.status === 409) {
        setSubmitError(
          `${result.error} Vui lòng chọn một khung giờ khác.`,
        );
        goToStep(2);
        return;
      }

      setSubmitError(result.error);
      return;
    }

    setBooked(result.data);
  };

  // 202 thay vì 201: mức giảm giá vượt ngưỡng nên lịch bị giữ lại chờ người duyệt
  // (UC-04 E3). Người đặt cần biết mình chưa có lịch chắc chắn.
  const awaitingApproval = booked?.status === APPOINTMENT_STATUS.PendingApproval;

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
                onSelectDate={(date) =>
                  setState((prev) => ({ ...prev, selectedDate: date, selectedTime: '' }))
                }
                onSelectTime={(time) => setState((prev) => ({ ...prev, selectedTime: time }))}
                onPrevStep={() => goToStep(1)}
                onNextStep={() => goToStep(3)}
                onChangeDoctor={() => goToStep(1)}
              />
            )}

            {state.currentStep === 3 && (
              <Step3Service
                selectedServiceId={state.selectedServiceId}
                discountCode={state.discountCode}
                onSelectService={handleSelectService}
                onApplyDiscount={(code) => setState((prev) => ({ ...prev, discountCode: code }))}
                onPrevStep={() => goToStep(2)}
                onNextStep={() => goToStep(4)}
              />
            )}

            {state.currentStep === 4 && (
              <Step4PatientInfo
                patientInfo={state.patientInfo}
                selectedPatientId={state.selectedPatientId}
                reasonForVisit={state.reasonForVisit}
                onSelectPatient={handleSelectPatient}
                onUpdatePatientInfo={handleUpdatePatientInfo}
                onChangeReason={(reason) => setState((prev) => ({ ...prev, reasonForVisit: reason }))}
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
                patientInfo={state.patientInfo}
                reasonForVisit={state.reasonForVisit}
                submitting={submitting}
                error={submitError}
                onPrevStep={() => goToStep(4)}
                onConfirmBooking={handleConfirmBooking}
                onApplyDiscount={(code) => setState((prev) => ({ ...prev, discountCode: code }))}
                onCaptchaError={setSubmitError}
              />
            )}
          </div>

          {/* Right: Summary sidebar */}
          <BookingSummary
            selectedDoctor={state.selectedDoctor}
            selectedDate={formatDateLabel(state.selectedDate)}
            selectedTime={formatTimeLabel(state.selectedTime)}
            selectedService={state.selectedService}
            servicePrice={state.servicePrice}
            discountAmount={0}
            currentStep={state.currentStep}
          />
        </div>
      </main>

      {/* 4. Trust badges strip */}
      <BookingTrustBadges currentStep={state.currentStep} />

      {/* 5. Footer */}
      <Footer />

      {/* 6. Success Modal */}
      {booked && (
        <div className="booking-modal-overlay">
          <div className="booking-success-modal" onClick={(event) => event.stopPropagation()}>
            <div className="success-icon-box">
              {awaitingApproval ? (
                <Clock3 size={56} className="text-success-green" />
              ) : (
                <CheckCircle2 size={56} className="text-success-green" />
              )}
            </div>

            <h3 className="modal-title">
              {awaitingApproval ? 'Lịch hẹn đang chờ duyệt' : 'Đặt lịch hẹn thành công!'}
            </h3>

            <p className="modal-desc">
              {awaitingApproval ? (
                <>
                  Mã giảm giá bạn nhập vượt mức phòng khám duyệt tự động, nên lịch hẹn đang chờ
                  nhân viên xác nhận. Bạn sẽ được liên hệ trong thời gian sớm nhất.
                </>
              ) : (
                <>
                  Cảm ơn bạn đã lựa chọn phòng khám. Mã nhận phòng của bạn là{' '}
                  <strong className="text-primary-code">{booked.check_in_code}</strong>. Hãy đưa mã
                  này khi tới khám để tự nhận số thứ tự.
                </>
              )}
            </p>

            <div className="modal-info-summary">
              <div>
                <strong>Bác sĩ:</strong> {booked.doctor_full_name}
              </div>
              <div>
                <strong>Thời gian:</strong> {formatTimeLabel(booked.appointment_time)} -{' '}
                {formatDateLabel(booked.appointment_date)}
              </div>
              <div>
                <strong>Khách hàng:</strong> {booked.patient_full_name}
              </div>
              <div>
                <strong>Tổng tiền:</strong> {booked.total_amount.toLocaleString('vi-VN')}đ
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-primary"
                onClick={() => navigate('/lich-hen-cua-toi')}
              >
                Xem lịch hẹn của tôi
              </button>
              <button type="button" className="btn-modal-secondary" onClick={onBackToHome}>
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
