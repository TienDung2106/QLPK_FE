/** Định dạng dùng chung cho khu nhân viên. Mọi hàm chịu được null và trả '—'. */

const EMPTY = '—';

const moneyFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return EMPTY;
  }
  return `${moneyFormatter.format(value)} ₫`;
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return EMPTY;
  }
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return EMPTY;
  }
  return `${formatNumber(value, 2)}%`;
}

/** 'yyyy-MM-dd' → 'dd/MM/yyyy'. Không đi qua Date để khỏi lệch múi giờ. */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return EMPTY;
  }
  const [year, month, day] = value.slice(0, 10).split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
}

/** 'HH:mm:ss' → 'HH:mm'. */
export function formatTime(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : EMPTY;
}

/** Thời điểm ISO → giờ phòng khám. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return EMPTY;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Ngày hôm nay theo giờ Việt Nam, dạng 'yyyy-MM-dd' — đúng định dạng backend nhận. */
export function todayIso(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86_400_000);
  // en-CA cho ra đúng yyyy-MM-dd.
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

/** 'HH:mm' từ ô input time → 'HH:mm:ss' cho backend. */
export function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

/** Chuỗi rỗng trong form → null trong payload. */
export function nullIfBlank(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  const last = parts[parts.length - 1];
  return last.charAt(0).toUpperCase();
}
