/**
 * @walletnow/wallet — Public API
 */

export { WalletEngine } from './WalletEngine.js';
export { AccountEngine } from './AccountEngine.js';

// Re-exporta contratos do wallet
export type {
  IWalletEngine,
  IWalletAdapter,
  StellarWallet,
  WalletId,
  WalletCustodyType,
  CreateWalletParams,
  ImportWalletParams,
  CreateWalletAdapterParams,
  IAccountEngine,
  StellarAccountState,
  StellarSigner,
} from '@walletnow/contracts';
