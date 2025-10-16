/** Represents an individual item within a checkout. */
export interface CheckoutItem {
  /* Unique identifier of the checkout item. */
  id: string;

  /** A string representing the type of the object, "price" in this context. */
  entity: string;

  /** The amount specified for this checkout item. */
  amount: number;

  /** The quantity of the item being purchased. */
  quantity: number;

  /** The currency code for the item, e.g., "dzd". */
  currency: string;

  /** Metadata associated with the item. Can be null. */
  metadata: Record<string, any> | null;

  /** Timestamp indicating when the checkout item was created. */
  created_at: number;

  /** Timestamp indicating when the checkout item was last updated. */
  updated_at: number;

  /** The product ID associated with this checkout item. */
  product_id: string;
}
