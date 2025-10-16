import { UpdatePaymentLinkItem } from './update-payement-link-item.interface';

export interface UpdatePaymentLinkParams {
  /** Optional: A descriptive name for the payment link. */
  name?: string;

  /** Optional: An array of items included in the payment link. */
  items?: UpdatePaymentLinkItem[];

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
