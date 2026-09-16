import { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { apiListSettings, apiUpdateSetting } from '../../api/functions/admin';
import type { SystemSetting } from '../../api/staffTypes';
import { formatDateTime } from '../format';
import { useToast } from '../components/toastContext';
import { useApiQuery } from '../hooks';
import { Alert, Button, PageHeader, Panel, TableSkeleton } from '../components/ui';

interface SettingDef {
  key: string;
  label: string;
  unit?: string;
}

/**
 * Nhãn tiếng Việt và cách nhóm cho các khoá đã biết (SystemSettingKeys.cs). Danh sách thật
 * lấy từ API; khoá backend thêm sau mà chưa có ở đây vẫn hiện trong nhóm "Khác".
 */
const GROUPS: { title: string; description: string; settings: SettingDef[] }[] = [
  {
    title: 'Giảm giá & đặt lịch',
    description: 'Ngưỡng cần duyệt và khung giờ nhận phòng.',
    settings: [
      { key: 'discount_approval_threshold_percent', label: 'Ngưỡng giảm giá không cần duyệt', unit: '%' },
      { key: 'checkin_window_before_minutes', label: 'Mở nhận phòng trước giờ hẹn', unit: 'phút' },
      { key: 'checkin_window_after_minutes', label: 'Còn nhận phòng sau giờ hẹn', unit: 'phút' },
      { key: 'service_reduction_max_percent', label: 'Mức giảm dịch vụ tối đa', unit: '%' },
    ],
  },
  {
    title: 'Huỷ lịch & hoàn tiền',
    description: 'Chính sách khi bệnh nhân huỷ hoặc không đến.',
    settings: [
      { key: 'patient_cancel_min_hours_before', label: 'Bệnh nhân được tự huỷ trước giờ hẹn', unit: 'giờ' },
      { key: 'late_cancel_service_refund_percent', label: 'Hoàn tiền dịch vụ khi huỷ muộn', unit: '%' },
      { key: 'no_show_service_refund_percent', label: 'Hoàn tiền dịch vụ khi không đến', unit: '%' },
    ],
  },
  {
    title: 'Bù cho bệnh nhân khi phòng khám dời lịch',
    description: 'Mức bù theo thời gian báo trước.',
    settings: [
      { key: 'reschedule_compensation_notice_24h_percent', label: 'Báo trước từ 24 giờ', unit: '%' },
      { key: 'reschedule_compensation_notice_2h_percent', label: 'Báo trước từ 2 giờ', unit: '%' },
      { key: 'reschedule_compensation_under_2h_percent', label: 'Báo trước dưới 2 giờ', unit: '%' },
      { key: 'reschedule_compensation_step_percent', label: 'Cộng thêm mỗi lần bị dời tiếp', unit: '%' },
      { key: 'reschedule_compensation_max_percent', label: 'Mức bù tối đa', unit: '%' },
    ],
  },
  {
    title: 'Đăng nhập & bảo mật',
    description: 'Phiên đăng nhập, khoá tài khoản, CAPTCHA và mã OTP.',
    settings: [
      { key: 'access_token_ttl_minutes', label: 'Thời hạn access token', unit: 'phút' },
      { key: 'refresh_token_ttl_days', label: 'Thời hạn refresh token', unit: 'ngày' },
      { key: 'max_failed_login_attempts', label: 'Số lần sai mật khẩu trước khi khoá', unit: 'lần' },
      { key: 'account_lockout_minutes', label: 'Thời gian khoá tạm', unit: 'phút' },
      { key: 'captcha_after_failed_login_attempts', label: 'Bắt CAPTCHA sau số lần sai', unit: 'lần' },
      { key: 'captcha_token_ttl_minutes', label: 'Thời hạn token CAPTCHA', unit: 'phút' },
      { key: 'registration_otp_ttl_minutes', label: 'Thời hạn mã OTP đăng ký', unit: 'phút' },
      { key: 'registration_otp_max_attempts', label: 'Số lần nhập sai OTP', unit: 'lần' },
      { key: 'otp_resend_cooldown_seconds', label: 'Giãn cách gửi lại OTP', unit: 'giây' },
    ],
  },
  {
    title: 'Kho thuốc',
    description: 'Cách hệ thống phân loại tốc độ bán và tính ngưỡng tồn.',
    settings: [
      { key: 'inventory_velocity_window_days', label: 'Số ngày lấy mẫu mức bán', unit: 'ngày' },
      { key: 'inventory_velocity_fast_daily_usage', label: 'Bán nhanh khi mỗi ngày từ', unit: 'đơn vị' },
      { key: 'inventory_velocity_medium_daily_usage', label: 'Bán trung bình khi mỗi ngày từ', unit: 'đơn vị' },
      { key: 'inventory_coverage_percent_fast', label: 'Hệ số dự trữ thuốc bán nhanh', unit: '%' },
      { key: 'inventory_coverage_percent_medium', label: 'Hệ số dự trữ thuốc bán trung bình', unit: '%' },
      { key: 'inventory_coverage_percent_slow', label: 'Hệ số dự trữ thuốc bán chậm', unit: '%' },
      { key: 'inventory_critical_multiplier', label: 'Hệ số nhân cho thuốc thiết yếu', unit: '×' },
      { key: 'inventory_critical_floor_units', label: 'Tồn tối thiểu của thuốc thiết yếu', unit: 'đơn vị' },
      { key: 'inventory_reorder_coverage_days', label: 'Số ngày dự trữ khi gợi ý nhập', unit: 'ngày' },
    ],
  },
];

interface RowState {
  setting: SystemSetting | null;
  draft: string;
  error: string | null;
  saving: boolean;
}

const SettingRow = ({ def, initial }: { def: SettingDef; initial: SystemSetting }) => {
  const toast = useToast();
  const [row, setRow] = useState<RowState>({ setting: initial, draft: initial.setting_value, error: null, saving: false });
  const numeric = row.setting?.value_type === 'integer' || row.setting?.value_type === 'decimal';
  const dirty = row.setting !== null && row.draft !== row.setting.setting_value;

  const save = async () => {
    if (!row.setting) {
      return;
    }
    if (numeric && (row.draft.trim() === '' || Number.isNaN(Number(row.draft)))) {
      setRow({ ...row, error: 'Giá trị phải là số.' });
      return;
    }
    if (row.setting.value_type === 'integer' && !Number.isInteger(Number(row.draft))) {
      setRow({ ...row, error: 'Giá trị phải là số nguyên.' });
      return;
    }
    setRow({ ...row, saving: true, error: null });
    const result = await apiUpdateSetting(def.key, { setting_value: row.draft.trim() });
    if (result.ok && result.data) {
      setRow({ setting: result.data, draft: result.data.setting_value, error: null, saving: false });
      toast.success(`Đã lưu: ${def.label}.`);
    } else {
      setRow((current) => ({ ...current, saving: false, error: result.error }));
    }
  };

  return (
    <tr>
      <td style={{ width: '46%' }}>
        <div className="st-cell-main">{def.label}</div>
        <div className="st-cell-sub">
          <span className="st-mono">{def.key}</span>
          {row.setting && ` · sửa ${formatDateTime(row.setting.updated_at)}`}
        </div>
      </td>
      <td>
        {row.setting ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <input
              className="st-input"
              style={{ maxWidth: 140 }}
              inputMode={numeric ? 'decimal' : undefined}
              aria-label={def.label}
              aria-invalid={Boolean(row.error)}
              value={row.draft}
              onChange={(event) => setRow({ ...row, draft: event.target.value, error: null })}
              onKeyDown={(event) => event.key === 'Enter' && dirty && save()}
            />
            {def.unit && <span className="st-muted">{def.unit}</span>}
            {dirty && (
              <>
                <Button size="sm" variant="primary" iconOnly aria-label="Lưu" icon={<Check size={14} />} loading={row.saving} onClick={save} />
                <Button
                  size="sm"
                  variant="ghost"
                  iconOnly
                  aria-label="Hoàn tác"
                  icon={<RotateCcw size={14} />}
                  onClick={() => setRow({ ...row, draft: row.setting!.setting_value, error: null })}
                />
              </>
            )}
          </div>
        ) : null}
        {row.error && (
          <div className="st-hint" style={{ color: 'var(--st-danger)', marginTop: 4 }}>
            {row.error}
          </div>
        )}
      </td>
    </tr>
  );
};

const KNOWN_KEYS = new Set(GROUPS.flatMap((group) => group.settings.map((setting) => setting.key)));

const SettingsPage = () => {
  const query = useApiQuery(apiListSettings, []);
  const byKey = new Map((query.data ?? []).map((setting) => [setting.setting_key, setting]));
  const others = (query.data ?? [])
    .filter((setting) => !KNOWN_KEYS.has(setting.setting_key))
    .map((setting) => ({ key: setting.setting_key, label: setting.description ?? setting.setting_key }));
  const groups = [
    ...GROUPS,
    ...(others.length > 0 ? [{ title: 'Khác', description: 'Cài đặt chưa được phân nhóm.', settings: others }] : []),
  ];

  return (
    <>
      <PageHeader
        title="Cài đặt hệ thống"
        description="Thay đổi có hiệu lực ngay cho mọi thao tác mới. Sửa giá trị rồi bấm dấu ✓ hoặc Enter để lưu từng dòng."
      />
      <Alert tone="warning" className="st-alert-gap">
        Các cài đặt bảo mật ảnh hưởng tới mọi tài khoản. Chỉ đổi khi đã hiểu tác động.
      </Alert>
      {query.error && (
        <Alert tone="danger" className="st-alert-gap">
          {query.error}
        </Alert>
      )}
      <div className="st-stack">
        {groups.map((group) => {
          const rows = group.settings.filter((def) => byKey.has(def.key));
          if (query.data && rows.length === 0) {
            return null;
          }
          return (
            <Panel key={group.title} title={group.title} subtitle={group.description} bodyless>
              <div className="st-table-wrap">
                <table className="st-table">
                  <tbody>
                    {!query.data && query.loading ? (
                      <TableSkeleton columns={2} rows={Math.min(group.settings.length, 4)} />
                    ) : (
                      rows.map((def) => <SettingRow key={def.key} def={def} initial={byKey.get(def.key)!} />)
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
};

export default SettingsPage;
