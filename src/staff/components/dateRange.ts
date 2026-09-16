import { useState } from 'react';
import { todayIso } from '../format';

export const PRESETS = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: 'month', label: 'Tháng này' },
  { value: '90', label: '90 ngày' },
  { value: 'custom', label: 'Tuỳ chọn' },
];

function presetRange(preset: string): [string, string] {
  const today = todayIso();
  if (preset === 'month') {
    return [`${today.slice(0, 8)}01`, today];
  }
  const days = Number(preset) || 30;
  return [todayIso(-(days - 1)), today];
}

/** Khoảng ngày của báo cáo: mặc định 30 ngày gần nhất. `valid` false khi từ > đến. */
export function useDateRange(initial = '30') {
  const [preset, setPreset] = useState(initial);
  const [range, setRange] = useState<[string, string]>(() => presetRange(initial));
  const [fromDate, toDate] = range;
  return {
    preset,
    fromDate,
    toDate,
    valid: Boolean(fromDate && toDate && fromDate <= toDate),
    choosePreset: (value: string) => {
      setPreset(value);
      if (value !== 'custom') {
        setRange(presetRange(value));
      }
    },
    setRange,
  };
}
