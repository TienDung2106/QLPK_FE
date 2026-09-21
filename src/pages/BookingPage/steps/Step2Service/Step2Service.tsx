import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
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
import { renderActions } from '../../components/stepActions';
import './Step2Service.css';

/**
 * Độ dài một ca chuẩn của phòng khám. Lượt khám dài hơn thế vẫn đặt được: nó chiếm nhiều ca liền
 * nhau trong cùng một buổi.
 *
 * ponytail: số này chỉ dùng để viết câu nhắc bên dưới. Chỗ trống thật do available-slots ở bước 3
 * quyết định, nên admin có sửa độ dài ca thì cùng lắm là câu nhắc nói sai, không cho đặt sai. Cần chính
 * xác thì trả thêm max_visit_minutes từ /api/booking/quote.
 */
const SHIFT_MINUTES = 120;

/**
 * Mốc lọc viết cứng, đủ dùng cho bảng giá hiện tại của phòng khám.
 *
 * ponytail: rút ra thành cấu hình khi bảng giá đổi tới mức các mốc này hết nghĩa.
 */
const PRICE_BANDS = [
  { value: 'all', label: 'Mọi mức giá', min: 0, max: Infinity },
  { value: 'low', label: 'Dưới 500.000đ', min: 0, max: 500_000 },
  { value: 'mid', label: '500.000 – 1.000.000đ', min: 500_000, max: 1_000_000 },
  { value: 'high', label: 'Trên 1.000.000đ', min: 1_000_000, max: Infinity },
] as const;

const DURATION_BANDS = [
  { value: 'all', label: 'Mọi thời lượng', min: 0, max: Infinity },
  { value: 'short', label: 'Tối đa 30 phút', min: 0, max: 30 },
  { value: 'medium', label: '31 – 60 phút', min: 31, max: 60 },
  { value: 'long', label: 'Trên 60 phút', min: 61, max: Infinity },
] as const;

const SORTS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price-asc', label: 'Giá thấp → cao' },
  { value: 'price-desc', label: 'Giá cao → thấp' },
  { value: 'duration-asc', label: 'Thời gian ngắn → dài' },
  { value: 'duration-desc', label: 'Thời gian dài → ngắn' },
] as const;

type PriceBand = (typeof PRICE_BANDS)[number]['value'];
type DurationBand = (typeof DURATION_BANDS)[number]['value'];
type SortKey = (typeof SORTS)[number]['value'];

interface Step2ServiceProps {
  selectedServices: SelectedService[];
  quote: BookingQuote | null;
  quoteLoading: boolean;
  quoteError: string | null;
  patientId: number | null;
  onToggleService: (service: ClinicService) => void;
  /** Bỏ mọi dịch vụ ngoài danh sách này trong một lần; dùng cho nút "1 ca". */
  onKeepServices: (serviceIds: number[]) => void;
  onPrevStep: () => void;
  /** Có thì nút Quay lại / Tiếp tục được đưa sang cột tóm tắt bên phải. */
  actionsSlot?: HTMLElement | null;
  onNextStep: () => void;
}

export const Step2Service: React.FC<Step2ServiceProps> = ({
  selectedServices,
  quote,
  quoteLoading,
  quoteError,
  patientId,
  onToggleService,
  onKeepServices,
  onPrevStep,
  actionsSlot,
  onNextStep,
}) => {
  const [services, setServices] = useState<ClinicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [group, setGroup] = useState('all');
  const [priceBand, setPriceBand] = useState<PriceBand>('all');
  const [durationBand, setDurationBand] = useState<DurationBand>('all');
  const [sort, setSort] = useState<SortKey>('default');

  /** Tên các dịch vụ vừa bị nút "1 ca" bỏ đi, để nói cho bệnh nhân biết đã mất cái gì. */
  const [droppedNames, setDroppedNames] = useState<string[]>([]);

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
  const shiftsNeeded = Math.ceil(durationMinutes / SHIFT_MINUTES);
  const bufferMinutes = quote ? quote.duration_minutes - quote.service_minutes : 0;

  // Chế độ đang bật suy thẳng từ tổng thời gian, không lưu thành state: chọn quá một ca là nút tự
  // nhảy sang "1 buổi", nên không bao giờ có cảnh nút nói một đằng giỏ hàng một nẻo.
  const spansHalfDay = shiftsNeeded > 1;

  // Giữ phần đầu của thứ tự tick, bỏ từ cuối lên cho tới khi vừa một ca. Đệm kê đơn dặn dò luôn bị
  // tính nên nó ăn vào quỹ 120 phút trước tiên.
  const keptForOneShift = useMemo(() => {
    const keep: SelectedService[] = [];
    let minutes = bufferMinutes;

    for (const service of selectedServices) {
      if (minutes + service.durationMinutes > SHIFT_MINUTES) {
        break;
      }

      minutes += service.durationMinutes;
      keep.push(service);
    }

    return keep;
  }, [selectedServices, bufferMinutes]);

  // Bỏ sạch giỏ thì chẳng còn là "thu gọn" nữa; chỉ xảy ra nếu có dịch vụ đơn lẻ dài hơn một ca.
  const canTrimToOneShift = spansHalfDay && keptForOneShift.length > 0;

  const trimToOneShift = () => {
    const kept = new Set(keptForOneShift.map((service) => service.serviceId));

    setDroppedNames(
      selectedServices.filter((service) => !kept.has(service.serviceId)).map((service) => service.name),
    );
    onKeepServices([...kept]);
  };

  // Bệnh nhân tự đổi giỏ thì lời nhắc cũ hết đúng.
  const handleToggleService = (service: ClinicService) => {
    setDroppedNames([]);
    onToggleService(service);
  };

  const groups = useMemo(
    () => [...new Set(services.map((service) => service.service_group).filter(Boolean))] as string[],
    [services],
  );

  const filtered = useMemo(() => {
    const price = PRICE_BANDS.find((band) => band.value === priceBand)!;
    const duration = DURATION_BANDS.find((band) => band.value === durationBand)!;

    const matching = services.filter(
      (service) =>
        (group === 'all' || service.service_group === group) &&
        service.price >= price.min &&
        service.price <= price.max &&
        service.duration_minutes >= duration.min &&
        service.duration_minutes <= duration.max,
    );

    switch (sort) {
      case 'price-asc':
        return [...matching].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...matching].sort((a, b) => b.price - a.price);
      case 'duration-asc':
        return [...matching].sort((a, b) => a.duration_minutes - b.duration_minutes);
      case 'duration-desc':
        return [...matching].sort((a, b) => b.duration_minutes - a.duration_minutes);
      default:
        return matching;
    }
  }, [services, group, priceBand, durationBand, sort]);

  const filtersOn = group !== 'all' || priceBand !== 'all' || durationBand !== 'all' || sort !== 'default';

  const clearFilters = () => {
    setGroup('all');
    setPriceBand('all');
    setDurationBand('all');
    setSort('default');
  };

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

        {!loading && services.length > 0 && (
          <>
            <div className="service-filter-bar">
              {groups.length > 0 && (
                <div className="filter-group">
                  <label className="filter-label" htmlFor="step2-group">
                    Nhóm dịch vụ
                  </label>
                  <div className="select-wrapper">
                    <select
                      id="step2-group"
                      className="filter-select"
                      value={group}
                      onChange={(event) => setGroup(event.target.value)}
                    >
                      <option value="all">Tất cả nhóm</option>
                      {groups.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="select-chevron" />
                  </div>
                </div>
              )}

              <div className="filter-group">
                <label className="filter-label" htmlFor="step2-price">
                  Khoảng giá
                </label>
                <div className="select-wrapper">
                  <select
                    id="step2-price"
                    className="filter-select"
                    value={priceBand}
                    onChange={(event) => setPriceBand(event.target.value as PriceBand)}
                  >
                    {PRICE_BANDS.map((band) => (
                      <option key={band.value} value={band.value}>
                        {band.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="select-chevron" />
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-label" htmlFor="step2-duration">
                  Thời lượng
                </label>
                <div className="select-wrapper">
                  <select
                    id="step2-duration"
                    className="filter-select"
                    value={durationBand}
                    onChange={(event) => setDurationBand(event.target.value as DurationBand)}
                  >
                    {DURATION_BANDS.map((band) => (
                      <option key={band.value} value={band.value}>
                        {band.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="select-chevron" />
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-label" htmlFor="step2-sort">
                  Sắp xếp
                </label>
                <div className="select-wrapper">
                  <select
                    id="step2-sort"
                    className="filter-select"
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortKey)}
                  >
                    {SORTS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="select-chevron" />
                </div>
              </div>
            </div>

            {filtersOn && (
              <p className="service-filter-summary">
                Hiển thị {filtered.length}/{services.length} dịch vụ.
                <button type="button" className="service-filter-clear" onClick={clearFilters}>
                  Xoá lọc
                </button>
              </p>
            )}
          </>
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
        ) : filtered.length === 0 ? (
          <div className="no-doctors-msg">Không có dịch vụ nào khớp bộ lọc.</div>
        ) : (
          <div className="services-grid">
            {filtered.map((service) => {
              const isSel = selectedIds.has(service.service_id);

              return (
                <div
                  key={service.service_id}
                  role="checkbox"
                  tabIndex={0}
                  aria-checked={isSel}
                  className={`service-card ${isSel ? 'is-selected' : ''}`}
                  onClick={() => handleToggleService(service)}
                  onKeyDown={(event) => {
                    if (event.key === ' ' || event.key === 'Enter') {
                      event.preventDefault();
                      handleToggleService(service);
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
          <div className="visit-scope-tabs" role="tablist" aria-label="Phạm vi lượt khám">
            <button
              type="button"
              role="tab"
              aria-selected={!spansHalfDay}
              className={`visit-scope-tab ${spansHalfDay ? '' : 'active'}`}
              onClick={trimToOneShift}
              disabled={!canTrimToOneShift}
              title={
                spansHalfDay
                  ? canTrimToOneShift
                    ? 'Bỏ bớt dịch vụ chọn sau cùng để lượt khám gọn trong một ca'
                    : 'Không bỏ bớt được: dịch vụ đầu tiên đã dài hơn một ca'
                  : 'Lượt khám đang gọn trong một ca'
              }
            >
              1 ca <small>≤ {SHIFT_MINUTES} phút</small>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={spansHalfDay}
              className={`visit-scope-tab ${spansHalfDay ? 'active' : ''}`}
              disabled={!spansHalfDay}
              title={
                spansHalfDay
                  ? 'Lượt khám chiếm nhiều ca liền nhau trong cùng một buổi'
                  : 'Chọn thêm dịch vụ thì lượt khám mới chiếm cả buổi'
              }
            >
              1 buổi <small>&gt; {SHIFT_MINUTES} phút</small>
            </button>
          </div>

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

          {droppedNames.length > 0 && (
            <div className="step3-callout">
              <Info size={16} className="callout-icon" />
              <span>
                Đã bỏ <strong>{droppedNames.join(', ')}</strong> để lượt khám gọn trong một ca. Tick lại trên thẻ
                nếu bạn vẫn muốn làm.
              </span>
            </div>
          )}

          {spansHalfDay && (
            <div className="step3-callout">
              <Info size={16} className="callout-icon" />
              <span>
                Lượt khám này chiếm {shiftsNeeded} ca liền nhau, nên ở bước sau bạn chọn ngày và buổi sáng hoặc
                buổi chiều, thay vì chọn từng ca.
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

      {/* Nút điều hướng nằm ở cột tóm tắt, dưới ô hỗ trợ; chưa có chỗ đó thì hiện tại đây. */}
      {renderActions(
        <div className="step3-bottom-bar">
          <button type="button" className="btn-back-step" onClick={onPrevStep}>
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-next-step"
            onClick={onNextStep}
            disabled={selectedServices.length === 0 || !quote || quoteLoading}
          >
            <span>Tiếp tục</span>
            <ArrowRight size={18} />
          </button>
        </div>,
        actionsSlot,
      )}
    </div>
  );
};
