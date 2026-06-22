/**
 * @walletnow/core — Public API Barrel
 *
 * Este é o único ponto de importação pública do pacote.
 * Nada em src/internal/ deve ser importado por consumidores externos.
 *
 * ADR-000: INVARIANT-001 — Zero dependências de runtime.
 * ADR-000: INVARIANT-008 — API pública segue SemVer estrito.
 *
 * @example
 * import { WalletNow } from '@walletnow/core';
 * import type { WalletNowConfig, WalletAccount } from '@walletnow/core';
 */

// ─── Kernel ───────────────────────────────────────────────────────────────
export { WalletNow } from './WalletNow.js';
export type { KernelState } from './WalletNow.js';

// ─── Types ────────────────────────────────────────────────────────────────
export type * from './types/index.js';

// ─── Errors ───────────────────────────────────────────────────────────────
export {
  WalletNowError,
  AuthenticationError,
  StorageError,
  GasError,
  TransactionError,
  NetworkError,
  RecoveryError,
  ValidationError,
  SignerError,
  PluginError,
  StateError,
} from './errors/index.js';

// ─── Interfaces (Contracts) ───────────────────────────────────────────────
export type {
  IStorageProvider,
  IAuthProvider,
  ISignerProvider,
  IChainProvider,
  IRPCProvider,
  ILoggerProvider,
  LogLevel,
} from './interfaces/index.js';

// ─── Capabilities ─────────────────────────────────────────────────────────
export type {
  IWalletCapability,
  IAccountsCapability,
  IAccountsQuery,
  IAccountsCommand,
  ITransactionsCapability,
  ITransactionsQuery,
  ITransactionsCommand,
  IAssetsCapability,
  IAssetsQuery,
  IGasCapability,
} from './capabilities/index.js';

// ─── Events ───────────────────────────────────────────────────────────────
export { EventEmitter } from './events/EventEmitter.js';
export type {
  WalletNowEvents,
  WalletNowEventName,
  EventHandler,
  UnsubscribeEvent,
} from './types/event.types.js';

// ─── Plugins ──────────────────────────────────────────────────────────────
export type { IPlugin } from './plugins/IPlugin.js';
export type { IPluginHooks, NextFn, NextResultFn } from './plugins/IPluginHooks.js';
export { PluginRegistry } from './plugins/PluginRegistry.js';
export { CapabilityRegistry } from './context/index.js';
export type {
  WalletNowContext,
  ExecutionContext,
  ExecutionContextFactory,
} from './context/index.js';
