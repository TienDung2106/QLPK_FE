import { GetData, PostData, PutData } from '../helpers';
import url from '../url';
import type { PagedResponse } from '../types';
import type {
  ImportBatchPayload,
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
