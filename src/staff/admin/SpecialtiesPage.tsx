import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { apiCreateSpecialty, apiDeleteSpecialty, apiListSpecialties, apiUpdateSpecialty } from '../../api/functions/admin';
import type { Specialty } from '../../api/staffTypes';
import { useAction, useApiQuery } from '../hooks';
import { useToast } from '../components/toastContext';
import { Alert, Button, ConfirmDialog, Field, PageHeader, Sheet, TableState } from '../components/ui';

/** Chuyên khoa mà bác sĩ đảm nhận và trang công khai dùng để lọc bác sĩ. */
const SpecialtiesPage = () => {
  const toast = useToast();
  const { run, isPending } = useAction();
  const query = useApiQuery(apiListSpecialties, []);
  const [editing, setEditing] = useState<Specialty | 'new' | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Specialty | null>(null);
  const items = query.data ?? [];

  const open = (row: Specialty | 'new') => {
    setEditing(row);
    setCode(row === 'new' ? '' : row.specialty_code);
    setName(row === 'new' ? '' : row.specialty_name);
    setError(null);
  };

  const save = async () => {
    if (!code.trim() || !name.trim()) {
      setError('Nhập mã và tên chuyên khoa.');
      return;
    }
    const target = editing;
    const payload = { specialty_code: code.trim(), specialty_name: name.trim() };
    const result = await run('save', () =>
      target === 'new' || target === null ? apiCreateSpecialty(payload) : apiUpdateSpecialty(target.specialty_id, payload),
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(null);
    toast.success('Đã lưu chuyên khoa.');
    query.reload();
  };

  const remove = async () => {
    if (!deleting) {
      return;
    }
    const result = await run('delete', () => apiDeleteSpecialty(deleting.specialty_id));
    setDeleting(null);
    if (!result.ok) {
      toast.error(result.status === 409 ? 'Còn bác sĩ thuộc chuyên khoa này nên chưa xoá được.' : result.error);
      return;
    }
    toast.success('Đã xoá chuyên khoa.');
    query.reload();
  };

  return (
    <>
      <PageHeader
        title="Chuyên khoa"
        description="Chuyên khoa gắn với hồ sơ bác sĩ và là bộ lọc trên trang đặt lịch của bệnh nhân."
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => open('new')}>
            Thêm chuyên khoa
          </Button>
        }
      />

      <section className="st-panel">
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th>Tên chuyên khoa</th>
                <th>Mã</th>
                <th className="st-num">Số bác sĩ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <TableState
                columns={4}
                loading={query.loading}
                error={query.error}
                isEmpty={items.length === 0}
                onRetry={query.reload}
                emptyTitle="Chưa có chuyên khoa"
              />
              {items.map((row) => (
                <tr key={row.specialty_id}>
                  <td className="st-cell-main">{row.specialty_name}</td>
                  <td className="st-mono">{row.specialty_code}</td>
                  <td className="st-num">{row.doctor_count}</td>
                  <td className="st-num st-nowrap">
                    <Button size="sm" variant="ghost" icon={<Pencil size={13} />} onClick={() => open(row)}>
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      iconOnly
                      aria-label={`Xoá ${row.specialty_name}`}
                      title={row.doctor_count > 0 ? 'Còn bác sĩ thuộc chuyên khoa này' : undefined}
                      disabled={row.doctor_count > 0}
                      icon={<Trash2 size={14} />}
                      onClick={() => setDeleting(row)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Sheet
        open={editing !== null}
        title={editing === 'new' ? 'Thêm chuyên khoa' : 'Sửa chuyên khoa'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Huỷ
            </Button>
            <Button variant="primary" loading={isPending('save')} onClick={save}>
              Lưu
            </Button>
          </>
        }
      >
        {error && <Alert tone="danger" className="st-alert-gap">{error}</Alert>}
        <div className="st-form-grid">
          <Field label="Tên chuyên khoa" required className="st-span-2">
            {(id) => <input id={id} className="st-input" value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>
          <Field label="Mã" required className="st-span-2" hint="Chữ thường không dấu, nối bằng gạch dưới. Ví dụ: aesthetic_dermatology">
            {(id) => <input id={id} className="st-input st-mono" value={code} onChange={(e) => setCode(e.target.value)} />}
          </Field>
        </div>
      </Sheet>

      <ConfirmDialog
        open={deleting !== null}
        title={`Xoá chuyên khoa ${deleting?.specialty_name ?? ''}?`}
        confirmLabel="Xoá"
        tone="danger-solid"
        loading={isPending('delete')}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
};

export default SpecialtiesPage;
