import React from 'react';
import type { DoctorItem } from '../../types';

interface DoctorsSectionProps {
  onSelectDoctor?: (doctor: DoctorItem) => void;
}

const doctorsList: DoctorItem[] = [
  {
    id: 'doc-1',
    name: 'BS. Nguyễn Thị A',
    specialty: 'Chuyên khoa Da liễu & Thẩm mỹ',
    image:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'doc-2',
    name: 'BS. Nguyễn Thị D',
    specialty: 'Chuyên khoa Điều trị Laser',
    image:
      'https://images.unsplash.com/photo-1594824813515-78335025d2c4?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'doc-3',
    name: 'BS. Nguyễn Tiến B',
    specialty: 'Chuyên khoa Da liễu tổng quát',
    image:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'doc-4',
    name: 'BS. Nguyễn Văn C',
    specialty: 'Chuyên khoa Phục hồi da chuyên sâu',
    image:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
  },
];

export const DoctorsSection: React.FC<DoctorsSectionProps> = ({ onSelectDoctor }) => {
  return (
    <section id="doctors" className="doctors-section">
      <div className="container doctors-container">
        {/* Section Heading */}
        <div className="section-header-centered">
          <h2 className="section-main-title">Đội ngũ bác sĩ</h2>
          <p className="section-main-subtitle">
            Những chuyên gia da liễu hàng đầu
          </p>
        </div>

        {/* 3-Column Doctor Layout */}
        <div className="doctors-layout-grid">
          {/* Column 1: Stacked 2 Cards */}
          <div className="doctors-col-stacked">
            {/* Stacked Card 1 */}
            <div
              className="doctor-card doctor-card-small"
              onClick={() => onSelectDoctor?.(doctorsList[0])}
            >
              <div className="doctor-img-wrapper small-img">
                <img
                  src={doctorsList[0].image}
                  alt={doctorsList[0].name}
                  className="doctor-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              </div>
              <div className="doctor-info">
                <h3 className="doctor-name">{doctorsList[0].name}</h3>
                <p className="doctor-specialty">{doctorsList[0].specialty}</p>
              </div>
            </div>

            {/* Stacked Card 2 */}
            <div
              className="doctor-card doctor-card-small"
              onClick={() => onSelectDoctor?.(doctorsList[1])}
            >
              <div className="doctor-img-wrapper small-img">
                <img
                  src={doctorsList[1].image}
                  alt={doctorsList[1].name}
                  className="doctor-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1594824813515-78335025d2c4?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              </div>
              <div className="doctor-info">
                <h3 className="doctor-name">{doctorsList[1].name}</h3>
                <p className="doctor-specialty">{doctorsList[1].specialty}</p>
              </div>
            </div>
          </div>

          {/* Column 2: Tall Card (BS. Nguyễn Tiến B) */}
          <div className="doctors-col-tall">
            <div
              className="doctor-card doctor-card-tall"
              onClick={() => onSelectDoctor?.(doctorsList[2])}
            >
              <div className="doctor-img-wrapper tall-img">
                <img
                  src={doctorsList[2].image}
                  alt={doctorsList[2].name}
                  className="doctor-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              </div>
              <div className="doctor-info">
                <h3 className="doctor-name">{doctorsList[2].name}</h3>
                <p className="doctor-specialty">{doctorsList[2].specialty}</p>
              </div>
            </div>
          </div>

          {/* Column 3: Tall Card (BS. Nguyễn Văn C) */}
          <div className="doctors-col-tall">
            <div
              className="doctor-card doctor-card-tall"
              onClick={() => onSelectDoctor?.(doctorsList[3])}
            >
              <div className="doctor-img-wrapper tall-img">
                <img
                  src={doctorsList[3].image}
                  alt={doctorsList[3].name}
                  className="doctor-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              </div>
              <div className="doctor-info">
                <h3 className="doctor-name">{doctorsList[3].name}</h3>
                <p className="doctor-specialty">{doctorsList[3].specialty}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
