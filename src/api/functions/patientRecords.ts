import { GetBlob, GetData } from '../helpers';
import url from '../url';
import type { PagedResponse } from '../types';
import type { Invoice, InvoiceListItem, MedicalRecord } from '../staffTypes';

/* Hoá đơn và bệnh án của chính bệnh nhân — appointments.view_own. Chỉ xem, không thanh toán online. */

export const apiGetMyInvoices = (query: { payment_status?: string; page_number?: number; page_size?: number } = {}) =>
  GetData<PagedResponse<InvoiceListItem>>(url.patientInvoices, query);

export const apiGetMyInvoice = (invoiceId: number) => GetData<Invoice>(url.patientInvoiceById(invoiceId));

export const apiGetMyInvoicePdf = (invoiceId: number) => GetBlob(url.patientInvoicePdf(invoiceId));

export const apiGetMyMedicalRecords = (query: { page_number?: number; page_size?: number } = {}) =>
  GetData<PagedResponse<MedicalRecord>>(url.patientMedicalRecords, query);
