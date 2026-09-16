import { Field, SearchInput } from '../components/ui';
import { CRITICALITY_LEVEL, VELOCITY_CLASS } from '../labels';
import type { StockFilterValue } from './stockFilterValue';

export const StockFilters = ({
  value,
  onChange,
  hideBelowThreshold,
}: {
  value: StockFilterValue;
  onChange: (value: StockFilterValue) => void;
  hideBelowThreshold?: boolean;
}) => (
  <div className="st-toolbar">
    <SearchInput
      value={value.search}
      onChange={(search) => onChange({ ...value, search })}
      placeholder="Tên thuốc hoặc hoạt chất…"
    />
    <Field label="Nhóm thuốc">
      {(id) => (
        <input
          id={id}
          className="st-input"
          value={value.medicine_group}
          placeholder="Tất cả"
          onChange={(event) => onChange({ ...value, medicine_group: event.target.value })}
        />
      )}
    </Field>
    <Field label="Tốc độ bán">
      {(id) => (
        <select id={id} className="st-select" value={value.velocity_class} onChange={(event) => onChange({ ...value, velocity_class: event.target.value })}>
          <option value="">Tất cả</option>
          {Object.entries(VELOCITY_CLASS).map(([code, item]) => (
            <option key={code} value={code}>
              {item.label}
            </option>
          ))}
        </select>
      )}
    </Field>
    <Field label="Mức thiết yếu">
      {(id) => (
        <select
          id={id}
          className="st-select"
          value={value.criticality_level}
          onChange={(event) => onChange({ ...value, criticality_level: event.target.value })}
        >
          <option value="">Tất cả</option>
          {Object.entries(CRITICALITY_LEVEL).map(([code, item]) => (
            <option key={code} value={code}>
              {item.label}
            </option>
          ))}
        </select>
      )}
    </Field>
    {!hideBelowThreshold && (
      <label className="st-check" style={{ height: 36 }}>
        <input
          type="checkbox"
          checked={value.below_threshold_only}
          onChange={(event) => onChange({ ...value, below_threshold_only: event.target.checked })}
        />
        Chỉ thuốc dưới ngưỡng
      </label>
    )}
  </div>
);
