import { Address } from 'cluster';

export interface UpdateCustomerParams {
  /** Optional: The name of the customer. */
  name?: string;

  /** Optional: The email address of the customer. */
  email?: string;

  /** Optional: The phone number of the customer. */
  phone?: string;

  /** Optional: The address of the customer, with all fields inside also being optional. */
  address?: Partial<Address>;

  /** Optional: A set of key-value pairs for additional information about the customer. */
  metadata?: Record<string, any>;
}
