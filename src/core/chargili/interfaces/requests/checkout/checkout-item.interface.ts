export interface CheckoutItemParams {
  /** Required: The ID of the Price associated with the item. */
  price: string;

  /** Required: The quantity of the item being purchased. */
  quantity: number;
}
