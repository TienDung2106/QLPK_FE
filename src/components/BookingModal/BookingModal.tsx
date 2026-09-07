import React, { useState } from 'react';
import { X, Calendar, Clock, User, Phone, CheckCircle, Stethoscope } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    service: 'KhamDaLieuTongQuat',
    doctor: 'bs-truong',
    date: '',
    time: '09:00',
    notes: '',
  });

  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      // Auto close after 2.5s if desired or let user close
    }, 2500);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleResetAndClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          className="modal-close-btn"
          onClick={handleResetAndClose}
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        {isSuccess ? (
          <div className="modal-success-state">
            <div className="success-icon-box">
              <CheckCircle size={56} className="success-icon" />
            </div>
            <h3 className="success-title">Đặt lịch hẹn thành công!</h3>
            <p className="success-desc">
              Cảm ơn quý khách <strong>{formData.fullName || 'bạn'}</strong>. Phòng khám Da Liễu đã tiếp nhận thông tin và sẽ gọi điện xác nhận trong vòng 15 phút.
            </p>
            <div className="success-details-summary">
              <div><strong>Số điện thoại:</strong> {formData.phone}</div>
              <div><strong>Ngày hẹn:</strong> {formData.date || 'Hôm nay'} ({formData.time})</div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleResetAndClose}
              style={{ marginTop: '1.5rem', width: '100%' }}
            >
              Hoàn tất
            </button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <div className="modal-badge">
                <Calendar size={15} />
                <span>Đặt lịch khám trực tuyến</span>
              </div>
              <h3 className="modal-title">Đăng ký khám Da Liễu</h3>
              <p className="modal-subtitle">
                Vui lòng điền đầy đủ thông tin để được đội ngũ bác sĩ hỗ trợ nhanh nhất
              </p>
            </div>

            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-group">
                <label className="form-label">
                  <User size={16} /> Họ và tên bệnh nhân *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="form-input"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone size={16} /> Số điện thoại liên hệ *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0912 345 678"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <Stethoscope size={16} /> Dịch vụ khám
                  </label>
                  <select
                    className="form-select"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  >
                    <option value="KhamDaLieuTongQuat">Khám da liễu tổng quát</option>
                    <option value="DieuTriMun">Điều trị mụn & sẹo rỗ</option>
                    <option value="TreHoaDa">Trẻ hóa & phục hồi da</option>
                    <option value="LaserThamMy">Laser thẩm mỹ công nghệ cao</option>
                    <option value="BenhLyDa">Điều trị bệnh lý da liễu</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Calendar size={16} /> Ngày khám
                  </label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock size={16} /> Khung giờ khám mong muốn
                </label>
                <select
                  className="form-select"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                >
                  <option value="08:30">08:30 - 09:30 (Sáng)</option>
                  <option value="09:30">09:30 - 10:30 (Sáng)</option>
                  <option value="10:30">10:30 - 11:30 (Sáng)</option>
                  <option value="13:30">13:30 - 14:30 (Chiều)</option>
                  <option value="14:30">14:30 - 15:30 (Chiều)</option>
                  <option value="15:30">15:30 - 16:30 (Chiều)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tình trạng da / Ghi chú</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả triệu chứng hoặc lưu ý đặc biệt (nếu có)..."
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-submit-booking">
                Xác nhận đặt lịch ngay
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
