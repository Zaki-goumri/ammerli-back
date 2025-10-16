export const PAYEMENT_WAY = {
  CREDIT_CARD: 'CREDIT_CARD',
  CASH: 'CASH',
} as const;

export const PAYMENT_WAY_VALUES = Object.values(PAYEMENT_WAY);

export type PaymentWay = (typeof PAYMENT_WAY_VALUES)[number];
