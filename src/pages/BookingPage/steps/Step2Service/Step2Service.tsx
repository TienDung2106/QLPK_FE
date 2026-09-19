import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Info,
  Loader2,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { apiGetServices } from '../../../../api/functions/services';
import type { BookingQuote, ClinicService } from '../../../../api/types';
import type { SelectedService } from '../../../../types/booking';
import { VoucherStrip } from '../../components/VoucherStrip';
import { describePromotion, formatCurrency } from '../../bookingFormat';
import './Step2Service.css';

/**
 * Độ dài một ca chuẩn của phòng khám. Lượt khám dài hơn thế không lọt vào ca nào, nên chặn ngay ở
 * đây thay vì để bệnh nhân sang bước chọn ca rồi mới thấy mọi ca đều báo không đủ thời gian.
 */
export const MAX_VISIT_MINUTES = 120;

interface Step2ServiceProps {
  selectedServices: SelectedService[];
  quote: BookingQuote | null;
  quoteLoading: boolean;
  quoteError: string | null;
  patientId: number | null;
  onToggleService: (service: ClinicService) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
}

export const Step2Service: React.FC<Step2ServiceProps> = ({
  selectedServices,
  quote,
  quoteLoading,
  quoteError,
  patientId,
  onToggleService,
  onPrevStep,
  onNextStep,
}) => {
  const [services, setServices] = useState<ClinicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await apiGetServices();

      if (cancelled) {
        return;
      }

      if (!result.ok || !result.data) {
        setError(result.error);
        setServices([]);
      } else {
        setServices(result.data.items);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedIds = new Set(selectedServices.map((service) => service.serviceId));
  const localSubtotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const subtotal = quote?.subtotal_amount ?? localSubtotal;
  const durationMinutes = quote?.duration_minutes ?? 0;
  const tooLong = durationMinutes > MAX_VISIT_MINUTES;
  const bufferMinutes = quote ? quote.duration_minutes - quote.service_minutes : 0;

  return (
    <div className="step3-container">
      <h2 className="step3-main-heading">BƯỚC 2: CHỌN DỊCH VỤ</h2>

      <div className="step3-callout">
        <Info size={16} className="callout-icon" />
        <span>
          Bạn có thể chọn nhiều dịch vụ cho cùng một buổi khám, mỗi dịch vụ một lần. Tổng thời gian sẽ quyết định ca
          khám còn phù hợp ở bước sau.
        </span>
      </div>

      <VoucherStrip
        subtotal={subtotal}
        appliedPromotionId={quote?.promotion?.promotion_id ?? null}
        patientId={patientId}
      />

      <section className="step3-services-section">
        <h3 className="step3-section-title">Dịch vụ phòng khám</h3>

        {error && (
          <div className="account-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="full-page-loader">
            <Loader2 className="full-page-loader-icon" size={28} />
            <span>Đang tải danh mục dịch vụ...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="no-doctors-msg">
            Phòng khám chưa công bố bảng dịch vụ. Vui lòng liên hệ hotline để được tư vấn.
          </div>
        ) : (
          <div className="services-grid">
            {services.map((service) => {
              const isSel = selectedIds.has(service.service_id);

              return (
                <div
                  key={service.service_id}
                  role="checkbox"
                  tabIndex={0}
                  aria-checked={isSel}
                  className={`service-card ${isSel ? 'is-selected' : ''}`}
                  onClick={() => onToggleService(service)}
                  onKeyDown={(event) => {
                    if (event.key === ' ' || event.key === 'Enter') {
                      event.preventDefault();
                      onToggleService(service);
                    }
                  }}
                >
                  <div className="card-top">
                    <div className="card-left">
                      <span className={`service-checkbox ${isSel ? 'checked' : ''}`} aria-hidden="true">
                        {isSel && <Check size={12} strokeWidth={3} />}
                      </span>
                      <h4 className="service-name">{service.service_name}</h4>
                      {service.service_group && (
                        <span className="service-badge">{service.service_group}</span>
                      )}
                    </div>
                    <div className="service-icon-box">
                      <Stethoscope size={20} />
                    </div>
                  </div>

                  {service.description && <p className="service-desc">{service.description}</p>}

                  <div className="card-bottom">
                    <div className="service-duration">
                      <Clock size={13} />
                      <span>{service.duration_minutes} phút</span>
                    </div>
                    <span className="service-price">{formatCurrency(service.price)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedServices.length > 0 && (
        <section className="service-basket" aria-live="polite">
          <div className="basket-row">
            <span className="basket-label">
              Đã chọn <strong>{selectedServices.length}</strong> dịch vụ
            </span>
            <span className="basket-value">{formatCurrency(subtotal)}</span>
          </div>

          {quote && (
            <div className="basket-row basket-muted">
              <span className="basket-label">
                <Clock size={13} /> Thời gian khám dự kiến
              </span>
              <span className="basket-value">
                {quote.duration_minutes} phút
                {bufferMinutes > 0 && (
                  <small> (gồm {bufferMinutes} phút kê đơn, dặn dò)</small>
                )}
              </span>
            </div>
          )}

          {quote?.promotion ? (
            <div className="basket-row basket-discount">
              <span className="basket-label">
                <Sparkles size={13} /> Tự áp {quote.promotion.promotion_code} ·{' '}
                {describePromotion(quote.promotion)}
              </span>
              <span className="basket-value">-{formatCurrency(quote.discount_amount)}</span>
            </div>
          ) : null}

          {quote?.next_tier && (
            <p className="basket-next-tier">
              Chọn thêm {formatCurrency(quote.next_tier.amount_needed)} để được{' '}
              {describePromotion(quote.next_tier).toLowerCase()}.
            </p>
          )}

          <div className="basket-row basket-total">
            <span className="basket-label">Tổng cộng</span>
            <span className="basket-value">
              {quoteLoading && <Loader2 size={14} className="spin" />}
              {formatCurrency(quote?.total_amount ?? localSubtotal)}
            </span>
          </div>

          {tooLong && (
            <div className="account-alert error" role="alert">
              <AlertTriangle size={16} />
              <span>
                Các dịch vụ đã chọn cần {durationMinutes} phút, dài hơn một ca khám ({MAX_VISIT_MINUTES} phút).
                Vui lòng bớt dịch vụ hoặc đặt thành nhiều buổi.
              </span>
            </div>
          )}

          {quoteError && (
            <div className="account-alert error" role="alert">
              <AlertCircle size={16} />
              <span>{quoteError}</span>
            </div>
          )}
        </section>
      )}

      <div className="step3-bottom-bar">
        <button type="button" className="btn-back-step" onClick={onPrevStep}>
          <ArrowLeft size={16} />
          <span>Quay lại</span>
        </button>
        <button
          type="button"
          className="btn btn-primary btn-next-step"
          onClick={onNextStep}
          disabled={selectedServices.length === 0 || !quote || quoteLoading || tooLong}
        >
          <span>Tiếp tục</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
