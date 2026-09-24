import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import {
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiSearchNotifications,
} from '../../api/functions/notifications';
import type { Notification } from '../../api/staffTypes';
import { useAction, useApiQuery } from '../hooks';
import { formatDateTime } from '../format';
import { NOTIFICATION_TYPE_LABEL, textOf } from '../labels';
import { useToast } from '../components/toastContext';
import { internalPath } from '../components/notificationPath';
import { Badge, Button, FilterTabs, PageHeader, Pagination, TableState } from '../components/ui';

const TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
];

/** Mọi thông báo của tài khoản đang đăng nhập — dùng chung cho mọi vai trò nhân viên. */
const NotificationsPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { run, isPending } = useAction();
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);

  const query = useApiQuery(
    () => apiSearchNotifications({ unread_only: tab === 'unread' ? true : undefined, page_number: page, page_size: 20 }),
    [tab, page],
  );
  const items = query.data?.items ?? [];

  const markRead = (item: Notification) => {
    query.setData((current) =>
      current
        ? { ...current, items: current.items.map((row) => (row.notification_id === item.notification_id ? { ...row, is_read: true } : row)) }
        : current,
    );
    void apiMarkNotificationRead(item.notification_id);
  };

  const open = (item: Notification) => {
    if (!item.is_read) {
      markRead(item);
    }
    const path = internalPath(item.action_url);
    if (path) {
      navigate(path);
    }
  };

  const markAll = async () => {
    const result = await run('all', apiMarkAllNotificationsRead);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Đã đánh dấu mọi thông báo là đã đọc.');
    query.reload();
  };

  return (
    <>
      <PageHeader
        title="Thông báo"
        description="Lịch hẹn và thông báo hệ thống gửi tới tài khoản của bạn."
        actions={
          <Button icon={<CheckCheck size={15} />} loading={isPending('all')} onClick={markAll}>
            Đánh dấu đã đọc hết
          </Button>
        }
      />

      <section className="st-panel">
        <div className="st-toolbar">
          <FilterTabs
            label="Lọc thông báo"
            options={TABS}
            value={tab}
            onChange={(value) => {
              setTab(value);
              setPage(1);
            }}
          />
        </div>
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Nội dung</th>
                <th>Loại</th>
                <th>Thời gian</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <TableState
                columns={4}
                loading={query.loading}
                error={query.error}
                isEmpty={items.length === 0}
                onRetry={query.reload}
                emptyTitle={tab === 'unread' ? 'Không còn thông báo chưa đọc' : 'Chưa có thông báo'}
              />
              {items.map((item) => (
                <tr key={item.notification_id} className={internalPath(item.action_url) ? 'st-row-link' : ''} onClick={() => open(item)}>
                  <td>
                    <div className="st-cell-main" style={{ fontWeight: item.is_read ? 500 : 700 }}>
                      {!item.is_read && <span className="st-unread-dot" aria-label="Chưa đọc" />}
                      {item.title}
                    </div>
                    <div className="st-cell-sub">{item.content}</div>
                  </td>
                  <td>
                    <Badge>{textOf(NOTIFICATION_TYPE_LABEL, item.notification_type)}</Badge>
                  </td>
                  <td className="st-nowrap st-muted">{formatDateTime(item.created_at)}</td>
                  <td className="st-num">
                    {!item.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          markRead(item);
                        }}
                      >
                        Đã đọc
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={query.data} onPage={setPage} />
      </section>
    </>
  );
};

export default NotificationsPage;
