import { GetData, PutData } from '../helpers';
import url from '../url';
import type { PatientProfile } from '../types';

export interface UpdatePatientProfilePayload {
  full_name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  occupation?: string | null;
  blood_type?: string | null;
  health_insurance_number?: string | null;
  health_insurance_expiry?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  allergy_notes?: string | null;
}

/**
 * Hồ sơ bệnh nhân của chính tài khoản đang đăng nhập. Một tài khoản có thể giữ nhiều hồ
 * sơ (bản thân, con, bố mẹ), và mỗi lần đặt lịch phải chỉ đích danh một `patient_id` —
 * đây là chỗ lấy id đó.
 */
export const apiGetMyProfiles = () => GetData<PatientProfile[]>(url.patientProfile);

export const apiUpdateProfile = (patientId: number, payload: UpdatePatientProfilePayload) =>
  PutData<PatientProfile>(url.patientProfileById(patientId), payload);
