import type { AppointmentListItem } from '../../api/types';

/** Gộp trạng thái thành 4 nhóm bệnh nhân cần để ý; chấm màu, chú giải và tiêu đề tháng dùng chung. */
export const GROUPS = [
  { key: 'waiting', label: 'Chờ xác nhận', statuses: ['pending', 'pending_approval'] },
  { key: 'upcoming', label: 'Sắp khám', statuses: ['confirmed', 'checked_in'] },
  { key: 'done', label: 'Đã khám', statuses: ['completed'] },
  { key: 'cancelled', label: 'Đã huỷ / vắng', statuses: ['cancelled', 'no_show'] },
];

export type StatusGroup = (typeof GROUPS)[number];

export const groupOf = (status: string): StatusGroup => GROUPS.find((group) => group.statuses.includes(status)) ?? GROUPS[3];

/** Số lịch theo từng nhóm, bỏ nhóm không có lịch nào. */
export const countByGroup = (items: AppointmentListItem[]) =>
  GROUPS.map((group) => ({ group, count: items.filter((item) => groupOf(item.status) === group).length }))
    .filter(({ count }) => count > 0);
