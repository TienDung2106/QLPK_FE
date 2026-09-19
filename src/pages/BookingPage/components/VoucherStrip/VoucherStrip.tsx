import React, { useEffect, useState } from 'react';
import { BadgePercent, CheckCircle2, ChevronDown, ChevronUp, TicketPercent } from 'lucide-react';
import { apiGetBookingPromotions } from '../../../../api/functions/services';
import type { AvailablePromotion } from '../../../../api/types';
import { describePromotion, formatCompactCurrency, formatCurrency } from '../../bookingFormat';
import './VoucherStrip.css';

interface VoucherStripProps {
  /** Tổng tiền dịch vụ đang chọn, để biết voucher nào đã đủ điều kiện. */
  subtotal: number;
  /** Voucher báo giá đã tự áp; null khi chưa có. */
  appliedPromotionId: number | null;
  patientId?: number | null;
}

type VoucherState = 'applied' | 'eligible' | 'locked' | 'used_up';

function stateOf(promotion: AvailablePromotion, subtotal: number, appliedId: number | null): VoucherState {
  if (promotion.promotion_id === appliedId) {
    return 'applied';
  }

  if (promotion.is_used_up) {
    return 'used_up';
  }

  return subtotal >= promotion.min_booking_amount ? 'eligible' : 'locked';
}

/** Số thẻ hiện khi thu gọn; phần còn lại mở bằng "Xem tất cả". */
const COLLAPSED_COUNT = 3;

/**
 * Dải voucher kiểu sàn thương mại điện tử: bệnh nhân không nhập mã, chỉ nhìn để biết chọn thêm
 * dịch vụ nào thì mở được mức giảm tốt hơn. Voucher thật sự được áp do server chọn (một mã duy nhất).
 */
export const VoucherStrip: React.FC<VoucherStripProps> = ({ subtotal, appliedPromotionId, patientId }) => {
  const [promotions, setPromotions] = useState<AvailablePromotion[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    apiGetBookingPromotions(patientId).then((result) => {
      if (!cancelled && result.ok && result.data) {
        setPromotions(result.data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (promotions.length === 0) {
    return null;
  }

  const visible = expanded ? promotions : promotions.slice(0, COLLAPSED_COUNT);

  return (
    <section className="voucher-strip" aria-label="Ưu đãi dành cho bạn">
      <div className="voucher-strip-head">
        <div className="voucher-strip-title">
          <TicketPercent size={18} />
          <h3>Ưu đãi dành cho bạn</h3>
        </div>
        <p className="voucher-strip-hint">Không cần nhập mã — hệ thống tự áp 1 voucher giảm nhiều nhất.</p>
      </div>

      <div className={`voucher-list ${expanded ? 'is-expanded' : ''}`}>
        {visible.map((promotion) => {
          const state = stateOf(promotion, subtotal, appliedPromotionId);
          const progress = Math.min(100, (subtotal / Math.max(1, promotion.min_booking_amount)) * 100);

          return (
            <article key={promotion.promotion_id} className={`voucher-card voucher-${state}`}>
              <div className="voucher-stub">
                <BadgePercent size={20} />
                <span className="voucher-stub-value">
                  {promotion.discount_type === 'percent'
                    ? `${promotion.discount_value.toLocaleString('vi-VN')}%`
                    : formatCompactCurrency(promotion.discount_value)}
                </span>
              </div>

              <div className="voucher-body">
                <strong className="voucher-headline">{describePromotion(promotion)}</strong>
                <span className="voucher-condition">
                  {promotion.min_booking_amount > 0
                    ? `Đơn từ ${formatCurrency(promotion.min_booking_amount)}`
                    : 'Áp dụng mọi lịch khám'}
                </span>

                {state === 'applied' && (
                  <span className="voucher-status status-applied">
                    <CheckCircle2 size={13} /> Đang áp dụng
                  </span>
                )}
                {state === 'eligible' && <span className="voucher-status status-eligible">Đủ điều kiện</span>}
                {state === 'used_up' && <span className="voucher-status status-used">Đã hết lượt dùng</span>}
                {state === 'locked' && (
                  <>
                    <div className="voucher-progress" aria-hidden="true">
                      <div className="voucher-progress-fill" style={{ transform: `scaleX(${progress / 100})` }} />
                    </div>
                    <span className="voucher-status status-locked">
                      Thêm {formatCurrency(promotion.min_booking_amount - subtotal)} để dùng
                    </span>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {promotions.length > COLLAPSED_COUNT && (
        <button type="button" className="voucher-toggle" onClick={() => setExpanded((open) => !open)}>
          {expanded ? (
            <>
              Thu gọn <ChevronUp size={14} />
            </>
          ) : (
            <>
              Xem tất cả {promotions.length} ưu đãi <ChevronDown size={14} />
            </>
          )}
        </button>
      )}
    </section>
  );
};
