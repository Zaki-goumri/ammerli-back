export const PAYMENT_WAY = {
  EDAHABIA: 'EDAHABIA',
  CIB: 'CIB',
  CHARGILY_APP: 'CHARGILY_APP',
} as const;

export const PAYMENT_WAY_VALUES = Object.values(PAYMENT_WAY);

export type PaymentWay = (typeof PAYMENT_WAY_VALUES)[number];
