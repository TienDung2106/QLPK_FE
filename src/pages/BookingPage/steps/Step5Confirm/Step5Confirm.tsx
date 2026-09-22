import React, { useEffect, useState } from 'react';
import { AlertCircle, GraduationCap, Loader2, Lock, Sparkles, TicketPercent, X } from 'lucide-react';
import type { BookingQuote } from '../../../../api/types';
import type { BookingDoctor, PatientInfo, SelectedService, SelectedShift } from '../../../../types/booking';
import { CaptchaField } from '../../../../components/Captcha/CaptchaField';
import useCaptcha from '../../../../hooks/useCaptcha';
import { CAPTCHA_PURPOSE } from '../../../../api/functions/captcha';
import { describePromotion, formatCurrency, formatDateLabel, formatShiftRange, MIN_COMBO_SERVICES } from '../../bookingFormat';
import { CLINIC_TERMS, CLINIC_TERMS_UPDATED_AT } from './clinicTerms';
import './Step5Confirm.css';
import { fallbackTo } from '../../../../utils/imageFallback';

interface Step5ConfirmProps {
  selectedDoctor: BookingDoctor | null;
  /** 'yyyy-MM-dd'. */
  selectedDate: string;
  selectedShift: SelectedShift | null;
  selectedServices: SelectedService[];
  quote: BookingQuote | null;
  patientInfo: PatientInfo;
  reasonForVisit: string;
  submitting: boolean;
  error: string | null;
  onPrevStep: () => void;
  /** Nhận sẵn token đã đổi với backend; null khi người dùng chưa qua được CAPTCHA. */
  onConfirmBooking: (captchaToken: string) => void;
  onCaptchaError: (message: string) => void;
}

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80';

const GENDER_LABEL: Record<string, string> = {
  male: 'Nam',
  female: 'Nữ',
  other: 'Khác',
};

export const Step5Confirm: React.FC<Step5ConfirmProps> = ({
  selectedDoctor,
  selectedDate,
  selectedShift,
  selectedServices,
  quote,
  patientInfo,
  reasonForVisit,
  submitting,
  error,
  onPrevStep,
  onConfirmBooking,
  onCaptchaError,
}) => {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const captcha = useCaptcha(CAPTCHA_PURPOSE.AppointmentBooking);

  useEffect(() => {
    if (!showTerms) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowTerms(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTerms]);

  const doctor = selectedDoctor;

  const subtotal = quote?.subtotal_amount ?? selectedServices.reduce((sum, service) => sum + service.price, 0);
  const promotion = quote?.promotion ?? null;
  const belowCombo = new Set(selectedServices.map((service) => service.serviceId)).size < MIN_COMBO_SERVICES;

  const handleConfirm = async () => {
    const exchanged = await captcha.exchange();

    if (!exchanged.token) {
      onCaptchaError(exchanged.error ?? 'Vui lòng hoàn tất ô kiểm tra bảo mật.');
      return;
    }

    onConfirmBooking(exchanged.token);
  };

  return (
    <div className="step5-container">
      {/* ── Main Step Heading ── */}
      <h2 className="step5-main-heading">BƯỚC 5: XÁC NHẬN &amp; THANH TOÁN</h2>

      {/* ── Sub-heading Callout Banner ── */}
      <div className="step5-callout-banner">
        <p>Vui lòng kiểm tra lại toàn bộ thông tin trước khi xác nhận đặt lịch.</p>
      </div>

      {error && (
        <div className="account-alert error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Row 1: 2 Cards (1. Thông tin lịch khám & 2. Thông tin khách hàng) ── */}
      <div className="step5-two-col-row">
        {/* Card 1: Thông tin lịch khám */}
        <div className="step5-card">
          <h3 className="step5-card-title">1. Thông tin lịch khám</h3>

          {doctor && (
            <div className="step5-doc-header">
              <img
                src={doctor.avatar ?? FALLBACK_AVATAR}
                alt={doctor.name}
                className="step5-doc-avatar"
                onError={fallbackTo(FALLBACK_AVATAR)}
              />
              <div className="step5-doc-info">
                <h4 className="step5-doc-name">{doctor.name}</h4>
                <p className="step5-doc-spec">{doctor.specialty}</p>
                {doctor.degree && (
                  <div className="step5-doc-rating">
                    <GraduationCap size={13} />
                    <span className="rating-num">{doctor.degree}</span>
                    <span className="rating-count">
                      ({doctor.experienceYears} năm kinh nghiệm)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="step5-info-table">
            <div className="step5-info-row">
              <span className="info-row-label">Ngày khám</span>
              <span className="info-row-val">{formatDateLabel(selectedDate)}</span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Ca khám</span>
              <span className="info-row-val val-blue">
                {selectedShift
                  ? `${selectedShift.name} (${formatShiftRange(selectedShift.startTime, selectedShift.endTime)})`
                  : 'Chưa chọn'}
              </span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Dịch vụ</span>
              <span className="info-row-val">{selectedServices.map((service) => service.name).join(', ')}</span>
            </div>
            {quote && (
              <div className="step5-info-row">
                <span className="info-row-label">Thời gian dự kiến</span>
                <span className="info-row-val">{quote.duration_minutes} phút</span>
              </div>
            )}
            <div className="step5-info-row">
              <span className="info-row-label">Phòng khám</span>
              <span className="info-row-val">
                Phòng khám Da liễu - 123 Đường Láng, Đống Đa, Hà Nội
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Thông tin khách hàng */}
        <div className="step5-card">
          <h3 className="step5-card-title">2. Thông tin khách hàng</h3>

          <div className="step5-info-table">
            <div className="step5-info-row">
              <span className="info-row-label">Họ và tên</span>
              <span className="info-row-val">{patientInfo.fullName}</span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Số điện thoại</span>
              <span className="info-row-val">{patientInfo.phone}</span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Ngày sinh</span>
              <span className="info-row-val">
                {patientInfo.birthDate ? formatDateLabel(patientInfo.birthDate) : 'Chưa cập nhật'}
              </span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Giới tính</span>
              <span className="info-row-val">
                {GENDER_LABEL[patientInfo.gender] ?? 'Chưa cập nhật'}
              </span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Email</span>
              <span className="info-row-val">{patientInfo.email || 'Chưa cập nhật'}</span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Địa chỉ</span>
              <span className="info-row-val">{patientInfo.address || 'Chưa cập nhật'}</span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Lý do khám</span>
              <span className="info-row-val">{reasonForVisit || 'Không có'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: 3. Chi tiết thanh toán & Mã giảm giá ── */}
      <div className="step5-card">
        <div className="step5-payment-grid">
          {/* Left Payment Breakdown */}
          <div className="step5-payment-left">
            <h3 className="step5-card-title">3. Chi tiết thanh toán</h3>

            <div className="step5-payment-rows">
              {selectedServices.map((service) => (
                <div className="step5-pay-row" key={service.serviceId}>
                  <span>{service.name}</span>
                  <span className="pay-val">{formatCurrency(service.price)}</span>
                </div>
              ))}
              <div className="step5-pay-row">
                <span>Tạm tính</span>
                <span className="pay-val">{formatCurrency(subtotal)}</span>
              </div>
              <div className="step5-pay-row">
                <span>{promotion ? `Voucher ${promotion.promotion_code}` : 'Voucher'}</span>
                <span className={promotion ? 'pay-val pay-discount' : 'discount-status'}>
                  {promotion ? `-${formatCurrency(quote?.discount_amount ?? 0)}` : 'Chưa đủ điều kiện'}
                </span>
              </div>
              <div className="step5-pay-row">
                <span>Phí giữ lịch đặt cọc</span>
                <span className="pay-val">0đ</span>
              </div>
            </div>

            <div className="step5-divider" />

            <div className="step5-total-row">
              <span className="total-label">Tổng cộng</span>
              <span className="total-val-red">{formatCurrency(quote?.total_amount ?? subtotal)}</span>
            </div>

            {/* Số tiền cuối cùng do server tính lại từ bảng giá và từ chính bản ghi khuyến
                mãi — client không được phép quyết giá (TC-SEC-05). */}
            <p className="step5-total-note">
              Số tiền được phòng khám tính lại theo bảng giá và voucher còn hiệu lực tại thời điểm đặt.
            </p>
          </div>

          {/* Voucher tự áp — không có ô nhập mã */}
          <div className="step5-payment-right">
            <span className="step5-input-label">Ưu đãi</span>

            {promotion ? (
              <div className="step5-voucher-applied">
                <TicketPercent size={22} />
                <div>
                  <strong>{describePromotion(promotion)}</strong>
                  <span>
                    Mã {promotion.promotion_code} · Tiết kiệm {formatCurrency(quote?.discount_amount ?? 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="step5-promo-msg">
                <span className="promo-info-dot">ⓘ</span>
                <span>
                  {belowCombo
                    ? `Chọn từ ${MIN_COMBO_SERVICES} dịch vụ trở lên để được giảm giá.`
                    : 'Lịch khám chưa đạt mức của voucher nào.'}
                </span>
              </div>
            )}

            {quote?.next_tier && !belowCombo && (
              <div className="step5-promo-msg">
                <Sparkles size={14} className="promo-info-dot" />
                <span>
                  Thêm {formatCurrency(quote.next_tier.amount_needed)} dịch vụ để được{' '}
                  {describePromotion(quote.next_tier).toLowerCase()}.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: 4. Xác thực bảo mật & 5. Cam kết ── */}
      <div className="step5-two-col-row">
        {/* Card 4: Xác thực bảo mật — widget Turnstile thật, backend kiểm tra phía server. */}
        <div className="step5-card">
          <h3 className="step5-card-title">4. Xác thực bảo mật</h3>

          <CaptchaField captcha={captcha} tone="plain" />
        </div>

        {/* Card 5: Cam kết */}
        <div className="step5-card">
          <h3 className="step5-card-title">5. Cam kết</h3>

          <label className="step5-agree-label">
            <input
              type="checkbox"
              className="step5-agree-checkbox"
              checked={agreedTerms}
              onChange={(event) => setAgreedTerms(event.target.checked)}
            />
            <span>
              Tôi đã đọc và đồng ý với các{' '}
              <button
                type="button"
                className="link-terms"
                onClick={(event) => {
                  // Nằm trong <label> nên phải chặn để không tự tick checkbox.
                  event.preventDefault();
                  setShowTerms(true);
                }}
              >
                điều khoản dịch vụ
              </button>{' '}
              của phòng khám.
            </span>
          </label>
        </div>
      </div>

      {/* ── Bottom Action Buttons ── */}
      <div className="step5-bottom-actions">
        <button type="button" className="btn-back-step-alt" onClick={onPrevStep} disabled={submitting}>
          Quay lại
        </button>
        <div className="step5-confirm-btn-wrapper">
          <button
            type="button"
            className="btn-confirm-booking"
            onClick={handleConfirm}
            disabled={!agreedTerms || !captcha.solved || submitting}
          >
            {submitting ? <Loader2 className="spin" size={15} /> : <Lock size={15} />}
            <span>{submitting ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}</span>
          </button>
          <span className="step5-security-text">Thông tin được bảo mật mã hóa đầu cuối</span>
        </div>
      </div>

      {showTerms && (
        <div className="booking-modal-overlay" onClick={() => setShowTerms(false)}>
          <div
            className="step5-terms-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="step5-terms-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="step5-terms-header">
              <div>
                <h3 id="step5-terms-title">Điều khoản dịch vụ</h3>
                <p>Phòng khám Da liễu · Cập nhật {CLINIC_TERMS_UPDATED_AT}</p>
              </div>
              <button
                type="button"
                className="step5-terms-close"
                aria-label="Đóng"
                onClick={() => setShowTerms(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="step5-terms-body">
              {CLINIC_TERMS.map((section, index) => (
                <section key={section.title} className="step5-terms-section">
                  <h4>
                    {index + 1}. {section.title}
                  </h4>
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div className="step5-terms-footer">
              <button type="button" className="btn-modal-secondary" onClick={() => setShowTerms(false)}>
                Đóng
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                onClick={() => {
                  setAgreedTerms(true);
                  setShowTerms(false);
                }}
              >
                Tôi đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
