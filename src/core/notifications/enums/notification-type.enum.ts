export const NOTIFICATION_TYPE = {
  ORDERS: 'Orders',
  PAYMENTS: 'Payments',
  NEW_SUPERMARKET: 'New Supermarket',
  LOW_STOCK: 'Low Stock',
  STATUS_UPDATE: 'Status Update',
  EXPIRING_SOON: 'Expiring Soon',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPE);
