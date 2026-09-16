import { GetData, PostData } from '../helpers';
import url from '../url';
import type { PagedResponse } from '../types';
import type { Notification, NotificationQuery, UnreadNotificationCount } from '../staffTypes';

/*
 * Thông báo của chính tài khoản đang đăng nhập. Route nằm dưới /patient nhưng backend mở cho
 * mọi tài khoản ([AnyAuthenticatedAccount]), nên nhân viên cũng dùng đúng các hàm này.
 */

export const apiSearchNotifications = (query: NotificationQuery = {}) =>
  GetData<PagedResponse<Notification>>(url.notifications, query);

export const apiCountUnreadNotifications = () => GetData<UnreadNotificationCount>(url.notificationsUnreadCount);

export const apiMarkNotificationRead = (notificationId: number) => PostData<void>(url.notificationRead(notificationId));

export const apiMarkAllNotificationsRead = () => PostData<void>(url.notificationsReadAll);
