import { ORDER_PAYMENT_METHOD } from './order-payment-method.enum';
import { PAYMENT_WAY } from './payment-way.enum';

export const PaymentMethod = {
  CASH: ORDER_PAYMENT_METHOD.CASH,
  NOT_PAYED: 'NOT_PAYED',
  ...PAYMENT_WAY,
} as const;

export type PaymentMethodType =
  (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHOD_VALUES = Object.values(PaymentMethod);
