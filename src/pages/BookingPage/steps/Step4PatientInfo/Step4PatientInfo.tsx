import React, { useState } from 'react';
import { Calendar, ArrowLeft, ArrowRight, BarChart2 } from 'lucide-react';
import type { PatientInfo } from '../../../../types/booking';
import './Step4PatientInfo.css';

interface Step4PatientInfoProps {
  patientInfo?: PatientInfo;
  onUpdatePatientInfo?: (info: Partial<PatientInfo>) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
}

export const Step4PatientInfo: React.FC<Step4PatientInfoProps> = ({
  patientInfo,
  onUpdatePatientInfo,
  onPrevStep,
  onNextStep,
}) => {
  const [bookingFor, setBookingFor] = useState<'self' | 'other'>('self');
  const [fullName, setFullName] = useState(patientInfo?.fullName || 'Nguyễn Thị Hoa');
  const [phone, setPhone] = useState(patientInfo?.phone || '0912 345 678');
  const [birthDate, setBirthDate] = useState(patientInfo?.birthDate || '25/08/1995');
  const [gender, setGender] = useState<'male' | 'female'>(patientInfo?.gender || 'female');
  const [email, setEmail] = useState(patientInfo?.email || '');
  const [address, setAddress] = useState(patientInfo?.address || '');
  const [notes, setNotes] = useState(patientInfo?.notes || '');
  const [hasVisited, setHasVisited] = useState<'never' | 'visited'>('never');
  const [source, setSource] = useState('');

  const handleNext = () => {
    onUpdatePatientInfo?.({
      fullName,
      phone,
      birthDate,
      gender,
      email,
      address,
      notes,
    });
    onNextStep();
  };

  return (
    <div className="step4-container">
      {/* ── Main Step Heading ── */}
      <h2 className="step4-main-heading">BƯỚC 4: THÔNG TIN KHÁCH HÀNG</h2>

      {/* ── Sub-heading Callout Banner ── */}
      <div className="step4-callout-banner">
        <p>Vui lòng nhập đầy đủ và chính xác thông tin để chúng tôi phục vụ bạn tốt nhất.</p>
      </div>

      {/* ── Form Card 1: 1. Thông tin người khám ── */}
      <div className="step4-card">
        <h3 className="step4-card-title">1. Thông tin người khám</h3>

        {/* Radio Target: Self vs Other */}
        <div className="step4-radio-target-group">
          <label className="step4-radio-label">
            <input
              type="radio"
              name="bookingFor"
              value="self"
              checked={bookingFor === 'self'}
              onChange={() => setBookingFor('self')}
              className="step4-radio-input"
            />
            <span>Tôi là người đi khám</span>
          </label>
          <label className="step4-radio-label">
            <input
              type="radio"
              name="bookingFor"
              value="other"
              checked={bookingFor === 'other'}
              onChange={() => setBookingFor('other')}
              className="step4-radio-input"
            />
            <span>Đặt lịch cho người khác</span>
          </label>
        </div>

        {/* Form Fields Grid */}
        <div className="step4-form-grid">
          {/* Full Name */}
          <div className="step4-form-group">
            <label className="step4-input-label">
              Họ và tên <span className="req-star">*</span>
            </label>
            <input
              type="text"
              className="step4-text-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên"
            />
          </div>

          {/* Phone */}
          <div className="step4-form-group">
            <label className="step4-input-label">
              Số điện thoại <span className="req-star">*</span>
            </label>
            <input
              type="tel"
              className="step4-text-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
            />
          </div>

          {/* Birth Date */}
          <div className="step4-form-group">
            <label className="step4-input-label">
              Ngày sinh <span className="req-star">*</span>
            </label>
            <div className="input-with-icon-wrapper">
              <input
                type="text"
                className="step4-text-input"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                placeholder="DD/MM/YYYY"
              />
              <Calendar size={16} className="input-right-icon" />
            </div>
          </div>

          {/* Gender */}
          <div className="step4-form-group">
            <label className="step4-input-label">
              Giới tính <span className="req-star">*</span>
            </label>
            <div className="gender-radio-group">
              <label className="step4-radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={() => setGender('male')}
                  className="step4-radio-input"
                />
                <span>Nam</span>
              </label>
              <label className="step4-radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={() => setGender('female')}
                  className="step4-radio-input"
                />
                <span>Nữ</span>
              </label>
            </div>
          </div>

          {/* Email */}
          <div className="step4-form-group">
            <label className="step4-input-label">Email (Không bắt buộc)</label>
            <input
              type="email"
              className="step4-text-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email"
            />
          </div>

          {/* Address */}
          <div className="step4-form-group">
            <label className="step4-input-label">Địa chỉ</label>
            <input
              type="text"
              className="step4-text-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Nhập địa chỉ liên hệ"
            />
          </div>

          {/* Medical Notes (Full width) */}
          <div className="step4-form-group full-width">
            <label className="step4-input-label">Ghi chú về bệnh lý (Nếu có)</label>
            <input
              type="text"
              className="step4-text-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Dị ứng thuốc, bệnh lý bẩm sinh, mong muốn điều trị..."
            />
          </div>
        </div>
      </div>

      {/* ── Form Card 2: 2. Thông tin bổ sung ── */}
      <div className="step4-card">
        <h3 className="step4-card-title">2. Thông tin bổ sung</h3>

        <div className="step4-form-grid">
          {/* Visited before */}
          <div className="step4-form-group">
            <label className="step4-input-label font-normal">
              Bạn đã từng khám tại phòng khám chưa?
            </label>
            <div className="gender-radio-group">
              <label className="step4-radio-label">
                <input
                  type="radio"
                  name="hasVisited"
                  value="never"
                  checked={hasVisited === 'never'}
                  onChange={() => setHasVisited('never')}
                  className="step4-radio-input"
                />
                <span>Chưa từng</span>
              </label>
              <label className="step4-radio-label">
                <input
                  type="radio"
                  name="hasVisited"
                  value="visited"
                  checked={hasVisited === 'visited'}
                  onChange={() => setHasVisited('visited')}
                  className="step4-radio-input"
                />
                <span>Đã từng</span>
              </label>
            </div>
          </div>

          {/* Referral source */}
          <div className="step4-form-group">
            <label className="step4-input-label font-normal">Nguồn biết đến phòng khám</label>
            <div className="select-dropdown-wrapper">
              <select
                className="step4-select"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="">Chọn nguồn</option>
                <option value="facebook">Facebook / Mạng xã hội</option>
                <option value="friend">Người thân giới thiệu</option>
                <option value="google">Google Tìm kiếm</option>
                <option value="signboard">Biển hiệu phòng khám</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>
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
        <button type="button" className="btn-next-step" onClick={handleNext}>
          <span>Tiếp tục</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};
