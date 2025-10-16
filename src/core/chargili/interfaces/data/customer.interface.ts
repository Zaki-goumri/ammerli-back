import { Address } from 'cluster';

/** Represents a customer with their personal and contact information. */
export interface Customer {
  /** Unique identifier of the customer. */
  id: string;

  /** A string representing the type of the object. */
  entity: string;

  /** True for Live Mode, False for Test Mode. */
  livemode: boolean;

  /** Full name of the customer. */
  name: string;

  /** Email address of the customer. Can be null if not provided. */
  email: string | null;

  /** Phone number of the customer. Can be null if not provided. */
  phone: string | null;

  /** Physical address of the customer. Can be null if not provided. */
  address: Address | null;

  /** A set of key-value pairs that can be used to store additional information about the customer. */
  metadata: Record<string, any>;

  /** Timestamp indicating when the customer was created. */
  created_at: number;

  /** Timestamp indicating when the customer was last updated. */
  updated_at: number;
}
