import type { PatientFormValue } from './patientFormValue';
import { GENDER_LABEL } from '../labels';
import { Field } from '../components/ui';

export const PatientFields = ({
  value,
  onChange,
  registering,
}: {
  value: PatientFormValue;
  onChange: (value: PatientFormValue) => void;
  /** Đăng ký mới: có ô số điện thoại (sau khi tạo thì số gắn với tài khoản, không sửa ở đây). */
  registering: boolean;
}) => {
  const text = (key: keyof PatientFormValue, label: string, props: { type?: string; required?: boolean; hint?: string; span?: boolean; max?: number } = {}) => (
    <Field label={label} required={props.required} hint={props.hint} className={props.span ? 'st-span-2' : ''}>
      {(id) => (
        <input
          id={id}
          type={props.type ?? 'text'}
          className="st-input"
          maxLength={props.max}
          value={value[key]}
          onChange={(event) => onChange({ ...value, [key]: event.target.value })}
        />
      )}
    </Field>
  );

  return (
    <>
      <div className="st-form-grid">
        {text('full_name', 'Họ và tên', { required: true, span: true, max: 100 })}
        {registering && text('phone_number', 'Số điện thoại', { type: 'tel', hint: 'Bắt buộc nếu không có email.', max: 20 })}
        {text('email', 'Email', {
          type: 'email',
          hint: 'Bệnh nhân dùng email này để lấy lại mật khẩu và tự quản lý tài khoản.',
          span: !registering,
          max: 150,
        })}
        {text('national_id', 'CCCD / Hộ chiếu', { max: 20 })}
        {text('date_of_birth', 'Ngày sinh', { type: 'date' })}
        <Field label="Giới tính">
          {(id) => (
            <select id={id} className="st-select" value={value.gender} onChange={(event) => onChange({ ...value, gender: event.target.value })}>
              <option value="">Không rõ</option>
              {Object.entries(GENDER_LABEL).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </Field>
        {text('occupation', 'Nghề nghiệp')}
        {text('address', 'Địa chỉ', { span: true })}
      </div>

      <div className="st-form-section">
        <div className="st-form-section-title">Y tế & bảo hiểm</div>
        <div className="st-form-grid">
          {text('blood_type', 'Nhóm máu', { max: 5 })}
          {text('health_insurance_number', 'Số thẻ BHYT')}
          {text('health_insurance_expiry', 'Hạn thẻ BHYT', { type: 'date' })}
          <Field label="Dị ứng" className="st-span-2">
            {(id) => (
              <textarea id={id} className="st-textarea" value={value.allergy_notes} onChange={(event) => onChange({ ...value, allergy_notes: event.target.value })} />
            )}
          </Field>
        </div>
      </div>

      <div className="st-form-section">
        <div className="st-form-section-title">Liên hệ khẩn cấp</div>
        <div className="st-form-grid">
          {text('emergency_contact_name', 'Họ tên')}
          {text('emergency_contact_phone', 'Số điện thoại', { type: 'tel' })}
        </div>
      </div>
    </>
  );
};
