/* ============================================================
   BOOKING FLOW — SHARED TYPE DEFINITIONS
   Dữ liệu ở đây lấy từ API thật (xem src/api/functions), nên
   các trường phản chiếu đúng những gì backend trả về.
   ============================================================ */

export interface BookingDoctor {
  /** Khoá dùng cho React và cho việc so sánh lựa chọn. */
  id: string;
  /** doctor_id thật, là thứ gửi lên khi xem slot và khi đặt lịch. */
  doctorId: number;
  name: string;
  specialty: string;
  specialtyId?: number;
  experienceYears?: number;
  degree?: string;
  avatar?: string;
  /** consultation_fee — phí khám của bác sĩ, tách khỏi giá dịch vụ. */
  price?: number;
}

export interface PatientInfo {
  fullName: string;
  phone: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  /** 'yyyy-MM-dd', đúng dạng DateOnly của backend. */
  birthDate: string;
  address: string;
  notes: string;
}

/** Một dịch vụ bệnh nhân đã tick; giá và thời lượng chỉ để hiển thị, server tính lại khi đặt. */
export interface SelectedService {
  serviceId: number;
  name: string;
  price: number;
  durationMinutes: number;
}

/** Ca đã chọn. `startTime` cũng là appointment_time gửi lên. */
export interface SelectedShift {
  name: string;
  /** 'HH:mm:ss'. */
  startTime: string;
  /** 'HH:mm:ss'. */
  endTime: string;
}

export interface BookingState {
  currentStep: number;
  selectedDoctor: BookingDoctor | null;
  /** Hồ sơ bệnh nhân được đặt lịch cho; bắt buộc khi gọi POST /api/patient/appointments. */
  selectedPatientId: number | null;
  /** 'yyyy-MM-dd'. */
  selectedDate: string;
  selectedShift: SelectedShift | null;
  /** Theo thứ tự tick; dịch vụ đầu tiên là dịch vụ chính của lượt khám. */
  selectedServices: SelectedService[];
  reasonForVisit: string;
  patientInfo: PatientInfo;
}
