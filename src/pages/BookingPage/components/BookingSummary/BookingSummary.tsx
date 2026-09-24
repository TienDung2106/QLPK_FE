import React from 'react';
import { Calendar, Clock, User, BookOpen, Lock, BarChart2, ShieldCheck, Headphones, Sparkles } from 'lucide-react';
import type { BookingQuote } from '../../../../api/types';
import type { BookingDoctor, SelectedService } from '../../../../types/booking';
import { describePromotion, formatCurrency as formatVND } from '../../bookingFormat';
import './BookingSummary.css';
import { fallbackTo } from '../../../../utils/imageFallback';

interface BookingSummaryProps {
  selectedDoctor: BookingDoctor | null;
  selectedDate?: string;
  /** Nhãn ca đã định dạng, vd "Ca sáng 1 (07:30–09:30)". */
  selectedShift?: string;
  selectedServices?: SelectedService[];
  quote?: BookingQuote | null;
  currentStep?: number;
  /** Chỗ các bước 2–4 đặt nút Quay lại / Tiếp tục, ngay dưới ô hỗ trợ. */
  actionsRef?: (element: HTMLDivElement | null) => void;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedDoctor,
  selectedDate = '',
  selectedShift = '',
  selectedServices = [],
  quote = null,
  currentStep = 1,
  actionsRef,
}) => {
  const localSubtotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const subtotal = quote?.subtotal_amount ?? localSubtotal;
  const discountAmount = quote?.discount_amount ?? 0;
  const totalPrice = quote?.total_amount ?? Math.max(0, subtotal - discountAmount);
  const promotion = quote?.promotion ?? null;

  // Chưa chọn thì nói là chưa chọn. Trước đây các giá trị này rơi về một lịch hẹn mẫu
  // ('25/05/2026', '09:00', 300.000đ), nên thanh tóm tắt hiện ra một lựa chọn mà người
  // dùng chưa hề thực hiện.
  const displayDate = selectedDate || 'Chưa chọn';
  const displayShift = selectedShift || 'Chưa chọn';
  const displayPrice = subtotal > 0 ? formatVND(subtotal) : '--';
  const displayTotal = subtotal > 0 ? formatVND(totalPrice) : '--';

  const discountLabel = promotion ? `Voucher ${promotion.promotion_code}` : 'Voucher';

  if (currentStep === 5) {
    return (
      <aside className="booking-summary-sidebar step5-summary-sidebar">
        {/* Card 1: CHI TIẾT THANH TOÁN */}
        <div className="summary-card">
          <h4 className="payment-heading">CHI TIẾT THANH TOÁN</h4>

          <div className="payment-rows">
            {selectedServices.map((service) => (
              <div className="payment-row" key={service.serviceId}>
                <span>{service.name}</span>
                <span className="payment-amount">{service.price === 0 ? 'Miễn phí' : formatVND(service.price)}</span>
              </div>
            ))}
            <div className="payment-row">
              <span>{discountLabel}</span>
              <span className="payment-amount discount-amount">
                {discountAmount > 0 ? `-${formatVND(discountAmount)}` : '0đ'}
              </span>
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
                onError={fallbackTo('https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80')}
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
          <div className="summary-row summary-row-services">
            <div className="summary-row-label">
              <BookOpen size={15} className="summary-icon" />
              <span>Dịch vụ</span>
            </div>
            <div className={`summary-row-value ${currentStep >= 2 ? 'value-bold' : ''}`}>
              {selectedServices.length === 0 ? (
                'Chưa chọn'
              ) : (
                <ul className="summary-service-list">
                  {selectedServices.map((service) => (
                    <li key={service.serviceId}>{service.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="summary-row">
            <div className="summary-row-label">
              <Calendar size={15} className="summary-icon" />
              <span>Ngày khám</span>
            </div>
            <div className={`summary-row-value ${currentStep >= 3 ? 'value-bold' : ''}`}>
              {displayDate}
            </div>
          </div>

          <div className="summary-row">
            <div className="summary-row-label">
              <Clock size={15} className="summary-icon" />
              <span>Ca khám</span>
            </div>
            <div className={`summary-row-value ${currentStep >= 3 ? 'value-bold' : ''}`}>
              {displayShift}
            </div>
          </div>

          {quote && (
            <div className="summary-row">
              <div className="summary-row-label">
                <Clock size={15} className="summary-icon" />
                <span>Thời gian dự kiến</span>
              </div>
              <div className="summary-row-value">{quote.duration_minutes} phút</div>
            </div>
          )}
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
            <span>{discountLabel}</span>
            <span className="discount-tag">
              {discountAmount > 0
                ? `-${formatVND(discountAmount)}`
                : subtotal > 0 ? 'Chưa đủ điều kiện' : '--'}
            </span>
          </div>
          {promotion && (
            <p className="summary-voucher-note">
              <Sparkles size={12} /> {describePromotion(promotion)} — tự động áp dụng
            </p>
          )}
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
              <p>Voucher giảm nhiều nhất được tự động áp dụng theo tổng tiền dịch vụ, mỗi lịch một voucher.</p>
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

      <div ref={actionsRef} className="summary-step-actions" />
    </aside>
  );
};
