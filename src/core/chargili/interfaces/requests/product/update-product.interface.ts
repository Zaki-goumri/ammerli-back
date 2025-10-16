export interface UpdateProductParams {
  /** Optional: The name of the product. */
  name?: string;

  /** Optional: The description of the product. */
  description?: string;

  /** Optional: URLs of images of the product. */
  images?: string[];

  /** Optional: A set of key-value pairs for additional information about the product. */
  metadata?: Record<string, any>;
}
