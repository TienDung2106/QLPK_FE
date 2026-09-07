import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  Calendar,
  Headphones,
  Clock,
  Info,
  Star,
  Check,
  BookOpen,
  Lock,
} from 'lucide-react';
import './BookingTrustBadges.css';

interface BookingTrustBadgesProps {
  currentStep?: number;
}

const defaultTrustBadges = [
  {
    icon: <ShieldCheck size={20} />,
    title: 'Bảo mật thông tin',
    description: 'Thông tin của bạn luôn được bảo mật tuyệt đối',
  },
  {
    icon: <UserCheck size={20} />,
    title: 'Bác sĩ chuyên môn cao',
    description: 'Nhận các lời khuyên từ bác sĩ da liễu đầu ngành',
  },
  {
    icon: <Calendar size={20} />,
    title: 'Lịch hẹn linh hoạt',
    description: 'Dễ dàng thay đổi hoặc hủy lịch hẹn',
  },
  {
    icon: <Headphones size={20} />,
    title: 'Hỗ trợ tận tâm',
    description: 'Đội ngũ nhân viên luôn hỗ trợ bạn 24/7',
  },
];

const step2Badges = [
  {
    icon: <Clock size={20} />,
    title: 'Giờ làm việc',
    description: '08:00 - 17:30 (Thứ 2 - Thứ 7)',
  },
  {
    icon: <Info size={20} />,
    title: 'Thời gian khám',
    description: 'Khoảng 30 - 60 phút/ca khám',
  },
  {
    icon: <Star size={20} />,
    title: 'Lưu ý',
    description: 'Vui lòng đến trước giờ hẹn 10-15 phút',
  },
];

const step4Badges = [
  {
    icon: <Check size={18} strokeWidth={2.5} />,
    title: 'Bảo mật thông tin',
    description: 'Thông tin cá nhân được bảo mật tối đa tuyệt đối',
  },
  {
    icon: <Clock size={18} />,
    title: 'Xác nhận nhanh chóng',
    description: 'Xử lý & phản hồi yêu cầu đặt lịch trong vòng 1 phút',
  },
  {
    icon: <Calendar size={18} />,
    title: 'Lịch hẹn linh hoạt',
    description: 'Dễ dàng thay đổi hoặc hủy lịch khám theo yêu cầu',
  },
  {
    icon: <BookOpen size={18} />,
    title: 'Chăm sóc tận tâm',
    description: 'Đội ngũ nhân viên luôn sẵn sàng giải đáp 24/7',
  },
];

const step5Badges = [
  {
    icon: <Lock size={18} />,
    title: 'Bảo mật thông tin',
    description: 'Thông tin cá nhân bảo mật tuyệt đối',
  },
  {
    icon: <Clock size={18} />,
    title: 'Xác nhận nhanh chóng',
    description: 'Nhận kết quả đặt lịch trong vòng 5 phút',
  },
  {
    icon: <Calendar size={18} />,
    title: 'Lịch hẹn linh hoạt',
    description: 'Dễ dàng thay đổi hoặc hủy lịch hẹn',
  },
  {
    icon: <Headphones size={18} />,
    title: 'Chăm sóc tận tâm',
    description: 'Đội ngũ chuyên gia luôn sẵn sàng hỗ trợ',
  },
];

export const BookingTrustBadges: React.FC<BookingTrustBadgesProps> = ({ currentStep = 1 }) => {
  const isStep2 = currentStep === 2;
  const items =
    isStep2
      ? step2Badges
      : currentStep === 4
        ? step4Badges
        : currentStep === 5
          ? step5Badges
          : defaultTrustBadges;

  return (
    <div className="booking-trust-section">
      <div className={`container booking-trust-grid ${isStep2 ? 'grid-3-cols' : ''}`}>
        {items.map((item, idx) => (
          <div key={idx} className="trust-badge-item">
            <div className="trust-icon-circle">{item.icon}</div>
            <div className="trust-text-group">
              <h4 className="trust-title">{item.title}</h4>
              <p className="trust-desc">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
