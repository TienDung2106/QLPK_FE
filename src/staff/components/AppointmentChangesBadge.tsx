import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiCountUnseenAppointmentChanges } from '../../api/functions/desk';

const POLL_MS = 60_000;

/**
 * Số lần bệnh nhân tự sửa lịch mà quầy chưa xem, cạnh mục menu. Hỏi lại theo chu kỳ khi tab đang mở,
 * mỗi lần đổi trang, và ngay khi trang danh sách báo vừa đánh dấu đã xem (sự kiện
 * 'appointment-changes-seen').
 */
export const AppointmentChangesBadge = () => {
  const location = useLocation();
  const [count, setCount] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((value) => value + 1);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        bump();
      }
    }, POLL_MS);
    window.addEventListener('appointment-changes-seen', bump);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('appointment-changes-seen', bump);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    apiCountUnseenAppointmentChanges().then((result) => {
      if (alive && result.ok && typeof result.data === 'number') {
        setCount(result.data);
      }
    });
    return () => {
      alive = false;
    };
  }, [tick, location.pathname]);

  if (count === 0) {
    return null;
  }

  return (
    <span className="st-rail-count" aria-label={`${count} lịch chưa xem`}>
      {count > 99 ? '99+' : count}
    </span>
  );
};
