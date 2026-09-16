export interface PaymentFormValue {
  payment_method: string;
  external_reference: string;
}

export const emptyPayment: PaymentFormValue = { payment_method: 'cash', external_reference: '' };

export function paymentPayload(value: PaymentFormValue) {
  return {
    payment_method: value.payment_method,
    external_reference: value.external_reference.trim() || undefined,
  };
}

export function paymentInvalid(value: PaymentFormValue) {
  return value.payment_method === 'bank_transfer' && value.external_reference.trim().length === 0;
}
