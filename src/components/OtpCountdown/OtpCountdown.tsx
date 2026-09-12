import { useEffect, useState } from 'react';

function secondsLeft(expiresAt: string): number {
  const remaining = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Number.isFinite(remaining) && remaining > 0 ? remaining : 0;
}

interface OtpCountdownProps {
  /** ISO 8601, lấy từ `expires_at` backend trả về. */
  expiresAt: string;
  prefix?: string;
  expiredLabel?: string;
}

/**
 * Đếm ngược tới lúc mã OTP hết hiệu lực.
 *
 * Có mặt vì nếu không, người dùng không có cách nào biết mã còn sống bao lâu, và một mã
 * đã chết chỉ biểu hiện ra là "nhập đúng mã mà vẫn báo sai".
 */
export const OtpCountdown = ({
  expiresAt,
  prefix = 'Hết hạn sau',
  expiredLabel = 'Đã hết hạn',
}: OtpCountdownProps) => {
  // Đồng hồ chỉ để ép vẽ lại mỗi giây; số giây còn lại tính ngay lúc render từ `expiresAt`.
  // Nếu giữ nó trong state thì mỗi lần `expiresAt` đổi (gửi lại mã) lại phải đồng bộ state
  // đó trong effect, và ta có một nguồn sự thật thừa.
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);

    return () => window.clearInterval(timer);
  }, []);

  const remaining = secondsLeft(expiresAt);

  if (remaining <= 0) {
    return <span>{expiredLabel}</span>;
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <span>
      {prefix} {minutes}:{String(seconds).padStart(2, '0')}
    </span>
  );
};
