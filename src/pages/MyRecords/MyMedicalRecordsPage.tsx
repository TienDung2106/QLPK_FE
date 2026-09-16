import { useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, ClipboardList, Loader2 } from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer/Footer';
import { apiGetMyMedicalRecords } from '../../api/functions/patientRecords';
import type { MedicalRecord } from '../../api/staffTypes';
import type { PagedResponse } from '../../api/types';
import { formatDate, formatTime } from '../../staff/format';
import './MyRecords.css';

/** Kết quả các lần khám: chẩn đoán, hướng điều trị, thuốc đã kê, lịch tái khám. */
export const MyMedicalRecordsPage = () => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedResponse<MedicalRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetMyMedicalRecords({ page_number: page, page_size: 10 }).then((result) => {
      if (cancelled) {
        return;
      }
      setData(result.data);
      setError(result.ok ? null : result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const items = data?.items ?? [];

  return (
    <div className="account-page">
      <Header />

      <main className="container account-main">
        <div className="account-heading">
          <div>
            <h1 className="account-title">Bệnh án của tôi</h1>
            <p className="account-subtitle">Kết quả khám và đơn thuốc của bạn và người thân, mới nhất trước.</p>
          </div>
        </div>

        {error && (
          <div className="account-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="full-page-loader">
            <Loader2 className="full-page-loader-icon" size={32} />
            <span>Đang tải bệnh án...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="appointment-empty">
            <ClipboardList size={40} />
            <h3>Chưa có bệnh án</h3>
            <p>Bệnh án xuất hiện ở đây sau khi bác sĩ ghi kết quả lượt khám.</p>
          </div>
        ) : (
          <ul className="record-list">
            {items.map((record) => {
              const open = openId === record.medical_record_id;
              return (
                <li key={record.medical_record_id} className="record-card">
                  <button
                    type="button"
                    className="record-card-head"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : record.medical_record_id)}
                  >
                    <div>
                      <h3 className="record-card-title">{record.diagnosis}</h3>
                      <p className="record-card-meta">
                        {formatDate(record.appointment_date)} lúc {formatTime(record.appointment_time)} · {record.doctor_full_name} ·{' '}
                        {record.patient_full_name}
                      </p>
                    </div>
                    <div className="record-card-side">
                      {record.follow_up_date && <span className="record-pill">Tái khám {formatDate(record.follow_up_date)}</span>}
                      {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {open && (
                    <div className="record-card-body">
                      <dl className="record-fields">
                        <dt>Triệu chứng</dt>
                        <dd>{record.symptoms ?? '—'}</dd>
                        <dt>Kết quả thăm khám</dt>
                        <dd>{record.examination_findings ?? '—'}</dd>
                        <dt>Chẩn đoán</dt>
                        <dd>
                          {record.diagnosis}
                          {record.icd10_code ? ` (ICD-10: ${record.icd10_code})` : ''}
                        </dd>
                        <dt>Hướng điều trị</dt>
                        <dd>{record.treatment_plan ?? '—'}</dd>
                        {record.follow_up_date && (
                          <>
                            <dt>Tái khám</dt>
                            <dd>
                              {formatDate(record.follow_up_date)}
                              {record.follow_up_notes ? ` — ${record.follow_up_notes}` : ''}
                            </dd>
                          </>
                        )}
                      </dl>

                      {record.prescription && record.prescription.items.length > 0 && (
                        <table className="record-lines">
                          <thead>
                            <tr>
                              <th>Thuốc</th>
                              <th className="num">SL</th>
                              <th>Liều dùng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.prescription.items.map((item) => (
                              <tr key={item.prescription_item_id}>
                                <td>{item.medicine_name}</td>
                                <td className="num">
                                  {item.quantity_prescribed} {item.unit_of_measure}
                                </td>
                                <td>
                                  {item.dosage} · {item.frequency}
                                  {item.duration_days ? ` · ${item.duration_days} ngày` : ''}
                                  {item.usage_instructions && <div className="record-card-meta">{item.usage_instructions}</div>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {data && data.total_pages > 1 && (
          <div className="record-pager">
            <button type="button" className="btn btn-outline" disabled={!data.has_previous_page} onClick={() => setPage(page - 1)}>
              Trang trước
            </button>
            <span>
              Trang {data.page_number}/{data.total_pages}
            </span>
            <button type="button" className="btn btn-outline" disabled={!data.has_next_page} onClick={() => setPage(page + 1)}>
              Trang sau
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
