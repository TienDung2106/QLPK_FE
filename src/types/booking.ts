/* ============================================================
   BOOKING FLOW — SHARED TYPE DEFINITIONS
   ============================================================ */

export interface BookingDoctor {
  id: string;
  name: string;
  specialty: string;
  specialtyId?: string;
  rating?: number;
  reviewCount?: number;
  experienceYears?: number;
  gender?: 'male' | 'female';
  hasAvailableSlot?: boolean;
  avatar?: string;
  price?: number;
}

export interface PatientInfo {
  fullName: string;
  phone: string;
  email: string;
  gender: 'male' | 'female';
  birthDate: string;
  address: string;
  notes: string;
}

export interface BookingState {
  currentStep: number;
  selectedDoctor: BookingDoctor | null;
  selectedDate: string;
  selectedTime: string;
  selectedService: string;
  servicePrice: number;
  discountCode: string;
  discountAmount?: number;
  patientInfo: PatientInfo;
}
