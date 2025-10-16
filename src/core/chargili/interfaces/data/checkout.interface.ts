import { Address } from './address.interface';

/** Represents a checkout object with details of the transaction. */
export interface Checkout {
  /* Unique identifier of the checkout. */
  id: string;

  /** A string representing the type of the object. */
  entity: string;

  /** True for Live Mode, False for Test Mode. */
  livemode: boolean;

  /** The total amount of the transaction. */
  amount: number;

  /** The currency code for the transaction. */
  currency: string;

  /** The fees associated with the transaction. */
  fees: number;

  /** Indicates whether the fees are passed to the customer. */
  pass_fees_to_customer: boolean;

  /** The current status of the checkout. */
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'canceled';

  /** The language of the checkout page. */
  locale: 'ar' | 'en' | 'fr';

  /** A description of the transaction. */
  description: string;

  /** The URL to which the customer will be redirected after a successful payment. */
  success_url: string;

  /** The URL to which the customer will be redirected after a failed or canceled payment. */
  failure_url: string;

  /** The webhook endpoint for receiving payment events. */
  webhook_endpoint: string;

  /** The payment method used, can be null if not specified. */
  payment_method: string | null;

  /** The invoice ID associated with the payment, can be null if not specified. */
  invoice_id: string | null;

  /** The customer ID associated with the payment, can be null if not specified. */
  customer_id: string | null;

  /** The payment link ID associated with the payment, can be null if not specified. */
  payment_link_id: string | null;

  /** A set of key-value pairs that can be used to store additional information about the checkout. */
  metadata: Record<string, any>;

  /** Timestamp indicating when the checkout was created. */
  created_at: number;

  /** Timestamp indicating when the checkout was last updated. */
  updated_at: number;

  /** The shipping address for the checkout. */
  shipping_address: Address;

  /** Indicates whether the shipping address should be collected. */
  collect_shipping_address: boolean;

  /** The URL for the checkout page where the customer completes the payment. */
  checkout_url: string;
}
