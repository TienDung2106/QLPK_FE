export interface StockFilterValue {
  search: string;
  medicine_group: string;
  velocity_class: string;
  criticality_level: string;
  below_threshold_only: boolean;
}

export const emptyStockFilter: StockFilterValue = {
  search: '',
  medicine_group: '',
  velocity_class: '',
  criticality_level: '',
  below_threshold_only: false,
};
