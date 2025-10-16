/**
 * Represents the response received upon the deletion of an item via the Chargily API.
 */
export interface DeleteItemResponse {
  /** Indicates if the operation was performed in live mode or test mode. */
  livemode: boolean;

  /** The unique identifier of the item that was deleted. */
  id: string;

  /** A string representing the type of the object that was deleted. */
  entity: string;

  /** A boolean indicating whether the deletion was successful. */
  deleted: boolean;
}
