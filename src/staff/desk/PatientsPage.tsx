import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { apiRegisterDeskPatient, apiSearchDeskPatients } from '../../api/functions/desk';
import { useAction, useApiQuery, useDebounced } from '../hooks';
import { formatDate } from '../format';
import { GENDER_LABEL, PATIENT_CREATED_VIA_LABEL, textOf } from '../labels';
import { useToast } from '../components/toastContext';
import { Alert, Badge, Button, PageHeader, Pagination, SearchInput, Sheet, TableState } from '../components/ui';
import { PatientFields } from './PatientFields';
import { emptyPatientForm, patientPayload } from './patientFormValue';
import type { PatientFormValue } from './patientFormValue';

const PatientsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { run, isPending } = useAction();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PatientFormValue>(emptyPatientForm);
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounced(search);

  const query = useApiQuery(() => apiSearchDeskPatients({ search: debounced, page_number: page, page_size: 20 }), [debounced, page]);
  const items = query.data?.items ?? [];

  const register = async () => {
    const payload = patientPayload(form);
    if (typeof payload === 'string') {
      setError(payload);
      return;
    }
    if (!payload.email && !payload.phone_number) {
      setError('Cần ít nhất email hoặc số điện thoại để bệnh nhân nhận lại tài khoản sau này.');
      return;
    }
    const result = await run('register', () => apiRegisterDeskPatient(payload));
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    toast.success(`Đã đăng ký bệnh nhân ${result.data.full_name} (${result.data.patient_code}).`);
    setOpen(false);
    setForm(emptyPatientForm);
    navigate(`/thu-ngan/benh-nhan/${result.data.patient_id}`);
  };

  return (
    <>
      <PageHeader
        title="Bệnh nhân"
        description="Tìm hồ sơ, đăng ký bệnh nhân đến quầy lần đầu."
        actions={
          <Button
            variant="primary"
            icon={<UserPlus size={16} />}
            onClick={() => {
              setError(null);
              setOpen(true);
            }}
          >
            Đăng ký bệnh nhân
          </Button>
        }
      />

      <section className="st-panel">
        <div className="st-toolbar">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Tên, mã bệnh nhân, số điện thoại, email, CCCD…"
          />
        </div>
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Bệnh nhân</th>
                <th>Liên hệ</th>
                <th>Ngày sinh</th>
                <th>Giới tính</th>
                <th>Tài khoản</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                columns={5}
                loading={query.loading}
                error={query.error}
                isEmpty={items.length === 0}
                onRetry={query.reload}
                emptyTitle={debounced ? 'Không tìm thấy bệnh nhân' : 'Chưa có bệnh nhân'}
                emptyText={debounced ? 'Kiểm tra lại từ khoá, hoặc đăng ký bệnh nhân mới.' : undefined}
              />
              {items.map((patient) => (
                <tr key={patient.patient_id} className="st-row-link" onClick={() => navigate(`/thu-ngan/benh-nhan/${patient.patient_id}`)}>
                  <td>
                    <div className="st-cell-main">{patient.full_name}</div>
                    <div className="st-cell-sub st-mono">{patient.patient_code}</div>
                  </td>
                  <td>
                    <div>{patient.account_phone_number ?? '—'}</div>
                    <div className="st-cell-sub">{patient.account_email ?? 'Chưa có email'}</div>
                  </td>
                  <td className="st-nowrap">{formatDate(patient.date_of_birth)}</td>
                  <td>{textOf(GENDER_LABEL, patient.gender)}</td>
                  <td>
                    {patient.account_claimed ? (
                      <Badge tone="success">Đã kích hoạt</Badge>
                    ) : (
                      <Badge tone="warning">{textOf(PATIENT_CREATED_VIA_LABEL, patient.created_via)} · chưa kích hoạt</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={query.data} onPage={setPage} />
      </section>

      <Sheet
        wide
        open={open}
        title="Đăng ký bệnh nhân tại quầy"
        subtitle="Quầy không đặt mật khẩu. Bệnh nhân tự nhận tài khoản qua chức năng quên mật khẩu bằng email."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button variant="primary" loading={isPending('register')} onClick={register}>
              Đăng ký
            </Button>
          </>
        }
      >
        {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}
        <PatientFields registering value={form} onChange={setForm} />
      </Sheet>
    </>
  );
};

export default PatientsPage;
