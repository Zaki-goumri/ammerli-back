import { PaymentLinkItemParams } from './payement-link-item.interface';

export interface CreatePaymentLinkParams {
  /** Required: A descriptive name for the payment link. */
  name: string;

  /** Required: An array of items included in the payment link. */
  items: PaymentLinkItemParams[];

  /** Optional: A message displayed to the customer after a successful payment. */
  after_completion_message?: string;

  /** Optional: The language of the checkout page. */
  locale?: 'ar' | 'en' | 'fr';

  /** Optional: Indicates who will pay the Chargily Pay fees. */
  pass_fees_to_customer?: boolean;

  /** Optional: Indicates whether the shipping address should be collected. */
  collect_shipping_address?: boolean;

  /** Optional: Additional information about the payment link. */
  metadata?: Record<string, any>;
}
