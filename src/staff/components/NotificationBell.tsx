import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import {
  apiCountUnreadNotifications,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiSearchNotifications,
} from '../../api/functions/notifications';
import type { Notification } from '../../api/staffTypes';
import { formatDateTime } from '../format';
import { useToast } from './toastContext';
import { internalPath } from './notificationPath';

const POLL_MS = 60_000;

/**
 * Chuông ở topbar: đếm tin chưa đọc (hỏi lại mỗi phút và mỗi lần đổi trang), mở ra thấy
 * năm tin mới nhất. Danh sách đầy đủ ở /thong-bao.
 */
export const NotificationBell = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        setTick((value) => value + 1);
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, []);

  // Hỏi lại số chưa đọc: lần đầu, mỗi lần đổi trang và theo chu kỳ.
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
    apiSearchNotifications({ page_size: 5 }).then((result) => {
      if (!alive) {
        return;
      }
      setItems(result.data?.items ?? []);
      setError(result.ok ? null : result.error);
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

  const openItem = async (item: Notification) => {
    setOpen(false);
    if (!item.is_read) {
      setUnread((count) => Math.max(0, count - 1));
      void apiMarkNotificationRead(item.notification_id);
    }
    const path = internalPath(item.action_url);
    navigate(path ?? '/thong-bao');
  };

  const markAll = async () => {
    const result = await apiMarkAllNotificationsRead();
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setUnread(0);
    setItems((current) => current?.map((item) => ({ ...item, is_read: true })) ?? current);
  };

  return (
    <div className="st-user" ref={ref}>
      <button
        type="button"
        className="st-btn st-btn-ghost st-btn-icon st-bell"
        aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} />
        {unread > 0 && <span className="st-bell-count">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="st-menu st-notify-menu" role="menu">
          <div className="st-notify-head">
            <strong>Thông báo</strong>
            {unread > 0 && (
              <button type="button" className="st-link-btn" onClick={markAll}>
                <CheckCheck size={14} /> Đã đọc hết
              </button>
            )}
          </div>
          {error && <div className="st-notify-empty">{error}</div>}
          {items === null && !error && <div className="st-notify-empty">Đang tải…</div>}
          {items?.length === 0 && <div className="st-notify-empty">Chưa có thông báo nào.</div>}
          {items?.map((item) => (
            <button
              key={item.notification_id}
              type="button"
              role="menuitem"
              className={`st-notify-item ${item.is_read ? '' : 'unread'}`}
              onClick={() => openItem(item)}
            >
              <span className="st-notify-title">{item.title}</span>
              <span className="st-notify-text">{item.content}</span>
              <span className="st-notify-time">{formatDateTime(item.created_at)}</span>
            </button>
          ))}
          <Link to="/thong-bao" className="st-notify-all" onClick={() => setOpen(false)}>
            Xem tất cả
          </Link>
        </div>
      )}
    </div>
  );
};
