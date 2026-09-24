import { useEffect, useState } from 'react';
import { apiGetDoctorAttachmentContent, apiGetDoctorAttachments } from '../../api/functions/doctorWork';
import { openFile } from '../../api/helpers';
import type { AppointmentAttachment, AppointmentListItem } from '../../api/types';
import { useApiQuery } from '../hooks';
import { formatDate, formatTime } from '../format';
import { Alert, Sheet } from '../components/ui';

interface Props {
  /** Lịch đang xem; null là sheet đóng. */
  appointment: AppointmentListItem | null;
  onClose: () => void;
}

/** Lý do khám và ảnh bệnh nhân gửi kèm lúc đặt lịch, để bác sĩ xem trước khi khám. */
export const VisitReasonSheet = ({ appointment, onClose }: Props) =>
  appointment ? <VisitReasonSheetBody appointment={appointment} onClose={onClose} /> : null;

const VisitReasonSheetBody = ({ appointment, onClose }: { appointment: AppointmentListItem; onClose: () => void }) => {
  const attachments = useApiQuery(() => apiGetDoctorAttachments(appointment.appointment_id), [appointment.appointment_id]);
  const photos = attachments.data ?? [];
  const reason = appointment.reason_for_visit;

  return (
    <Sheet
      open
      title={appointment.patient_full_name}
      subtitle={`${formatDate(appointment.appointment_date)} lúc ${formatTime(appointment.appointment_time)} · Lượt khám #${appointment.appointment_id}`}
      onClose={onClose}
    >
      <div className="st-stack">
        <div>
          <div className="st-label" style={{ marginBottom: 6 }}>
            Lý do khám
          </div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }} className={reason ? undefined : 'st-muted'}>
            {reason || 'Bệnh nhân không ghi lý do.'}
          </p>
        </div>
        <div>
          <div className="st-label" style={{ marginBottom: 6 }}>
            Ảnh bệnh nhân gửi kèm
          </div>
          {attachments.error && <Alert tone="danger">{attachments.error}</Alert>}
          {attachments.loading && <span className="st-muted">Đang tải ảnh…</span>}
          {!attachments.loading && !attachments.error && photos.length === 0 && <span className="st-muted">Không có ảnh.</span>}
          {photos.length > 0 && (
            <div className="st-photo-grid">
              {photos.map((attachment) => (
                <AttachmentThumb key={attachment.attachment_id} appointmentId={appointment.appointment_id} attachment={attachment} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
};

// Ảnh không public: tải kèm token thành blob rồi mới gắn vào <img>.
function AttachmentThumb({ appointmentId, attachment }: { appointmentId: number; attachment: AppointmentAttachment }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    apiGetDoctorAttachmentContent(appointmentId, attachment.attachment_id).then((result) => {
      if (alive && result.data) {
        objectUrl = URL.createObjectURL(result.data.blob);
        setSrc(objectUrl);
      }
    });
    return () => {
      alive = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [appointmentId, attachment.attachment_id]);

  const openFull = async () => {
    const result = await apiGetDoctorAttachmentContent(appointmentId, attachment.attachment_id);
    if (result.data) {
      openFile(result.data, `anh-${attachment.attachment_id}`);
    }
  };

  return (
    <button type="button" className="st-photo-thumb" onClick={openFull} title="Xem ảnh gốc">
      {src ? <img src={src} alt={attachment.body_area ?? 'Ảnh bệnh nhân gửi'} /> : <span className="st-skel" />}
    </button>
  );
}
