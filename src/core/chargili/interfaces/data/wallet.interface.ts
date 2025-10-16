/** Represents a wallet with its currency and balances. */
export interface Wallet {
  /** A lowercase ISO currency code. */
  currency: string;

  /** The total balance available in the wallet. */
  balance: number;

  /** The amount available for payout. */
  ready_for_payout: number;

  /** The amount currently on hold. */
  on_hold: number;
}
