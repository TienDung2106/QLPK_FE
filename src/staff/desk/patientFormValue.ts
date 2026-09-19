import type { DeskPatient, RegisterDeskPatientPayload } from '../../api/staffTypes';
import { nullIfBlank } from '../format';

export interface PatientFormValue {
  full_name: string;
  phone_number: string;
  email: string;
  national_id: string;
  date_of_birth: string;
  gender: string;
  address: string;
  occupation: string;
  blood_type: string;
  health_insurance_number: string;
  health_insurance_expiry: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  allergy_notes: string;
}

export const emptyPatientForm: PatientFormValue = {
  full_name: '',
  phone_number: '',
  email: '',
  national_id: '',
  date_of_birth: '',
  gender: '',
  address: '',
  occupation: '',
  blood_type: '',
  health_insurance_number: '',
  health_insurance_expiry: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  allergy_notes: '',
};

export const patientToForm = (patient: DeskPatient): PatientFormValue => ({
  full_name: patient.full_name,
  phone_number: patient.account_phone_number ?? '',
  email: patient.account_email ?? '',
  national_id: patient.national_id ?? '',
  date_of_birth: patient.date_of_birth ?? '',
  gender: patient.gender ?? '',
  address: patient.address ?? '',
  occupation: patient.occupation ?? '',
  blood_type: patient.blood_type ?? '',
  health_insurance_number: patient.health_insurance_number ?? '',
  health_insurance_expiry: patient.health_insurance_expiry ?? '',
  emergency_contact_name: patient.emergency_contact_name ?? '',
  emergency_contact_phone: patient.emergency_contact_phone ?? '',
  allergy_notes: patient.allergy_notes ?? '',
});

export function patientPayload(form: PatientFormValue): RegisterDeskPatientPayload | string {
  if (!form.full_name.trim()) {
    return 'Nhập họ tên bệnh nhân.';
  }
  // Cùng luật với backend, để lỗi hiện ngay tại quầy thay vì sau một vòng gọi API.
  const phone = form.phone_number.trim();
  if (phone && !/^\+?[0-9]{8,15}$/.test(phone)) {
    return 'Số điện thoại chỉ gồm chữ số, 8–15 chữ số.';
  }
  const email = form.email.trim();
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return 'Email không hợp lệ.';
  }
  const nationalId = form.national_id.trim();
  if (nationalId && !/^([0-9]{9}|[0-9]{12})$/.test(nationalId)) {
    return 'CCCD gồm 12 chữ số (CMND cũ 9 chữ số).';
  }
  const emergencyPhone = form.emergency_contact_phone.trim();
  if (emergencyPhone && !/^\+?[0-9]{8,15}$/.test(emergencyPhone)) {
    return 'Số điện thoại người liên hệ khẩn cấp chỉ gồm chữ số, 8–15 chữ số.';
  }
  return {
    full_name: form.full_name.trim(),
    phone_number: nullIfBlank(form.phone_number),
    email: nullIfBlank(form.email),
    national_id: nullIfBlank(form.national_id),
    date_of_birth: nullIfBlank(form.date_of_birth),
    gender: nullIfBlank(form.gender),
    address: nullIfBlank(form.address),
    occupation: nullIfBlank(form.occupation),
    blood_type: nullIfBlank(form.blood_type),
    health_insurance_number: nullIfBlank(form.health_insurance_number),
    health_insurance_expiry: nullIfBlank(form.health_insurance_expiry),
    emergency_contact_name: nullIfBlank(form.emergency_contact_name),
    emergency_contact_phone: nullIfBlank(form.emergency_contact_phone),
    allergy_notes: nullIfBlank(form.allergy_notes),
  };
}
