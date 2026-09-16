import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import {
  apiCountUnreadNotifications,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiSearchNotifications,
} from '../../api/functions/notifications';
import type { Notification } from '../../api/staffTypes';
import { internalPath } from '../../staff/components/notificationPath';
import { formatDateTime } from '../../staff/format';
import './PatientNotificationBell.css';

const POLL_MS = 60_000;

/**
 * Chuông thông báo cho bệnh nhân trên thanh điều hướng: phòng khám xác nhận, từ chối hay dời
 * lịch đều được báo ở đây. Bấm một tin thì đánh dấu đã đọc và đi tới trang liên quan.
 */
export const PatientNotificationBell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [tick, setTick] = useState(0);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        setTick((value) => value + 1);
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let alive = true;
    apiCountUnreadNotifications().then((result) => {
      if (alive && result.ok && result.data) {
        setUnread(result.data.unread_count);
      }
    });
    return () => {
      alive = false;
    };
  }, [tick, location.pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let alive = true;
    apiSearchNotifications({ page_size: 8 }).then((result) => {
      if (alive) {
        setItems(result.data?.items ?? []);
        setError(result.ok ? null : result.error);
      }
    });
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => {
      alive = false;
      document.removeEventListener('mousedown', close);
    };
  }, [open]);

  const openItem = (item: Notification) => {
    if (!item.is_read) {
      setUnread((count) => Math.max(0, count - 1));
      setItems((current) => current?.map((row) => (row.notification_id === item.notification_id ? { ...row, is_read: true } : row)) ?? current);
      void apiMarkNotificationRead(item.notification_id);
    }
    const path = internalPath(item.action_url);
    if (path) {
      setOpen(false);
      navigate(path);
    }
  };

  const markAll = async () => {
    const result = await apiMarkAllNotificationsRead();
    if (result.ok) {
      setUnread(0);
      setItems((current) => current?.map((row) => ({ ...row, is_read: true })) ?? current);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="pt-bell" ref={ref}>
      <button
        type="button"
        className="pt-bell-trigger"
        aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={19} />
        {unread > 0 && <span className="pt-bell-count">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="pt-bell-panel" role="menu">
          <div className="pt-bell-head">
            <strong>Thông báo</strong>
            {unread > 0 && (
              <button type="button" onClick={markAll}>
                <CheckCheck size={14} /> Đánh dấu đã đọc
              </button>
            )}
          </div>
          {error && <div className="pt-bell-empty">{error}</div>}
          {items === null && !error && (
            <div className="pt-bell-empty">
              <Loader2 className="spin" size={16} />
            </div>
          )}
          {items?.length === 0 && <div className="pt-bell-empty">Bạn chưa có thông báo nào.</div>}
          {items?.map((item) => (
            <button
              key={item.notification_id}
              type="button"
              role="menuitem"
              className={`pt-bell-item ${item.is_read ? '' : 'unread'}`}
              onClick={() => openItem(item)}
            >
              <span className="pt-bell-title">{item.title}</span>
              <span className="pt-bell-text">{item.content}</span>
              <span className="pt-bell-time">{formatDateTime(item.created_at)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
