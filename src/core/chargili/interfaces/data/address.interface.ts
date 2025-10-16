/** Represents a physical address with country, state, and detailed address. */
export interface Address {
  /** Two-letter country code (ISO 3166-1 alpha-2). */
  country: string;

  /** The state or region of the address. */
  state: string;

  /** Detailed address line including street name, number, etc. */
  address: string;
}
