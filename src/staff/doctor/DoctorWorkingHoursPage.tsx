import { apiGetOwnWorkingHours } from '../../api/functions/doctorWork';
import { PageHeader } from '../components/ui';
import { WorkingHoursEditor } from '../components/workingHours';
import type { WorkingHoursApi } from '../components/workingHours';

/** Bác sĩ chỉ xem ca của mình; thêm/sửa/tắt ca do quản trị viên làm. */
const api: WorkingHoursApi = {
  list: (includeInactive) => apiGetOwnWorkingHours({ include_inactive: includeInactive || undefined }),
};

const DoctorWorkingHoursPage = () => (
  <>
    <PageHeader
      title="Giờ làm việc"
      description="Khung giờ khám lặp lại mỗi tuần do quản trị viên xếp. Lịch trống cho bệnh nhân được tính từ đây, trừ ngày nghỉ và ngày lễ."
    />
    <WorkingHoursEditor api={api} scopeKey="own" />
  </>
);

export default DoctorWorkingHoursPage;
