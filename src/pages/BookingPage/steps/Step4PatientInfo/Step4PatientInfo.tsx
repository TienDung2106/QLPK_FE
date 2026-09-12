import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, BarChart2, Loader2 } from 'lucide-react';
import type { PatientInfo } from '../../../../types/booking';
import { apiGetMyProfiles } from '../../../../api/functions/patients';
import type { PatientProfile } from '../../../../api/types';
import './Step4PatientInfo.css';

interface Step4PatientInfoProps {
  patientInfo: PatientInfo;
  selectedPatientId: number | null;
  reasonForVisit: string;
  /** Gọi khi người dùng chọn một hồ sơ: mang theo cả id lẫn thông tin để điền sẵn biểu mẫu. */
  onSelectPatient: (patientId: number, info: PatientInfo) => void;
  onUpdatePatientInfo: (info: Partial<PatientInfo>) => void;
  onChangeReason: (reason: string) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
}

const RELATIONSHIP_LABEL: Record<string, string> = {
  self: 'Tôi là người đi khám',
  child: 'Con',
  parent: 'Bố / mẹ',
  spouse: 'Vợ / chồng',
  other: 'Người thân khác',
};

/** PatientProfile của API → phần thông tin biểu mẫu đặt lịch hiển thị. */
function toPatientInfo(profile: PatientProfile): PatientInfo {
  return {
    fullName: profile.full_name,
    phone: profile.account_phone_number,
    email: profile.account_email ?? '',
    gender: (profile.gender as PatientInfo['gender']) ?? 'other',
    birthDate: profile.date_of_birth ?? '',
    address: profile.address ?? '',
    notes: profile.allergy_notes ?? '',
  };
}

export const Step4PatientInfo: React.FC<Step4PatientInfoProps> = ({
  patientInfo,
  selectedPatientId,
  reasonForVisit,
  onSelectPatient,
  onUpdatePatientInfo,
  onChangeReason,
  onPrevStep,
  onNextStep,
}) => {
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await apiGetMyProfiles();

      if (cancelled) {
        return;
      }

      if (!result.ok || !result.data) {
        setError(result.error);
      } else {
        setProfiles(result.data);

        // Hồ sơ đầu tiên là hồ sơ sinh ra cùng tài khoản lúc đăng ký — chọn sẵn nó, để
        // người đặt cho chính mình không phải thao tác gì thêm.
        const first = result.data[0];
        if (first && selectedPatientId === null) {
          onSelectPatient(first.patient_id, toPatientInfo(first));
        }
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // Chạy đúng một lần lúc mount: đây là lượt nạp hồ sơ ban đầu, không phải thứ phải chạy
    // lại mỗi khi người dùng đổi lựa chọn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="step4-container">
        <h2 className="step4-main-heading">BƯỚC 4: THÔNG TIN KHÁCH HÀNG</h2>
        <div className="full-page-loader">
          <Loader2 className="full-page-loader-icon" size={28} />
          <span>Đang tải hồ sơ của bạn...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="step4-container">
      {/* ── Main Step Heading ── */}
      <h2 className="step4-main-heading">BƯỚC 4: THÔNG TIN KHÁCH HÀNG</h2>

      {/* ── Sub-heading Callout Banner ── */}
      <div className="step4-callout-banner">
        <p>Vui lòng nhập đầy đủ và chính xác thông tin để chúng tôi phục vụ bạn tốt nhất.</p>
      </div>

      {error && (
        <div className="account-alert error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Form Card 1: 1. Thông tin người khám ── */}
      <div className="step4-card">
        <h3 className="step4-card-title">1. Thông tin người khám</h3>

        {/* Một tài khoản có thể giữ nhiều hồ sơ; mỗi lịch hẹn gắn với đúng một hồ sơ. */}
        <div className="step4-radio-target-group">
          {profiles.map((profile) => (
            <label key={profile.patient_id} className="step4-radio-label">
              <input
                type="radio"
                name="patientProfile"
                value={profile.patient_id}
                checked={selectedPatientId === profile.patient_id}
                onChange={() => onSelectPatient(profile.patient_id, toPatientInfo(profile))}
                className="step4-radio-input"
              />
              <span>
                {RELATIONSHIP_LABEL[profile.relationship_to_account] ??
                  profile.relationship_to_account}
                {profile.relationship_to_account !== 'self' && ` — ${profile.full_name}`}
              </span>
            </label>
          ))}
        </div>

        {/* Form Fields Grid */}
        <div className="step4-form-grid">
          {/* Full Name */}
          <div className="step4-form-group">
            <label className="step4-input-label" htmlFor="step4-name">
              Họ và tên <span className="req-star">*</span>
            </label>
            <input
              id="step4-name"
              type="text"
              className="step4-text-input"
              value={patientInfo.fullName}
              onChange={(event) => onUpdatePatientInfo({ fullName: event.target.value })}
              placeholder="Nhập họ và tên"
            />
          </div>

          {/* Phone — thuộc tài khoản đăng nhập, không sửa ở đây được. */}
          <div className="step4-form-group">
            <label className="step4-input-label" htmlFor="step4-phone">
              Số điện thoại
            </label>
            <input
              id="step4-phone"
              type="tel"
              className="step4-text-input"
              value={patientInfo.phone}
              readOnly
            />
            <p className="step4-field-hint">Số của tài khoản đăng nhập, đổi trong mục Hồ sơ.</p>
          </div>

          {/* Birth Date */}
          <div className="step4-form-group">
            <label className="step4-input-label" htmlFor="step4-dob">
              Ngày sinh
            </label>
            <input
              id="step4-dob"
              type="date"
              className="step4-text-input"
              value={patientInfo.birthDate}
              onChange={(event) => onUpdatePatientInfo({ birthDate: event.target.value })}
            />
          </div>

          {/* Gender */}
          <div className="step4-form-group">
            <label className="step4-input-label">Giới tính</label>
            <div className="gender-radio-group">
              <label className="step4-radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={patientInfo.gender === 'male'}
                  onChange={() => onUpdatePatientInfo({ gender: 'male' })}
                  className="step4-radio-input"
                />
                <span>Nam</span>
              </label>
              <label className="step4-radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={patientInfo.gender === 'female'}
                  onChange={() => onUpdatePatientInfo({ gender: 'female' })}
                  className="step4-radio-input"
                />
                <span>Nữ</span>
              </label>
            </div>
          </div>

          {/* Email — cũng thuộc tài khoản. */}
          <div className="step4-form-group">
            <label className="step4-input-label" htmlFor="step4-email">
              Email
            </label>
            <input
              id="step4-email"
              type="email"
              className="step4-text-input"
              value={patientInfo.email}
              readOnly
            />
          </div>

          {/* Address */}
          <div className="step4-form-group">
            <label className="step4-input-label" htmlFor="step4-address">
              Địa chỉ
            </label>
            <input
              id="step4-address"
              type="text"
              className="step4-text-input"
              value={patientInfo.address}
              onChange={(event) => onUpdatePatientInfo({ address: event.target.value })}
              placeholder="Nhập địa chỉ liên hệ"
            />
          </div>

          {/* Allergy notes */}
          <div className="step4-form-group full-width">
            <label className="step4-input-label" htmlFor="step4-notes">
              Dị ứng / lưu ý bệnh lý
            </label>
            <input
              id="step4-notes"
              type="text"
              className="step4-text-input"
              value={patientInfo.notes}
              onChange={(event) => onUpdatePatientInfo({ notes: event.target.value })}
              placeholder="Ví dụ: Dị ứng thuốc penicillin, da nhạy cảm..."
            />
            <p className="step4-field-hint">
              Lưu vào hồ sơ ở mục Hồ sơ của tôi; bác sĩ đọc trước khi kê đơn.
            </p>
          </div>
        </div>
      </div>

      {/* ── Form Card 2: lý do khám, đi kèm lịch hẹn ── */}
      <div className="step4-card">
        <h3 className="step4-card-title">2. Lý do khám</h3>

        <div className="step4-form-group full-width">
          <label className="step4-input-label font-normal" htmlFor="step4-reason">
            Mô tả ngắn triệu chứng hoặc mong muốn của bạn
          </label>
          <textarea
            id="step4-reason"
            className="step4-text-input step4-textarea"
            rows={3}
            value={reasonForVisit}
            onChange={(event) => onChangeReason(event.target.value)}
            placeholder="Ví dụ: Mụn viêm vùng má hai bên khoảng 3 tháng nay, đã dùng thuốc bôi nhưng không đỡ."
          />
        </div>
      </div>

      {/* ── Privacy Note Banner ── */}
      <div className="step4-privacy-note">
        <BarChart2 size={15} className="privacy-icon" />
        <p>
          <strong>Lưu ý:</strong> Mọi thông tin của bạn sẽ được bảo mật tuyệt đối và chỉ sử dụng cho
          mục đích đặt lịch khám trực tuyến.
        </p>
      </div>

      {/* ── Bottom Action Buttons ── */}
      <div className="step4-bottom-actions">
        <button type="button" className="btn-back-step" onClick={onPrevStep}>
          <ArrowLeft size={15} />
          <span>Quay lại</span>
        </button>
        <button
          type="button"
          className="btn-next-step"
          onClick={onNextStep}
          disabled={selectedPatientId === null || patientInfo.fullName.trim().length < 2}
        >
          <span>Tiếp tục</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};
