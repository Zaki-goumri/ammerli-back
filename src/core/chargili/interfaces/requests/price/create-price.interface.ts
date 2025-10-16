export interface CreatePriceParams {
  /** Required: The amount to be charged. */
  amount: number;

  /** Required: A lowercase ISO currency code, e.g., "dzd". */
  currency: string;

  /** Required: The ID of the product. */
  product_id: string;

  /** Optional: A set of key-value pairs for additional information. */
  metadata?: Record<string, any>;
}
