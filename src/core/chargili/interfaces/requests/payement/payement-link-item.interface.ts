export interface PaymentLinkItemParams {
  /** Required: The ID of the Price associated with the item. */
  price: string;

  /** Required: The quantity of the item being offered. */
  quantity: number;

  /** Optional: Indicates if the quantity is adjustable by the customer. Defaults to false. */
  adjustable_quantity?: boolean;
}
