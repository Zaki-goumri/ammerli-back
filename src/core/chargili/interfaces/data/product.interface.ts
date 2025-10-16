/** Represents a product with its details and associated metadata. */
export interface Product {
  /** Unique identifier of the product. */
  id: string;

  /** A string representing the type of the object. */
  entity: string;

  /** True for Live Mode, False for Test Mode. */
  livemode: boolean;

  /** Name of the product. */
  name: string;

  /** Description of the product. Can be null if not provided. */
  description: string | null;

  /** Array of image URLs associated with the product. */
  images: string[];

  /** A set of key-value pairs that can be used to store additional information about the product. */
  metadata: Record<string, any>;

  /** Timestamp indicating when the product was created. */
  created_at: number;

  /** Timestamp indicating when the product was last updated. */
  updated_at: number;
}
