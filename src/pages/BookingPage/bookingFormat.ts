/**
 * Chuyển đổi qua lại giữa dạng backend dùng và dạng hiển thị cho người đọc tiếng Việt.
 *
 * Gom về một chỗ vì cả 5 bước và thanh tóm tắt đều cần, và vì nhầm lẫn giữa 'yyyy-MM-dd'
 * (thứ backend nhận) với 'dd/MM/yyyy' (thứ người dùng đọc) là lỗi rất dễ mắc.
 */

const WEEKDAY_LABELS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

/** 'yyyy-MM-dd' của hôm nay theo giờ máy người dùng. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/**
 * Date → 'yyyy-MM-dd', ghép bằng tay chứ không dùng toISOString(): toISOString đổi sang
 * UTC, nên ở UTC+7 mọi thời điểm trước 7 giờ sáng sẽ lùi về ngày hôm trước.
 */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

/** 'yyyy-MM-dd' → 'dd/MM/yyyy (Thứ 2)'. */
export function formatDateLabel(isoDate: string): string {
  if (!isoDate) {
    return '';
  }

  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} (${
    WEEKDAY_LABELS[date.getDay()]
  })`;
}

/** 'HH:mm:ss' → 'HH:mm'. Backend trả TimeOnly đủ giây, người dùng chỉ cần giờ và phút. */
export function formatTimeLabel(time: string): string {
  return time ? time.slice(0, 5) : '';
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

/** Ngày trong tháng của `isoDate`, dùng để vẽ lưới lịch. */
export function monthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1);

  // getDay() coi Chủ nhật là 0, còn lịch ở đây bắt đầu từ Thứ 2 — dịch một nhịp.
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  return [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
}

/** 'HH:mm:ss' của đầu và cuối ca → '07:30–09:30'. */
export function formatShiftRange(startTime: string, endTime: string): string {
  return `${formatTimeLabel(startTime)}–${formatTimeLabel(endTime)}`;
}

/** 100000 → '100K', 1500000 → '1,5TR': gọn cho thẻ voucher. */
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}TR`;
  }

  if (amount >= 1_000) {
    return `${(amount / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}K`;
  }

  return formatCurrency(amount);
}

interface PromotionTerms {
  discount_type: string;
  discount_value: number;
  max_discount_amount: number | null;
}

/** "Giảm 10% tối đa 100K" hoặc "Giảm 50K" — cùng một câu ở thẻ voucher, tóm tắt và bước xác nhận. */
export function describePromotion(promotion: PromotionTerms): string {
  if (promotion.discount_type === 'percent') {
    const cap = promotion.max_discount_amount
      ? ` tối đa ${formatCompactCurrency(promotion.max_discount_amount)}`
      : '';

    return `Giảm ${promotion.discount_value.toLocaleString('vi-VN')}%${cap}`;
  }

  return `Giảm ${formatCompactCurrency(promotion.discount_value)}`;
}
