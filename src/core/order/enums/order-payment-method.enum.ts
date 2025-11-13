export enum ORDER_PAYMENT_METHOD {
  CASH = 'CASH',
  EPAYMENT = 'EPAYMENT',
}

export type OrderPaymentMethodType =
  (typeof ORDER_PAYMENT_METHOD)[keyof typeof ORDER_PAYMENT_METHOD];

export const ORDER_PAYMENT_METHOD_VALUES = Object.values(ORDER_PAYMENT_METHOD);
