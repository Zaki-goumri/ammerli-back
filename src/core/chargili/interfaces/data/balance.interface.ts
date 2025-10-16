import { Wallet } from './wallet.interface';

/** Represents the balance object containing wallet information. */
export interface Balance {
  /** A string representing the type of the object. */
  entity: string;

  /** True for Live Mode, False for Test Mode. */
  livemode: boolean;

  /** An array of wallet objects for each currency. */
  wallets: Wallet[];
}
