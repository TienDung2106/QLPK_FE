import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Save } from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer/Footer';
import { apiGetMyProfiles, apiUpdateProfile } from '../../api/functions/patients';
import type { UpdatePatientProfilePayload } from '../../api/functions/patients';
import type { PatientProfile } from '../../api/types';
import './ProfilePage.css';

const RELATIONSHIP_LABEL: Record<string, string> = {
  self: 'Bản thân',
  child: 'Con',
  parent: 'Bố / mẹ',
  spouse: 'Vợ / chồng',
  other: 'Khác',
};

/** Chỉ giữ các trường backend nhận ở UpdatePatientProfileRequest. */
function toPayload(profile: PatientProfile): UpdatePatientProfilePayload {
  return {
    full_name: profile.full_name,
    date_of_birth: profile.date_of_birth,
    gender: profile.gender,
    address: profile.address,
    occupation: profile.occupation,
    blood_type: profile.blood_type,
    health_insurance_number: profile.health_insurance_number,
    health_insurance_expiry: profile.health_insurance_expiry,
    emergency_contact_name: profile.emergency_contact_name,
    emergency_contact_phone: profile.emergency_contact_phone,
    allergy_notes: profile.allergy_notes,
  };
}

export const ProfilePage = () => {
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<UpdatePatientProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

        // Hồ sơ đầu tiên là hồ sơ tạo cùng tài khoản lúc đăng ký — mặc định mở nó.
        const first = result.data[0];
        if (first) {
          setSelectedId(first.patient_id);
          setForm(toPayload(first));
        }
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selected = profiles.find((profile) => profile.patient_id === selectedId) ?? null;

  const selectProfile = (profile: PatientProfile) => {
    setSelectedId(profile.patient_id);
    setForm(toPayload(profile));
    setNotice(null);
    setError(null);
  };

  const setField = <K extends keyof UpdatePatientProfilePayload>(
    key: K,
    value: UpdatePatientProfilePayload[K],
  ) => {
    setForm((previous) => (previous ? { ...previous, [key]: value } : previous));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!form || selectedId === null) {
      return;
    }

    if (form.full_name.trim().length < 2) {
      setError('Vui lòng nhập họ tên.');
      return;
    }

    setSaving(true);
    const result = await apiUpdateProfile(selectedId, form);
    setSaving(false);

    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }

    const saved = result.data;
    setProfiles((previous) =>
      previous.map((profile) => (profile.patient_id === saved.patient_id ? saved : profile)),
    );
    setNotice('Đã lưu hồ sơ.');
  };

  return (
    <div className="account-page">
      <Header />

      <main className="container account-main">
        <div className="account-heading">
          <div>
            <h1 className="account-title">Hồ sơ của tôi</h1>
            <p className="account-subtitle">
              Thông tin dùng khi đặt lịch khám. Số điện thoại và email thuộc về tài khoản
              đăng nhập nên không sửa ở đây.
            </p>
          </div>

          <Link className="btn btn-outline" to="/doi-mat-khau">
            <KeyRound size={18} />
            <span>Đổi mật khẩu</span>
          </Link>
        </div>

        {error && (
          <div className="account-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="account-alert success" role="status">
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

        {loading ? (
          <div className="full-page-loader">
            <Loader2 className="full-page-loader-icon" size={32} />
            <span>Đang tải hồ sơ...</span>
          </div>
        ) : !selected || !form ? (
          <div className="appointment-empty">
            <h3>Chưa có hồ sơ bệnh nhân</h3>
            <p>Tài khoản này chưa gắn với hồ sơ bệnh nhân nào.</p>
          </div>
        ) : (
          <div className="profile-layout">
            {/* Một tài khoản có thể giữ nhiều hồ sơ (bản thân, con, bố mẹ); chỉ hiện cột
                chọn khi thật sự có nhiều hơn một. */}
            {profiles.length > 1 && (
              <aside className="profile-switcher">
                <h2>Hồ sơ</h2>
                {profiles.map((profile) => (
                  <button
                    key={profile.patient_id}
                    type="button"
                    className={`profile-switch-item ${
                      profile.patient_id === selectedId ? 'active' : ''
                    }`}
                    onClick={() => selectProfile(profile)}
                  >
                    <strong>{profile.full_name}</strong>
                    <span>
                      {RELATIONSHIP_LABEL[profile.relationship_to_account] ??
                        profile.relationship_to_account}
                    </span>
                  </button>
                ))}
              </aside>
            )}

            <form className="profile-form" onSubmit={handleSubmit} noValidate>
              <div className="profile-identity">
                <span className="profile-code">{selected.patient_code}</span>
                <span className="profile-contact">
                  {selected.account_phone_number}
                  {selected.account_email ? ` · ${selected.account_email}` : ''}
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-name">
                    Họ và tên
                  </label>
                  <input
                    id="profile-name"
                    className="form-input"
                    type="text"
                    value={form.full_name}
                    onChange={(event) => setField('full_name', event.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-dob">
                    Ngày sinh
                  </label>
                  <input
                    id="profile-dob"
                    className="form-input"
                    type="date"
                    value={form.date_of_birth ?? ''}
                    onChange={(event) => setField('date_of_birth', event.target.value || null)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-gender">
                    Giới tính
                  </label>
                  <select
                    id="profile-gender"
                    className="form-select"
                    value={form.gender ?? ''}
                    onChange={(event) => setField('gender', event.target.value || null)}
                    disabled={saving}
                  >
                    <option value="">Chưa chọn</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-occupation">
                    Nghề nghiệp
                  </label>
                  <input
                    id="profile-occupation"
                    className="form-input"
                    type="text"
                    value={form.occupation ?? ''}
                    onChange={(event) => setField('occupation', event.target.value || null)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-address">
                  Địa chỉ
                </label>
                <input
                  id="profile-address"
                  className="form-input"
                  type="text"
                  value={form.address ?? ''}
                  onChange={(event) => setField('address', event.target.value || null)}
                  disabled={saving}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-emergency-name">
                    Người liên hệ khẩn cấp
                  </label>
                  <input
                    id="profile-emergency-name"
                    className="form-input"
                    type="text"
                    value={form.emergency_contact_name ?? ''}
                    onChange={(event) =>
                      setField('emergency_contact_name', event.target.value || null)
                    }
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile-emergency-phone">
                    Số điện thoại khẩn cấp
                  </label>
                  <input
                    id="profile-emergency-phone"
                    className="form-input"
                    type="tel"
                    value={form.emergency_contact_phone ?? ''}
                    onChange={(event) =>
                      setField('emergency_contact_phone', event.target.value || null)
                    }
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-allergy">
                  Dị ứng / lưu ý sức khoẻ
                </label>
                <textarea
                  id="profile-allergy"
                  className="form-textarea"
                  rows={3}
                  placeholder="Ví dụ: dị ứng penicillin"
                  value={form.allergy_notes ?? ''}
                  onChange={(event) => setField('allergy_notes', event.target.value || null)}
                  disabled={saving}
                />
                <p className="form-hint">
                  Bác sĩ đọc mục này trước khi kê đơn, nên hãy ghi đầy đủ những thuốc bạn
                  từng bị dị ứng.
                </p>
              </div>

              <button type="submit" className="btn btn-primary profile-save" disabled={saving}>
                {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
