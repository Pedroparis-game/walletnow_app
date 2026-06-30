/**
 * @walletnow/sdk — Public API
 *
 * Ponto de entrada unificado do WalletNow OS para builders.
 *
 * Este pacote é o único que você precisa instalar:
 *   npm install @walletnow/sdk
 *
 * Ele agrega todos os subpacotes internos:
 *   @walletnow/core     → Kernel, EventEmitter legado, Errors, Types
 *   @walletnow/identity → Identity Engine (Passkeys, FIDO2, Keypair)
 *   @walletnow/wallet   → Wallet Engine, Account Engine (Stellar)
 *   @walletnow/providers→ Provider Registry, EventBus, Manifests, WalletNowOS
 *
 * @example — Inicialização em 3 linhas:
 *
 * import { WalletNowOS } from '@walletnow/sdk';
 *
 * const os = new WalletNowOS();
 * await os.boot({ network: 'testnet', debug: true });
 *
 * const identity = await os.identity.create({ method: 'passkeys' });
 * const wallet = await os.wallet.createFromIdentity({ identityId: identity.id });
 * console.log(wallet.publicKey); // G...
 *
 * @example — Registrando providers:
 *
 * import { WalletNowOS, SoroswapProvider } from '@walletnow/sdk';
 *
 * const os = new WalletNowOS();
 * await os.register(new SoroswapProvider());
 * await os.register(new DefindexProvider());
 * await os.boot({ network: 'mainnet' });
 */

// ─── OS Principal ─────────────────────────────────────────────────────────────
export { WalletNowOS } from '@walletnow/providers/os/WalletNowOS.js';
export type { WalletNowOSConfig, OSState } from '@walletnow/providers/os/WalletNowOS.js';

// ─── EventBus ─────────────────────────────────────────────────────────────────
export { WalletNowEventBus, eventBus } from '@walletnow/providers/eventbus/EventBus.js';
export type {
  WalletNowOSEvents,
  WalletNowOSEventName,
  OSEventHandler,
  Unsubscribe,
} from '@walletnow/providers/eventbus/EventBus.js';

// ─── Provider Registry ────────────────────────────────────────────────────────
export { ProviderRegistry } from '@walletnow/providers/registry/ProviderRegistry.js';
export type {
  IWalletNowProvider,
  WalletNowProviderManifest,
  ProviderCapability,
  StellarNetwork,
  ProviderHealthStatus,
  ProviderHealthResult,
} from '@walletnow/providers/manifest/ProviderManifest.js';

// ─── Identity Engine ──────────────────────────────────────────────────────────
export type { IIdentityEngine } from '@walletnow/identity';
export type {
  Identity,
  IdentityId,
  IdentityStatus,
  IdentityAuthMethod,
  IdentitySession,
  IdentityAuthResult,
  CreateIdentityParams,
  CreateIdentityWithPasskeyParams,
  CreateIdentityWithKeypairParams,
  CreateIdentityReadonlyParams,
} from '@walletnow/identity';
export { IdentityError } from '@walletnow/identity';
export type { IdentityErrorCode } from '@walletnow/identity';

// ─── Wallet & Account Engine ──────────────────────────────────────────────────
export type { IWalletEngine, IAccountEngine } from '@walletnow/wallet';
export type {
  StellarWallet,
  WalletId,
  WalletCustodyType,
  WalletStatus,
  StellarAccount,
  AccountId,
  AccountOnChainState,
  StellarTrustline,
  ImportWalletParams,
  CreateWalletFromIdentityParams,
} from '@walletnow/wallet';

// ─── Core Kernel (Tipos & Errors Base) ───────────────────────────────────────
// Re-exportamos apenas o essencial do core para não poluir o namespace do SDK
export {
  WalletNowError,
  ValidationError,
  NetworkError,
  TransactionError,
} from '@walletnow/core';
export type {
  WalletNowConfig,
  NetworkConfig,
  NetworkType,
} from '@walletnow/core';
