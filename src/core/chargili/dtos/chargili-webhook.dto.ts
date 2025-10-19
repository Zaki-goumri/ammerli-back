import {
  IsString,
  IsNumber,
  IsBoolean,
  IsIn,
  IsOptional,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export const WEBHOOK_EVENT_TYPE = {
  CHECKOUT_PAID: 'checkout.paid',
  CHECKOUT_FAILED: 'checkout.failed',
  CHECKOUT_EXPIRED: 'checkout.expired',
} as const;
export const WEBHOOK_EVENT_TYPE_VALUES = Object.values(WEBHOOK_EVENT_TYPE);
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPE_VALUES)[number];

export const CHECKOUT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELED: 'canceled',
  EXPIRED: 'expired',
} as const;
export const CHECKOUT_STATUS_VALUES = Object.values(CHECKOUT_STATUS);
export type CheckoutStatus = (typeof CHECKOUT_STATUS_VALUES)[number];

export const PAYMENT_METHOD = {
  EDAHABIA: 'edahabia',
  CIB: 'cib',
  CHARGILY_APP: 'chargily_app',
} as const;
export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD);
export type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number];

export const FULFILLMENT_STATUS = {
  UNFULFILLED: 'unfulfilled',
  FULFILLED: 'fulfilled',
  PARTIALLY_FULFILLED: 'partially_fulfilled',
} as const;
export const FULFILLMENT_STATUS_VALUES = Object.values(FULFILLMENT_STATUS);
export type FulfillmentStatus = (typeof FULFILLMENT_STATUS_VALUES)[number];

export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;
export const NOTIFICATION_STATUS_VALUES = Object.values(NOTIFICATION_STATUS);
export type NotificationStatus = (typeof NOTIFICATION_STATUS_VALUES)[number];

export const FEES_ALLOCATION = {
  MERCHANT: 'merchant',
  CUSTOMER: 'customer',
  SPLIT: 'split',
} as const;
export const FEES_ALLOCATION_VALUES = Object.values(FEES_ALLOCATION);
export type FeesAllocation = (typeof FEES_ALLOCATION_VALUES)[number];

export const DISCOUNT_TYPE = {
  PERCENTAGE: 'percentage',
  AMOUNT: 'amount',
} as const;
export const DISCOUNT_TYPE_VALUES = Object.values(DISCOUNT_TYPE);
export type DiscountType = (typeof DISCOUNT_TYPE_VALUES)[number];

export class ShippingAddressDto {
  @IsString()
  country: string;
}

export class DiscountDto {
  @IsIn(DISCOUNT_TYPE_VALUES)
  type: DiscountType;

  @IsNumber()
  value: number;
}

export class SimplifiedCheckoutDto {
  @IsString()
  id: string;

  @IsNumber()
  fees: number;

  @IsIn(CHECKOUT_STATUS_VALUES)
  status: CheckoutStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiscountDto)
  discount?: DiscountDto | null;

  @IsBoolean()
  livemode: boolean;

  @IsOptional()
  @IsString()
  failure_url?: string | null;

  @IsOptional()
  @IsString()
  success_url?: string | null;

  @IsString()
  checkout_url: string;

  @IsOptional()
  @IsIn(PAYMENT_METHOD_VALUES)
  payment_method?: PaymentMethod | null;

  @IsOptional()
  @IsString()
  payment_link_id?: string | null;

  @IsNumber()
  fees_on_customer: number;

  @IsNumber()
  fees_on_merchant: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shipping_address?: ShippingAddressDto | null;

  @IsOptional()
  @IsString()
  webhook_endpoint?: string | null;

  @IsNumber()
  earnings_consumed: number;

  @IsIn(FULFILLMENT_STATUS_VALUES)
  fulfillment_status: FulfillmentStatus;

  @IsIn(NOTIFICATION_STATUS_VALUES)
  notification_status: NotificationStatus;

  @IsOptional()
  @IsBoolean()
  pass_fees_to_customer?: boolean | null;

  @IsOptional()
  @IsString()
  deposit_transaction_id?: string | null;

  @IsNumber()
  amount_without_discount: number;

  @IsNumber()
  paid_checkouts_consumed: number;

  @IsNumber()
  collect_shipping_address: number;

  @IsIn(FEES_ALLOCATION_VALUES)
  chargily_pay_fees_allocation: FeesAllocation;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  entity?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  created_at?: number;

  @IsOptional()
  @IsString()
  invoice_id?: string | null;

  @IsOptional()
  @IsNumber()
  updated_at?: number;

  @IsOptional()
  @IsString()
  customer_id?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;
}

export class CheckoutDataDto {
  @IsString()
  id: string;

  @IsString()
  entity: string;

  @IsNumber()
  fees: number;

  @IsNumber()
  amount: number;

  @IsIn(CHECKOUT_STATUS_VALUES)
  status: CheckoutStatus;

  @IsString()
  currency: string;

  @IsString()
  locale: string;

  @IsBoolean()
  livemode: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiscountDto)
  discount?: DiscountDto | null;

  @IsNumber()
  created_at: number;

  @IsOptional()
  @IsString()
  invoice_id?: string | null;

  @IsNumber()
  updated_at: number;

  @IsOptional()
  @IsString()
  customer_id?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  failure_url?: string | null;

  @IsOptional()
  @IsString()
  success_url?: string | null;

  @IsString()
  checkout_url: string;

  @IsOptional()
  @IsIn(PAYMENT_METHOD_VALUES)
  payment_method?: PaymentMethod | null;

  @IsOptional()
  @IsString()
  payment_link_id?: string | null;

  @IsNumber()
  fees_on_customer: number;

  @IsNumber()
  fees_on_merchant: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shipping_address?: ShippingAddressDto | null;

  @IsOptional()
  @IsString()
  webhook_endpoint?: string | null;

  @IsNumber()
  earnings_consumed: number;

  @IsIn(FULFILLMENT_STATUS_VALUES)
  fulfillment_status: FulfillmentStatus;

  @IsIn(NOTIFICATION_STATUS_VALUES)
  notification_status: NotificationStatus;

  @IsOptional()
  @IsBoolean()
  pass_fees_to_customer?: boolean | null;

  @IsOptional()
  @IsString()
  deposit_transaction_id?: string | null;

  @IsNumber()
  amount_without_discount: number;

  @IsNumber()
  paid_checkouts_consumed: number;

  @IsNumber()
  collect_shipping_address: number;

  @IsIn(FEES_ALLOCATION_VALUES)
  chargily_pay_fees_allocation: FeesAllocation;
}
