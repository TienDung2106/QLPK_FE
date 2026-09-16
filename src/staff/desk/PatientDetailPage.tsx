import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarPlus, Link2, Save } from 'lucide-react';
import { apiGetDeskPatient, apiLinkPatientAccount, apiUpdateDeskPatient } from '../../api/functions/desk';
import { useAction, useApiQuery } from '../hooks';
import { formatDate, formatDateTime, formatTime } from '../format';
import { APPOINTMENT_STATUS, labelOf, PATIENT_CREATED_VIA_LABEL, PATIENT_RELATIONSHIP_LABEL, textOf } from '../labels';
import { useToast } from '../components/toastContext';
import { Alert, Badge, Button, EmptyState, Field, PageHeader, Panel, Sheet, StatusBadge } from '../components/ui';
import { PatientFields } from './PatientFields';
import { emptyPatientForm, patientPayload, patientToForm } from './patientFormValue';
import type { PatientFormValue } from './patientFormValue';

const PatientDetailPage = () => {
  const patientId = Number(useParams().patientId);
  const navigate = useNavigate();
  const toast = useToast();
  const { run, isPending } = useAction();
  const query = useApiQuery(() => apiGetDeskPatient(patientId), [patientId]);
  const patient = query.data;
  const [form, setForm] = useState<PatientFormValue>(emptyPatientForm);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkRelationship, setLinkRelationship] = useState('self');
  const [linkError, setLinkError] = useState<string | null>(null);

  // Hồ sơ mới về (lần đầu hoặc sau khi lưu) thì nạp lại form, ngay trong lượt render.
  const [formSource, setFormSource] = useState<typeof patient>(null);
  if (patient && patient !== formSource) {
    setFormSource(patient);
    setForm(patientToForm(patient));
    setDirty(false);
  }

  const save = async () => {
    const payload = patientPayload(form);
    if (typeof payload === 'string') {
      setError(payload);
      return;
    }
    // Số điện thoại gắn với tài khoản; API sửa hồ sơ không nhận trường này.
    const { phone_number: _ignored, ...update } = payload;
    void _ignored;
    const result = await run('save', () => apiUpdateDeskPatient(patientId, update));
    if (result.ok && result.data) {
      setError(null);
      query.setData(result.data);
      toast.success('Đã lưu hồ sơ bệnh nhân.');
    } else {
      setError(result.error);
    }
  };

  if (!patient) {
    return (
      <>
        <PageHeader title={query.loading ? 'Đang tải hồ sơ…' : `Bệnh nhân #${patientId}`} backTo="/thu-ngan/benh-nhan" backLabel="Bệnh nhân" />
        {query.error && <Alert tone="danger">{query.error}</Alert>}
      </>
    );
  }

  const linkAccount = async () => {
    if (!linkEmail.trim()) {
      setLinkError('Nhập email tài khoản bệnh nhân đã đăng ký.');
      return;
    }
    const result = await run('link', () =>
      apiLinkPatientAccount(patientId, { account_email: linkEmail.trim(), relationship_to_account: linkRelationship }),
    );
    if (!result.ok || !result.data) {
      setLinkError(result.error);
      return;
    }
    setLinkOpen(false);
    query.setData(result.data);
    toast.success(`Đã chuyển hồ sơ sang tài khoản ${linkEmail.trim()}.`);
  };

  return (
    <>
      <PageHeader
        backTo="/thu-ngan/benh-nhan"
        backLabel="Bệnh nhân"
        title={patient.full_name}
        description={
          <>
            <span className="st-mono">{patient.patient_code}</span> · {textOf(PATIENT_CREATED_VIA_LABEL, patient.created_via)} ·{' '}
            {patient.account_claimed ? 'đã kích hoạt tài khoản' : 'chưa kích hoạt tài khoản'} · tạo {formatDateTime(patient.created_at)}
          </>
        }
        actions={
          <>
            {!patient.account_claimed && (
              <Button
                icon={<Link2 size={16} />}
                onClick={() => {
                  setLinkEmail('');
                  setLinkRelationship('self');
                  setLinkError(null);
                  setLinkOpen(true);
                }}
              >
                Liên kết tài khoản
              </Button>
            )}
            <Button icon={<CalendarPlus size={16} />} onClick={() => navigate('/thu-ngan/dat-lich')}>
              Đặt lịch
            </Button>
            <Button variant="primary" icon={<Save size={16} />} loading={isPending('save')} disabled={!dirty} onClick={save}>
              Lưu hồ sơ
            </Button>
          </>
        }
      />

      {!patient.account_email && (
        <Alert tone="warning" className="st-alert-gap">
          Hồ sơ chưa có email — bệnh nhân sẽ không tự lấy lại mật khẩu để dùng tài khoản được. Hỏi và bổ sung email khi có thể.
        </Alert>
      )}
      {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}

      <div className="st-grid-main">
        <Panel title="Hồ sơ" subtitle={dirty ? 'Có thay đổi chưa lưu' : undefined}>
          <PatientFields
            registering={false}
            value={form}
            onChange={(value) => {
              setForm(value);
              setDirty(true);
            }}
          />
        </Panel>

        <div className="st-stack">
          <Panel title="Liên hệ tài khoản">
            <dl className="st-dl">
              <dt>Điện thoại</dt>
              <dd>{patient.account_phone_number ?? '—'}</dd>
              <dt>Email</dt>
              <dd>{patient.account_email ?? '—'}</dd>
              <dt>Quan hệ</dt>
              <dd>{patient.relationship_to_account === 'self' ? 'Chủ tài khoản' : patient.relationship_to_account}</dd>
              <dt>Kích hoạt</dt>
              <dd>{patient.account_claimed ? <Badge tone="success">Đã kích hoạt</Badge> : <Badge tone="warning">Chưa</Badge>}</dd>
            </dl>
          </Panel>

          <Panel title="Lịch hẹn gần đây" bodyless>
            {patient.recent_appointments.length === 0 ? (
              <EmptyState title="Chưa có lịch hẹn" />
            ) : (
              <table className="st-table">
                <tbody>
                  {patient.recent_appointments.map((appointment) => (
                    <tr key={appointment.appointment_id}>
                      <td>
                        <Link to={`/thu-ngan/lich-hen/${appointment.appointment_id}`} className="st-cell-main" style={{ color: 'var(--primary)' }}>
                          {formatDate(appointment.appointment_date)} · {formatTime(appointment.appointment_time)}
                        </Link>
                        <div className="st-cell-sub">Bác sĩ: {appointment.doctor_full_name}</div>
                      </td>
                      <td className="st-num">
                        <StatusBadge value={labelOf(APPOINTMENT_STATUS, appointment.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      </div>
      <Sheet
        open={linkOpen}
        title="Liên kết với tài khoản bệnh nhân"
        subtitle="Chuyển hồ sơ tạo tại quầy sang tài khoản bệnh nhân đã tự đăng ký, để lịch sử khám không bị tách đôi."
        onClose={() => setLinkOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setLinkOpen(false)}>
              Huỷ
            </Button>
            <Button variant="primary" loading={isPending('link')} onClick={linkAccount}>
              Liên kết
            </Button>
          </>
        }
      >
        {linkError && <Alert tone="danger" className="st-alert-gap">{linkError}</Alert>}
        <Alert tone="info" className="st-alert-gap">
          Chỉ liên kết được hồ sơ chưa từng đăng nhập. Tài khoản đích đã có hồ sơ “Bản thân” thì chọn quan hệ khác.
        </Alert>
        <div className="st-form-grid">
          <Field label="Email tài khoản bệnh nhân" required className="st-span-2">
            {(id) => <input id={id} type="email" className="st-input" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} />}
          </Field>
          <Field label="Hồ sơ này là của" required className="st-span-2">
            {(id) => (
              <select id={id} className="st-select" value={linkRelationship} onChange={(e) => setLinkRelationship(e.target.value)}>
                {Object.entries(PATIENT_RELATIONSHIP_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label} của chủ tài khoản
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      </Sheet>
    </>
  );
};

export default PatientDetailPage;
