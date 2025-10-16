/** Represents an individual item within a payment link. */
export interface PaymentLinkItem {
  /* Unique identifier of the payment link item. */
  id: string;

  /** A string representing the type of the object, "price" in this context. */
  entity: string;

  /** The amount specified for this payment link item. */
  amount: number;

  /** The quantity of the item offered in the payment link. */
  quantity: number;

  /** Indicates if the quantity is adjustable by the customer. */
  adjustable_quantity: boolean;

  /** The currency code for the item, e.g., "dzd". */
  currency: string;

  /** Metadata associated with the item. Can be null. */
  metadata: Record<string, any> | null;

  /** Timestamp indicating when the payment link item was created. */
  created_at: number;

  /** Timestamp indicating when the payment link item was last updated. */
  updated_at: number;

  /** The product ID associated with this payment link item. */
  product_id: string;
}
