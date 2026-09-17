import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock3 } from 'lucide-react';
import { TopBar } from '../../components/Header/TopBar';
import { Footer } from '../../components/Footer/Footer';
import { BookingStepper } from './components/BookingStepper';
import { BookingSummary } from './components/BookingSummary';
import { BookingTrustBadges } from './components/BookingTrustBadges';
import { Step1Doctor } from './steps/Step1Doctor';
import { Step2Service } from './steps/Step2Service';
import { Step3DateTime } from './steps/Step3DateTime';
import { Step4PatientInfo } from './steps/Step4PatientInfo';
import { Step5Confirm } from './steps/Step5Confirm';
import { apiBookAppointment } from '../../api/functions/appointments';
import { apiGetBookingQuote } from '../../api/functions/services';
import type { Appointment, BookingQuote, ClinicService } from '../../api/types';
import { APPOINTMENT_STATUS } from '../../api/types';
import type { BookingDoctor, BookingState, PatientInfo } from '../../types/booking';
import { formatCurrency, formatDateLabel, formatShiftRange, formatTimeLabel, todayIso } from './bookingFormat';
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
    selectedShift: null,
    selectedServices: [],
    reasonForVisit: '',
    patientInfo: EMPTY_PATIENT,
  });

  const serviceKey = state.selectedServices.map((service) => service.serviceId).join(',');
  const patientId = state.selectedPatientId;
  const quoteKey = `${serviceKey}|${patientId ?? ''}`;

  // Kết quả báo giá gắn với đúng giỏ dịch vụ đã hỏi; giỏ đổi mà chưa có kết quả mới là đang tải.
  const [quoteResult, setQuoteResult] = useState<{
    key: string;
    quote: BookingQuote | null;
    error: string | null;
  } | null>(null);

  // Báo giá lại mỗi khi giỏ dịch vụ hoặc hồ sơ bệnh nhân đổi. Chờ một nhịp ngắn để tick liên tiếp
  // nhiều dịch vụ chỉ tốn một lần gọi; hồ sơ bệnh nhân giúp bỏ qua voucher người đó đã dùng hết lượt.
  useEffect(() => {
    if (!serviceKey) {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      const lines = serviceKey.split(',').map((id) => ({ service_id: Number(id), quantity: 1 }));
      const result = await apiGetBookingQuote(lines, patientId);

      if (!cancelled) {
        setQuoteResult({
          key: quoteKey,
          quote: result.ok ? result.data : null,
          error: result.ok ? null : result.error,
        });
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [serviceKey, patientId, quoteKey]);

  const quoteLoading = Boolean(serviceKey) && quoteResult?.key !== quoteKey;
  // Giữ báo giá cũ trong lúc tải để số tiền không nhấp nháy; nút Tiếp tục vẫn khoá tới khi có số mới.
  const quote = serviceKey ? (quoteResult?.quote ?? null) : null;
  const quoteError = serviceKey && !quoteLoading ? (quoteResult?.error ?? null) : null;

  const goToStep = (step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDoctor = (doctor: BookingDoctor) => {
    setState((prev) => ({
      ...prev,

      // Đổi bác sĩ thì ca đã chọn không còn ý nghĩa: ca thuộc về lịch làm việc của đúng một người.
      selectedShift: prev.selectedDoctor?.doctorId === doctor.doctorId ? prev.selectedShift : null,
      selectedDoctor: doctor,
    }));
  };

  const handleToggleService = (service: ClinicService) => {
    setState((prev) => {
      const alreadySelected = prev.selectedServices.some((line) => line.serviceId === service.service_id);

      return {
        ...prev,
        selectedServices: alreadySelected
          ? prev.selectedServices.filter((line) => line.serviceId !== service.service_id)
          : [
              ...prev.selectedServices,
              {
                serviceId: service.service_id,
                name: service.service_name,
                price: service.price,
                durationMinutes: service.duration_minutes,
              },
            ],
        // Tổng thời gian đổi thì ca đã chọn có thể không còn đủ chỗ, nên chọn lại ca.
        selectedShift: null,
      };
    });
  };

  const handleSelectPatient = (patientId: number, info: PatientInfo) => {
    setState((prev) => ({ ...prev, selectedPatientId: patientId, patientInfo: info }));
  };

  const handleUpdatePatientInfo = (info: Partial<PatientInfo>) => {
    setState((prev) => ({ ...prev, patientInfo: { ...prev.patientInfo, ...info } }));
  };

  const handleConfirmBooking = async (captchaToken: string) => {
    if (
      state.selectedPatientId === null ||
      !state.selectedDoctor ||
      !state.selectedShift ||
      state.selectedServices.length === 0
    ) {
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
        appointment_time: state.selectedShift.startTime,
        reason_for_visit: state.reasonForVisit || undefined,
        primary_service_id: state.selectedServices[0].serviceId,
        // Không gửi mã giảm giá: server tự áp voucher tốt nhất cho giỏ dịch vụ này.
        services: state.selectedServices.map((service) => ({ service_id: service.serviceId, quantity: 1 })),
      },
      captchaToken,
    );

    setSubmitting(false);

    if (!result.ok || !result.data) {
      // 409 nghĩa là ca vừa hết chỗ giữa lúc xem và lúc bấm xác nhận; đưa họ về bước chọn ca
      // chứ không để họ bấm lại vào một ca đã đầy.
      if (result.status === 409) {
        setSubmitError(`${result.error} Vui lòng chọn một ca khác.`);
        setState((prev) => ({ ...prev, selectedShift: null }));
        goToStep(3);
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
              <Step2Service
                selectedServices={state.selectedServices}
                quote={quote}
                quoteLoading={quoteLoading}
                quoteError={quoteError}
                patientId={state.selectedPatientId}
                onToggleService={handleToggleService}
                onPrevStep={() => goToStep(1)}
                onNextStep={() => goToStep(3)}
              />
            )}

            {state.currentStep === 3 && (
              <Step3DateTime
                selectedDoctor={state.selectedDoctor}
                selectedDate={state.selectedDate}
                selectedShift={state.selectedShift}
                durationMinutes={quote?.duration_minutes ?? 0}
                onSelectDate={(date) =>
                  setState((prev) => ({ ...prev, selectedDate: date, selectedShift: null }))
                }
                onSelectShift={(shift) => setState((prev) => ({ ...prev, selectedShift: shift }))}
                onPrevStep={() => goToStep(2)}
                onNextStep={() => goToStep(4)}
                onChangeDoctor={() => goToStep(1)}
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
                selectedShift={state.selectedShift}
                selectedServices={state.selectedServices}
                quote={quote}
                patientInfo={state.patientInfo}
                reasonForVisit={state.reasonForVisit}
                submitting={submitting}
                error={submitError}
                onPrevStep={() => goToStep(4)}
                onConfirmBooking={handleConfirmBooking}
                onCaptchaError={setSubmitError}
              />
            )}
          </div>

          {/* Right: Summary sidebar */}
          <BookingSummary
            selectedDoctor={state.selectedDoctor}
            selectedDate={formatDateLabel(state.selectedDate)}
            selectedShift={
              state.selectedShift
                ? `${state.selectedShift.name} (${formatShiftRange(state.selectedShift.startTime, state.selectedShift.endTime)})`
                : ''
            }
            selectedServices={state.selectedServices}
            quote={quote}
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
                  Mức ưu đãi của lịch hẹn vượt mức phòng khám duyệt tự động, nên lịch hẹn đang chờ
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
                <strong>Ca khám:</strong>{' '}
                {state.selectedShift
                  ? formatShiftRange(state.selectedShift.startTime, state.selectedShift.endTime)
                  : formatTimeLabel(booked.appointment_time)}{' '}
                - {formatDateLabel(booked.appointment_date)}
              </div>
              <div>
                <strong>Dịch vụ:</strong> {booked.services.map((line) => line.service_name).join(', ')}
              </div>
              <div>
                <strong>Khách hàng:</strong> {booked.patient_full_name}
              </div>
              <div>
                <strong>Tổng tiền:</strong> {formatCurrency(booked.total_amount)}
                {booked.discount_percent > 0 && ` (đã giảm ${booked.discount_percent.toLocaleString('vi-VN')}%)`}
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
