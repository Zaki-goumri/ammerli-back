/** Represents a price object associated with a product. */
export interface ProductPrice {
  /** Unique identifier of the price. */
  id: string;

  /** A string representing the type of the object, "price" in this context. */
  entity: string;

  /** The amount specified for this price. */
  amount: number;

  /** The currency code for the price, e.g., "dzd". */
  currency: string;

  /** Metadata associated with the price. Can be null. */
  metadata: Record<string, any> | null;

  /** Timestamp indicating when the price was created. */
  created_at: number;

  /** Timestamp indicating when the price was last updated. */
  updated_at: number;

  /** The product ID associated with this price. */
  product_id: string;
}
