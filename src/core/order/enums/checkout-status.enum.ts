export const CHECKOUT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELED: 'CANCELED',
} as const;

export const CHECKOUT_STATUS_VALUES = Object.values(CHECKOUT_STATUS);

export type CheckoutStatus = (typeof CHECKOUT_STATUS_VALUES)[number];
