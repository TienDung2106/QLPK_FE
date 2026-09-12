import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Info,
  Clock,
  Stethoscope,
  Loader2,
  Tag,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { apiGetServices } from '../../../../api/functions/services';
import type { ClinicService } from '../../../../api/types';
import { formatCurrency } from '../../bookingFormat';
import './Step3Service.css';

interface Step3ServiceProps {
  selectedServiceId: number | null;
  discountCode: string;
  onSelectService: (service: ClinicService) => void;
  onApplyDiscount: (code: string) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
}

export const Step3Service: React.FC<Step3ServiceProps> = ({
  selectedServiceId,
  discountCode,
  onSelectService,
  onApplyDiscount,
  onPrevStep,
  onNextStep,
}) => {
  const [services, setServices] = useState<ClinicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState(discountCode);

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

  const handleApply = (event: React.FormEvent) => {
    event.preventDefault();
    onApplyDiscount(promoInput.trim());
  };

  return (
    <div className="step3-container">
      <h2 className="step3-main-heading">BƯỚC 3: CHỌN DỊCH VỤ &amp; MÃ GIẢM GIÁ</h2>

      {/* Info callout */}
      <div className="step3-callout">
        <Info size={16} className="callout-icon" />
        <span>Vui lòng chọn dịch vụ bạn muốn sử dụng trong buổi khám.</span>
      </div>

      {/* Services grid */}
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
              const isSel = selectedServiceId === service.service_id;

              return (
                <div
                  key={service.service_id}
                  className={`service-card ${isSel ? 'is-selected' : ''}`}
                  onClick={() => onSelectService(service)}
                >
                  <div className="card-top">
                    <div className="card-left">
                      <div className={`service-radio ${isSel ? 'checked' : ''}`}>
                        <div className="radio-dot" />
                      </div>
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

                    {/* Giá lấy thẳng từ API. Đây cũng chính là cột giá server đọc lại lúc
                        chốt hoá đơn, nên con số hiện ở đây là con số sẽ bị tính. */}
                    <span className="service-price">{formatCurrency(service.price)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Discount section */}
      <section className="step3-discount-section">
        <h3 className="step3-section-title">Mã giảm giá (nếu có)</h3>
        <div className="discount-row">
          <form className="promo-form" onSubmit={handleApply}>
            <input
              type="text"
              className="promo-input"
              placeholder="Nhập mã giảm giá của bạn..."
              value={promoInput}
              onChange={(event) => setPromoInput(event.target.value)}
            />
            <button type="submit" className="btn btn-primary promo-apply-btn">
              Áp dụng
            </button>
          </form>

          <div className="promo-info-box">
            <Tag size={16} className="tag-icon" />
            <div>
              <strong>{discountCode ? `Đã nhập mã: ${discountCode}` : 'Chưa có mã giảm giá'}</strong>
              {/* Mức giảm do server quyết, không phải client — chỉ khi đặt lịch xong mới
                  biết mã có hiệu lực hay không (TC-SEC-05). */}
              <p>
                {discountCode
                  ? 'Mã sẽ được phòng khám kiểm tra khi xác nhận lịch hẹn.'
                  : 'Bạn có thể bỏ qua bước này.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom nav */}
      <div className="step3-bottom-bar">
        <button type="button" className="btn-back-step" onClick={onPrevStep}>
          <ArrowLeft size={16} />
          <span>Quay lại</span>
        </button>
        <button
          type="button"
          className="btn btn-primary btn-next-step"
          onClick={onNextStep}
          disabled={selectedServiceId === null}
        >
          <span>Tiếp tục</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
