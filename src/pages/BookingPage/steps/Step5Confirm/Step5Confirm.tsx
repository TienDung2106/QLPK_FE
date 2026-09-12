import React, { useState } from 'react';
import { AlertCircle, GraduationCap, Loader2, Lock } from 'lucide-react';
import type { BookingDoctor, PatientInfo } from '../../../../types/booking';
import { CaptchaField } from '../../../../components/Captcha/CaptchaField';
import useCaptcha from '../../../../hooks/useCaptcha';
import { CAPTCHA_PURPOSE } from '../../../../api/functions/captcha';
import { formatCurrency, formatDateLabel, formatTimeLabel } from '../../bookingFormat';
import './Step5Confirm.css';

interface Step5ConfirmProps {
  selectedDoctor: BookingDoctor | null;
  /** 'yyyy-MM-dd'. */
  selectedDate: string;
  /** 'HH:mm:ss'. */
  selectedTime: string;
  selectedService: string;
  servicePrice: number;
  discountCode: string;
  patientInfo: PatientInfo;
  reasonForVisit: string;
  submitting: boolean;
  error: string | null;
  onPrevStep: () => void;
  /** Nhận sẵn token đã đổi với backend; null khi người dùng chưa qua được CAPTCHA. */
  onConfirmBooking: (captchaToken: string) => void;
  onApplyDiscount: (code: string) => void;
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
  selectedTime,
  selectedService,
  servicePrice,
  discountCode,
  patientInfo,
  reasonForVisit,
  submitting,
  error,
  onPrevStep,
  onConfirmBooking,
  onApplyDiscount,
  onCaptchaError,
}) => {
  const [promoInput, setPromoInput] = useState(discountCode);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const captcha = useCaptcha(CAPTCHA_PURPOSE.AppointmentBooking);

  const doctor = selectedDoctor;

  const handleApply = (event: React.FormEvent) => {
    event.preventDefault();
    onApplyDiscount(promoInput.trim());
  };

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
                onError={(event) => {
                  (event.target as HTMLImageElement).src = FALLBACK_AVATAR;
                }}
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
              <span className="info-row-label">Giờ khám</span>
              <span className="info-row-val val-blue">{formatTimeLabel(selectedTime)}</span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Dịch vụ</span>
              <span className="info-row-val">{selectedService}</span>
            </div>
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
              <div className="step5-pay-row">
                <span>Giá dịch vụ</span>
                <span className="pay-val">{formatCurrency(servicePrice)}</span>
              </div>
              <div className="step5-pay-row">
                <span>Mã giảm giá</span>
                <span className="discount-status">
                  {discountCode ? `${discountCode} — chờ xác nhận` : 'Chưa áp dụng'}
                </span>
              </div>
              <div className="step5-pay-row">
                <span>Phí giữ lịch đặt cọc</span>
                <span className="pay-val">0đ</span>
              </div>
            </div>

            <div className="step5-divider" />

            <div className="step5-total-row">
              <span className="total-label">Tạm tính</span>
              <span className="total-val-red">{formatCurrency(servicePrice)}</span>
            </div>

            {/* Số tiền cuối cùng do server tính lại từ bảng giá và từ chính bản ghi khuyến
                mãi — client không được phép quyết giá (TC-SEC-05). */}
            <p className="step5-total-note">
              Số tiền chính thức được phòng khám chốt lại khi xác nhận lịch hẹn.
            </p>
          </div>

          {/* Right Promo Code Form */}
          <div className="step5-payment-right">
            <label className="step5-input-label" htmlFor="step5-promo">
              Mã giảm giá
            </label>
            <form className="step5-promo-form" onSubmit={handleApply}>
              <input
                id="step5-promo"
                type="text"
                className="step5-promo-input"
                placeholder="Nhập mã giảm giá (nếu có)"
                value={promoInput}
                onChange={(event) => setPromoInput(event.target.value)}
              />
              <button type="submit" className="step5-btn-apply">
                Áp dụng
              </button>
            </form>

            <div className="step5-promo-msg">
              <span className="promo-info-dot">ⓘ</span>
              <span>
                {discountCode
                  ? `Đã nhập mã ${discountCode}. Mức giảm do phòng khám xác định.`
                  : 'Bạn chưa áp dụng mã giảm giá.'}
              </span>
            </div>
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
              <a href="#terms" className="link-terms" onClick={(event) => event.preventDefault()}>
                điều khoản dịch vụ
              </a>{' '}
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
    </div>
  );
};
