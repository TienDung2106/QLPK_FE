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

/** Trạng thái bệnh nhân còn tự sửa lịch được, giống các trạng thái còn tự huỷ được. */
const PATIENT_EDITABLE = ['pending', 'pending_approval', 'confirmed'];

/**
 * Nút "Sửa lịch" hiện khi lịch còn sửa được và chưa tới giờ. Hạn số giờ trước khám do server kiểm và
 * báo lỗi như khi huỷ; lịch đang chờ trả lời dời lịch thì trả lời trước.
 */
export const canPatientEdit = (appointment: AppointmentListItem & { awaiting_reschedule_response?: boolean }) =>
  PATIENT_EDITABLE.includes(appointment.status) &&
  new Date(`${appointment.appointment_date}T${appointment.appointment_time}`) > new Date() &&
  !appointment.awaiting_reschedule_response;
