export const PAYEMENT_WAY = {
  CASH: 'CASH',
  EDAHABIA: 'EDAHABIA',
  CIB: 'CIB',
} as const;

export const PAYMENT_WAY_VALUES = Object.values(PAYEMENT_WAY);

export type PaymentWay = (typeof PAYMENT_WAY_VALUES)[number];
