export const ORDER_STATUS = {
  ON_PREPARATION: 'on_preparation',
  ON_DELIVERING: 'on_delivering',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);
export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];
