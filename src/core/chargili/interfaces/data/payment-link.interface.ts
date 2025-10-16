/** Represents a payment link object with details for a transaction. */
export interface PaymentLink {
  /* Unique identifier of the payment link. */
  id: string;

  /** A string representing the type of the object. */
  entity: string;

  /** True for Live Mode, False for Test Mode. */
  livemode: boolean;

  /** The name or title of the payment

link. */
  name: string;

  /** Indicates whether the payment link is active and can be used by customers. */
  active: boolean;

  /** A message to be displayed to the customer after a successful payment. */
  after_completion_message: string;

  /** The language of the checkout page associated with the payment link. */
  locale: 'ar' | 'en' | 'fr';

  /** Indicates whether the Chargily Pay fees will be paid by the merchant or passed to the customers. */
  pass_fees_to_customer: boolean;

  /** A set of key-value pairs that can be used to store additional information about the payment link. */
  metadata: Record<string, any>;

  /** Timestamp indicating when the payment link was created. */
  created_at: number;

  /** Timestamp indicating when the payment link was last updated. */
  updated_at: number;

  /** Indicates whether the customer is prompted to provide a shipping address. */
  collect_shipping_address: boolean;

  /** The URL of the payment link that customers can visit to make a payment. */
  url: string;
}
