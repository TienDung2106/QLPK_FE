import React from 'react';
import { Calendar, Clock, User, BookOpen, Lock, BarChart2, ShieldCheck, Headphones } from 'lucide-react';
import type { BookingDoctor } from '../../../../types/booking';
import './BookingSummary.css';

interface BookingSummaryProps {
  selectedDoctor: BookingDoctor | null;
  selectedDate?: string;
  selectedTime?: string;
  selectedService?: string;
  servicePrice?: number;
  discountAmount?: number;
  currentStep?: number;
}

const formatVND = (num: number) =>
  new Intl.NumberFormat('vi-VN').format(num) + 'đ';

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedDoctor,
  selectedDate = '',
  selectedTime = '',
  selectedService = '',
  servicePrice = 0,
  discountAmount = 0,
  currentStep = 1,
}) => {
  const totalPrice = Math.max(0, servicePrice - discountAmount);

  // Chưa chọn thì nói là chưa chọn. Trước đây các giá trị này rơi về một lịch hẹn mẫu
  // ('25/05/2026', '09:00', 300.000đ), nên thanh tóm tắt hiện ra một lựa chọn mà người
  // dùng chưa hề thực hiện.
  const displayDate = selectedDate || 'Chưa chọn';
  const displayTime = selectedTime || 'Chưa chọn';
  const displayService = selectedService || 'Chưa chọn';
  const displayPrice = servicePrice > 0 ? formatVND(servicePrice) : '--';
  const displayTotal = servicePrice > 0 ? formatVND(totalPrice) : '--';

  if (currentStep === 5) {
    return (
      <aside className="booking-summary-sidebar step5-summary-sidebar">
        {/* Card 1: CHI TIẾT THANH TOÁN */}
        <div className="summary-card">
          <h4 className="payment-heading">CHI TIẾT THANH TOÁN</h4>

          <div className="payment-rows">
            <div className="payment-row">
              <span>Giá dịch vụ</span>
              <span className="payment-amount">{formatVND(servicePrice)}</span>
            </div>
            <div className="payment-row">
              <span>Mã giảm giá</span>
              <span className="payment-amount">{discountAmount > 0 ? `-${formatVND(discountAmount)}` : '0đ'}</span>
            </div>
            <div className="payment-row">
              <span>Phí giữ lịch đặt cọc</span>
              <span className="payment-amount">0đ</span>
            </div>
          </div>

          <div className="summary-divider" />

          <div className="total-row">
            <span className="total-label">Tổng cộng</span>
            <span className="total-amount total-red">{formatVND(totalPrice)}</span>
          </div>
        </div>

        {/* Card 2: Security Notice */}
        <div className="summary-alert-card step5-security-alert">
          <ShieldCheck size={16} className="security-icon" />
          <p>
            Thông tin của bạn được bảo mật tuyệt đối. Chúng tôi cam kết bảo vệ và quản lý thông tin của bạn một cách tốt nhất.
          </p>
        </div>

        {/* Card 4: Support */}
        <div className="summary-support-card step4-support-card">
          <div className="step4-support-inner">
            <div className="support-bar-icon-box">
              <Headphones size={16} />
            </div>
            <div className="support-bar-text">
              <h4 className="support-title">Bạn cần hỗ trợ?</h4>
              <p className="support-desc">
                Liên hệ <a href="tel:0912345678" className="support-phone">0912 345 678</a> để được tư vấn thêm.
              </p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="booking-summary-sidebar">
      {/* ── Main Summary Card ── */}
      <div className="summary-card">
        <h3 className="summary-card-heading">THÔNG TIN LỊCH KHÁM</h3>

        {/* Doctor field */}
        {selectedDoctor ? (
          <div className="summary-doc-section">
            {currentStep < 4 && <span className="summary-doc-field-label">Bác sĩ</span>}
            <div className="summary-doc-mini-card">
              <img
                src={selectedDoctor.avatar}
                alt={selectedDoctor.name}
                className="mini-doc-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80';
                }}
              />
              <div className="mini-doc-info">
                <strong className="mini-doc-name">{selectedDoctor.name}</strong>
                <span className="mini-doc-spec">Chuyên khoa: {selectedDoctor.specialty}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="summary-row">
            <div className="summary-row-label">
              <User size={15} className="summary-icon" />
              <span>Bác sĩ</span>
            </div>
            <div className="summary-row-value">Chưa chọn</div>
          </div>
        )}

        {/* Date, Time, Service rows */}
        <div className="summary-details-list">
          <div className="summary-row">
            <div className="summary-row-label">
              <Calendar size={15} className="summary-icon" />
              <span>Ngày khám</span>
            </div>
            <div className={`summary-row-value ${currentStep >= 2 ? 'value-bold' : ''}`}>
              {displayDate}
            </div>
          </div>

          <div className="summary-row">
            <div className="summary-row-label">
              <Clock size={15} className="summary-icon" />
              <span>Giờ khám</span>
            </div>
            <div className={`summary-row-value ${currentStep >= 2 ? 'value-bold' : ''}`}>
              {displayTime}
            </div>
          </div>

          <div className="summary-row">
            <div className="summary-row-label">
              <BookOpen size={15} className="summary-icon" />
              <span>Dịch vụ</span>
            </div>
            <div className={`summary-row-value ${currentStep >= 3 ? 'value-bold' : ''}`}>
              {displayService}
            </div>
          </div>
        </div>

        <div className="summary-divider" />

        {/* Payment Breakdown */}
        <h4 className="payment-heading">CHI TIẾT THANH TOÁN</h4>

        <div className="payment-rows">
          <div className="payment-row">
            <span>Giá dịch vụ</span>
            <span className="payment-amount">{displayPrice}</span>
          </div>
          <div className="payment-row">
            <span>Mã giảm giá</span>
            <span className="discount-tag">
              {discountAmount > 0 ? `-${formatVND(discountAmount)}` : 'Chưa áp dụng'}
            </span>
          </div>
        </div>

        <div className="summary-divider" />

        <div className="total-row">
          <span className="total-label">Tổng cộng</span>
          <span className={`total-amount ${currentStep >= 4 ? 'total-red' : ''}`}>
            {displayTotal}
          </span>
        </div>
      </div>

      {/* ── Notice Alert Card (Steps 1 to 3) ── */}
      {currentStep < 4 && (
        <div className="summary-alert-card">
          {currentStep >= 2 ? (
            <div className="alert-content-with-icon">
              <Lock size={15} className="alert-lock-icon" />
              <p>Thông tin thanh toán sẽ được cập nhật ở bước chọn dịch vụ.</p>
            </div>
          ) : (
            <p>Lịch đặt của bạn sẽ được xác nhận lịch hẹn sau khi hoàn thành tất cả các bước.</p>
          )}
        </div>
      )}

      {/* ── Support Card ── */}
      <div className={`summary-support-card ${currentStep === 4 ? 'step4-support-card' : ''}`}>
        {currentStep === 4 ? (
          <div className="step4-support-inner">
            <div className="support-bar-icon-box">
              <BarChart2 size={16} />
            </div>
            <div className="support-bar-text">
              <h4 className="support-title">Bạn cần hỗ trợ?</h4>
              <p className="support-desc">
                Liên hệ <a href="tel:0912345678" className="support-phone">0912 345 678</a> để được hỗ trợ đặt lịch nhanh nhất.
              </p>
            </div>
          </div>
        ) : (
          <>
            <h4 className="support-title">Bạn cần hỗ trợ?</h4>
            <p className="support-desc">
              Liên hệ hotline <a href="tel:0912345678" className="support-phone">0912 345 678</a> để được tư vấn và đặt lịch trực tiếp.
            </p>
          </>
        )}
      </div>
    </aside>
  );
};
