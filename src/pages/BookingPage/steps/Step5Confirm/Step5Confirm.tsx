import React, { useState } from 'react';
import { Lock, Star, Check } from 'lucide-react';
import type { BookingDoctor, PatientInfo } from '../../../../types/booking';
import './Step5Confirm.css';

interface Step5ConfirmProps {
  selectedDoctor: BookingDoctor | null;
  selectedDate: string;
  selectedTime: string;
  selectedService: string;
  servicePrice: number;
  discountCode?: string;
  discountAmount?: number;
  patientInfo?: PatientInfo;
  onPrevStep: () => void;
  onConfirmBooking: () => void;
  onApplyDiscount?: (code: string) => void;
}

const formatVND = (num: number) =>
  new Intl.NumberFormat('vi-VN').format(num) + 'đ';

export const Step5Confirm: React.FC<Step5ConfirmProps> = ({
  selectedDoctor,
  selectedDate = '25/05/2026 (Thứ 2)',
  selectedTime = '09:00',
  selectedService = 'Khám da liễu cơ bản',
  servicePrice = 300000,
  discountCode = '',
  discountAmount = 0,
  patientInfo,
  onPrevStep,
  onConfirmBooking,
  onApplyDiscount,
}) => {
  const [promoInput, setPromoInput] = useState(discountCode);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  const doctor = selectedDoctor ?? {
    id: 'doc-1',
    name: 'BS. Nguyễn Văn A',
    specialty: 'Da liễu tổng quát',
    rating: 4.9,
    reviewCount: 128,
    experienceYears: 8,
    avatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
  };

  const patient = {
    fullName: patientInfo?.fullName || 'Nguyễn Thị Hoa',
    phone: patientInfo?.phone || '0912 345 678',
    birthDate: patientInfo?.birthDate || '25/08/1995',
    gender: patientInfo?.gender === 'female' ? 'Nữ' : 'Nam',
    email: patientInfo?.email || 'hoa.nguyen95@gmail.com',
    address: patientInfo?.address || '45 Nguyễn Chí Thanh, Đống Đa, Hà Nội',
    notes: patientInfo?.notes || 'Dị ứng thuốc penicillin, da nhạy cảm',
  };

  const totalPrice = Math.max(0, servicePrice - discountAmount);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoInput.trim()) {
      onApplyDiscount?.(promoInput);
    }
  };

  return (
    <div className="step5-container">
      {/* ── Main Step Heading ── */}
      <h2 className="step5-main-heading">BƯỚC 5: XÁC NHẬN & THANH TOÁN</h2>

      {/* ── Sub-heading Callout Banner ── */}
      <div className="step5-callout-banner">
        <p>Vui lòng kiểm tra lại toàn bộ thông tin trước khi xác nhận đặt lịch.</p>
      </div>

      {/* ── Row 1: 2 Cards (1. Thông tin lịch khám & 2. Thông tin khách hàng) ── */}
      <div className="step5-two-col-row">
        {/* Card 1: Thông tin lịch khám */}
        <div className="step5-card">
          <h3 className="step5-card-title">1. Thông tin lịch khám</h3>

          <div className="step5-doc-header">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="step5-doc-avatar"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80';
              }}
            />
            <div className="step5-doc-info">
              <h4 className="step5-doc-name">{doctor.name}</h4>
              <p className="step5-doc-spec">{doctor.specialty}</p>
              <div className="step5-doc-rating">
                <Star size={13} className="star-gold" fill="#f59e0b" />
                <span className="rating-num">{doctor.rating ?? 4.9}</span>
                <span className="rating-count">({doctor.reviewCount ?? 128} đánh giá)</span>
              </div>
            </div>
          </div>

          <div className="step5-info-table">
            <div className="step5-info-row">
              <span className="info-row-label">Ngày khám</span>
              <span className="info-row-val">{selectedDate}</span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Giờ khám</span>
              <span className="info-row-val val-blue">{selectedTime}</span>
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
              <span className="info-row-val">{patient.fullName}</span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Số điện thoại</span>
              <span className="info-row-val">{patient.phone}</span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Ngày sinh</span>
              <span className="info-row-val">{patient.birthDate}</span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Giới tính</span>
              <span className="info-row-val">{patient.gender}</span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Email</span>
              <span className="info-row-val">{patient.email}</span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Địa chỉ</span>
              <span className="info-row-val">{patient.address}</span>
            </div>
            <div className="step5-info-row">
              <span className="info-row-label">Ghi chú</span>
              <span className="info-row-val">{patient.notes}</span>
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
                <span className="pay-val">{formatVND(servicePrice)}</span>
              </div>
              <div className="step5-pay-row">
                <span>Mã giảm giá</span>
                <span className="discount-status">
                  {discountAmount > 0 ? `-${formatVND(discountAmount)}` : 'Chưa áp dụng'}
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
              <span className="total-val-red">{formatVND(totalPrice)}</span>
            </div>
          </div>

          {/* Right Promo Code Form */}
          <div className="step5-payment-right">
            <label className="step5-input-label">Mã giảm giá</label>
            <form className="step5-promo-form" onSubmit={handleApply}>
              <input
                type="text"
                className="step5-promo-input"
                placeholder="Nhập mã giảm giá (nếu có)"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
              />
              <button type="submit" className="step5-btn-apply">
                Áp dụng
              </button>
            </form>

            <div className="step5-promo-msg">
              <span className="promo-info-dot">ⓘ</span>
              <span>
                {discountAmount > 0
                  ? `Đã áp dụng giảm ${formatVND(discountAmount)}`
                  : 'Bạn chưa áp dụng mã giảm giá.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: 4. Xác thực bảo mật & 5. Cam kết ── */}
      <div className="step5-two-col-row">
        {/* Card 4: Xác thực bảo mật */}
        <div className="step5-card">
          <h3 className="step5-card-title">4. Xác thực bảo mật</h3>

          <div className="step5-recaptcha-box" onClick={() => setCaptchaChecked(!captchaChecked)}>
            <div className="recaptcha-left">
              <div className={`recaptcha-checkbox ${captchaChecked ? 'checked' : ''}`}>
                {captchaChecked && <Check size={14} strokeWidth={3} className="check-svg" />}
              </div>
              <span className="recaptcha-text">I'm not a robot</span>
            </div>
            <div className="recaptcha-right">
              <div className="recaptcha-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
                    stroke="#4285f4"
                    strokeWidth="2"
                  />
                  <path d="M12 6V12L16 14" stroke="#4285f4" strokeWidth="2" />
                </svg>
              </div>
              <span className="recaptcha-terms">reCAPTCHA</span>
              <span className="recaptcha-links">Privacy - Terms</span>
            </div>
          </div>
        </div>

        {/* Card 5: Cam kết */}
        <div className="step5-card">
          <h3 className="step5-card-title">5. Cam kết</h3>

          <label className="step5-agree-label">
            <input
              type="checkbox"
              className="step5-agree-checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
            />
            <span>
              Tôi đã đọc và đồng ý với các{' '}
              <a href="#terms" className="link-terms" onClick={(e) => e.preventDefault()}>
                điều khoản dịch vụ
              </a>{' '}
              của phòng khám.
            </span>
          </label>
        </div>
      </div>

      {/* ── Bottom Action Buttons ── */}
      <div className="step5-bottom-actions">
        <button type="button" className="btn-back-step-alt" onClick={onPrevStep}>
          Quay lại
        </button>
        <div className="step5-confirm-btn-wrapper">
          <button
            type="button"
            className="btn-confirm-booking"
            onClick={onConfirmBooking}
            disabled={!agreedTerms}
          >
            <Lock size={15} />
            <span>Xác nhận đặt lịch</span>
          </button>
          <span className="step5-security-text">Thông tin được bảo mật mã hóa đầu cuối</span>
        </div>
      </div>
    </div>
  );
};
