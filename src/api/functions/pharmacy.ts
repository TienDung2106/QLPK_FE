import { GetBlob, GetData, PatchData, PostData, PutData } from '../helpers';
import url from '../url';
import type { BatchAction } from '../url';
import type { PagedResponse } from '../types';
import type {
  AdjustBatchPayload,
  ExpiringBatchQuery,
  ImportBatchPayload,
  InventoryReport,
  MedicinePayload,
  RemoveStockPayload,
  StockMovement,
  StockMovementQuery,
  ImportBatchResult,
  MedicineBatch,
  MedicineClassificationPayload,
  MedicineStock,
  MedicineStockQuery,
  Prescription,
  PrescriptionPreparation,
  PrescriptionQuery,
  Supplier,
  SupplierPayload,
  SupplierQuery,
} from '../staffTypes';

/* Kho — inventory.view_adjust */

export const apiSearchMedicineStock = (query: MedicineStockQuery = {}) =>
  GetData<PagedResponse<MedicineStock>>(url.pharmacyMedicines, query);

export const apiGetReorderSuggestions = (query: MedicineStockQuery = {}) =>
  GetData<PagedResponse<MedicineStock>>(url.pharmacyReorderSuggestions, query);

export const apiGetMedicineBatches = (medicineId: number) =>
  GetData<MedicineBatch[]>(url.pharmacyMedicineBatches(medicineId));

export const apiImportMedicineBatch = (medicineId: number, payload: ImportBatchPayload) =>
  PostData<ImportBatchResult>(url.pharmacyMedicineBatches(medicineId), payload);

export const apiUpdateMedicineClassification = (medicineId: number, payload: MedicineClassificationPayload) =>
  PutData<MedicineStock>(url.pharmacyMedicineClassification(medicineId), payload);

/* Danh mục thuốc — inventory.view_adjust. Tồn kho, tốc độ bán do backend tự tính. */

export const apiCreateMedicine = (payload: MedicinePayload) => PostData<MedicineStock>(url.pharmacyMedicineCatalog, payload);

export const apiUpdateMedicine = (medicineId: number, payload: MedicinePayload) =>
  PutData<MedicineStock>(url.pharmacyMedicineCatalogById(medicineId), payload);

/** Ngừng kinh doanh bị từ chối (409) khi thuốc còn tồn. */
export const apiSetMedicineStatus = (medicineId: number, isActive: boolean) =>
  PatchData<MedicineStock>(url.pharmacyMedicineCatalogStatus(medicineId), { is_active: isActive });

/* Điều chỉnh lô — ghi chú luôn bắt buộc, mọi thay đổi vào lịch sử kho. */

export const apiAdjustBatch = (batchId: number, payload: AdjustBatchPayload) =>
  PostData<MedicineBatch>(url.pharmacyBatchAction(batchId, 'adjustments'), payload);

export const apiRemoveBatchStock = (
  batchId: number,
  action: Exclude<BatchAction, 'adjustments'>,
  payload: RemoveStockPayload,
) => PostData<MedicineBatch>(url.pharmacyBatchAction(batchId, action), payload);

export const apiSearchExpiringBatches = (query: ExpiringBatchQuery = {}) =>
  GetData<PagedResponse<MedicineBatch>>(url.pharmacyExpiringBatches, query);

export const apiSearchStockMovements = (query: StockMovementQuery = {}) =>
  GetData<PagedResponse<StockMovement>>(url.pharmacyStockLogs, query);

export const apiGetInventoryReport = (query: { expiring_within_days?: number; take?: number } = {}) =>
  GetData<InventoryReport>(url.pharmacyInventoryReport, query);

/* Xuất Excel: cùng bộ lọc với màn hình, backend lấy hết các trang. */

export const apiExportInventoryReport = (query: { expiring_within_days?: number } = {}) =>
  GetBlob(url.pharmacyInventoryReportExport, query);

export const apiExportStockMovements = (query: StockMovementQuery = {}) =>
  GetBlob(url.pharmacyStockLogsExport, query);

/* Nhà cung cấp — inventory.view_adjust */

export const apiSearchSuppliers = (query: SupplierQuery = {}) =>
  GetData<PagedResponse<Supplier>>(url.pharmacySuppliers, query);

export const apiCreateSupplier = (payload: SupplierPayload) => PostData<Supplier>(url.pharmacySuppliers, payload);

export const apiUpdateSupplier = (supplierId: number, payload: SupplierPayload) =>
  PutData<Supplier>(url.pharmacySupplierById(supplierId), payload);

/* Cấp phát đơn — prescriptions.dispense */

export const apiSearchPrescriptions = (query: PrescriptionQuery = {}) =>
  GetData<PagedResponse<Prescription>>(url.pharmacyPrescriptions, query);

export const apiGetPrescription = (prescriptionId: number) =>
  GetData<Prescription>(url.pharmacyPrescriptionById(prescriptionId));

/** Giữ thuốc theo lô (FEFO). `shortfalls` liệt kê dòng chưa đủ hàng. */
export const apiPreparePrescription = (prescriptionId: number) =>
  PostData<PrescriptionPreparation>(url.pharmacyPrescriptionAction(prescriptionId, 'prepare'));

export const apiCancelPreparation = (prescriptionId: number) =>
  PostData<Prescription>(url.pharmacyPrescriptionAction(prescriptionId, 'cancel-preparation'));

/** Chỉ giao được sau khi hoá đơn đã thanh toán. */
export const apiDeliverPrescription = (prescriptionId: number) =>
  PostData<Prescription>(url.pharmacyPrescriptionAction(prescriptionId, 'deliver'));
