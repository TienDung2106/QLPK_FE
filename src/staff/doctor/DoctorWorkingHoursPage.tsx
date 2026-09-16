import {
  apiCreateOwnWorkingHours,
  apiGetOwnWorkingHours,
  apiSetOwnWorkingHoursStatus,
  apiUpdateOwnWorkingHours,
} from '../../api/functions/doctorWork';
import { PageHeader } from '../components/ui';
import { WorkingHoursEditor } from '../components/workingHours';
import type { WorkingHoursApi } from '../components/workingHours';

const api: WorkingHoursApi = {
  list: (includeInactive) => apiGetOwnWorkingHours({ include_inactive: includeInactive || undefined }),
  create: apiCreateOwnWorkingHours,
  update: apiUpdateOwnWorkingHours,
  setStatus: apiSetOwnWorkingHoursStatus,
};

/** Bác sĩ tự khai giờ khám hằng tuần — không có dòng nào thì không ai đặt được lịch với mình. */
const DoctorWorkingHoursPage = () => (
  <>
    <PageHeader
      title="Giờ làm việc"
      description="Khung giờ khám lặp lại mỗi tuần. Lịch trống cho bệnh nhân được tính từ đây, trừ ngày nghỉ và ngày lễ."
    />
    <WorkingHoursEditor api={api} scopeKey="own" />
  </>
);

export default DoctorWorkingHoursPage;
