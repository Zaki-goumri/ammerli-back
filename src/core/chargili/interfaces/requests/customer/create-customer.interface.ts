import { Address } from '../../data';

export interface CreateCustomerParams {
  /** The name of the customer. */
  name?: string;

  /** The email address of the customer. */
  email?: string;

  /** The phone number of the customer. */
  phone?: string;

  /** The address of the customer. */
  address?: Address;

  /** A set of key-value pairs for additional information about the customer. */
  metadata?: Record<string, any>;
}
