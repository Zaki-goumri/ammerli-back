/** Represents a price object with additional product association. */
export interface Price {
  /** Unique identifier of the price. */
  id: string;

  /** A string representing the type of the object. */
  entity: string;

  /** True for Live Mode, False for Test Mode. */
  livemode: boolean;

  /** The amount specified for this price. */
  amount: number;

  /** The currency code for the price, e.g., "dzd". */
  currency: string;

  /** The product ID associated with this price. */
  product_id: string;
  /** A set of key-value pairs that can be used to store additional information about the price. */
  metadata: Record<string, any>;

  /** Timestamp indicating when the price was created. */
  created_at: number;

  /** Timestamp indicating when the price was last updated. */
  updated_at: number;
}
