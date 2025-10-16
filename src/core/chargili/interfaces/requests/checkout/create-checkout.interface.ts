import { CheckoutItemParams } from './checkout-item.interface';

export interface CreateCheckoutParams {
  /** Required if amount and currency are not provided: An array of items being purchased. */
  items?: CheckoutItemParams[];

  /** Required if items are not provided: The total amount of the checkout. */
  amount?: number;

  /** Required if amount is provided: The currency code for the checkout. */
  currency?: string;

  /** Optional: The payment method for the checkout, defaults to "edahabia". */
  payment_method?: string;

  /** Required: The URL to redirect to after a successful payment, must be a valid URL that begins with either http or https. */
  success_url: string;

  /** Optional: The URL to redirect to after a failed or canceled payment. */
  failure_url?: string;

  /** Optional: The URL for receiving webhook events. */
  webhook_endpoint?: string;

  /** Optional: A description of the checkout. */
  description?: string;

  /** Optional: The language of the checkout page. */
  locale?: 'ar' | 'en' | 'fr';

  /** Optional: Indicates who will pay the Chargily Pay fees. */
  pass_fees_to_customer?: boolean;

  /** Optional: The ID of an existing customer. */
  customer_id?: string;

  /** Optional: The shipping address for the checkout. */
  shipping_address?: string;

  /** Optional: Indicates whether the shipping address should be collected. */
  collect_shipping_address?: boolean;

  /** Optional
: Additional information about the checkout. */
  metadata?: Record<string, any>;
}
