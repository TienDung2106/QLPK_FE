import { Field, FilterTabs } from './ui';
import { PRESETS } from './dateRange';
import type { useDateRange } from './dateRange';

export const DateRangeFilter = ({ state }: { state: ReturnType<typeof useDateRange> }) => (
  <div className="st-panel" style={{ marginBottom: '1rem' }}>
    <div className="st-toolbar" style={{ borderBottom: 'none' }}>
      <FilterTabs label="Khoảng thời gian" options={PRESETS} value={state.preset} onChange={state.choosePreset} />
      {state.preset === 'custom' && (
        <>
          <Field label="Từ ngày">
            {(id) => (
              <input
                id={id}
                type="date"
                className="st-input"
                value={state.fromDate}
                max={state.toDate}
                onChange={(e) => state.setRange([e.target.value, state.toDate])}
              />
            )}
          </Field>
          <Field label="Đến ngày">
            {(id) => (
              <input
                id={id}
                type="date"
                className="st-input"
                value={state.toDate}
                min={state.fromDate}
                onChange={(e) => state.setRange([state.fromDate, e.target.value])}
              />
            )}
          </Field>
        </>
      )}
    </div>
  </div>
);
