/**
 * WalletNow Protocol — IPluginHooks
 *
 * Contratos de interceptação do Transaction Pipeline.
 * ADR-000: INVARIANT-013 — Pipeline é Strategy; cada etapa interceptável.
 * ADR-000: 2.0.3 — around* hooks para wrapping de etapas inteiras.
 *
 * Ordem de execução: priority do CapabilityDescriptor (maior = primeiro).
 */

import type { TransactionParams, Transaction, TransactionResult } from '../types/transaction.types.js';
import type { WalletNowContext } from '../context/index.js';

/** Tipo da função next() para hooks around */
export type NextFn<T> = (value: T) => Promise<T>;
export type NextResultFn<T, R> = (value: T) => Promise<R>;

export interface IPluginHooks {
  // ─── Transaction Pipeline: Build ───────────────────────────────────
  beforeBuild?(params: TransactionParams, ctx: WalletNowContext): Promise<TransactionParams>;
  afterBuild?(tx: Transaction, ctx: WalletNowContext): Promise<Transaction>;

  // ─── Transaction Pipeline: Validate ────────────────────────────────
  beforeValidate?(tx: Transaction, ctx: WalletNowContext): Promise<Transaction>;
  afterValidate?(tx: Transaction, ctx: WalletNowContext): Promise<Transaction>;

  // ─── Transaction Pipeline: Sign ────────────────────────────────────
  beforeSign?(tx: Transaction, ctx: WalletNowContext): Promise<Transaction>;
  afterSign?(tx: Transaction, ctx: WalletNowContext): Promise<Transaction>;
  /** Envolve a etapa Sign inteira — útil para telemetria e timeouts */
  aroundSign?(tx: Transaction, ctx: WalletNowContext, next: NextFn<Transaction>): Promise<Transaction>;

  // ─── Transaction Pipeline: Sponsor ─────────────────────────────────
  beforeSponsor?(tx: Transaction, ctx: WalletNowContext): Promise<Transaction>;
  afterSponsor?(tx: Transaction, ctx: WalletNowContext): Promise<Transaction>;

  // ─── Transaction Pipeline: Submit ──────────────────────────────────
  beforeSubmit?(tx: Transaction, ctx: WalletNowContext): Promise<Transaction>;
  afterSubmit?(result: TransactionResult, ctx: WalletNowContext): Promise<void>;
  /** Envolve a etapa Submit inteira — útil para retry e logging de latência */
  aroundSubmit?(
    tx: Transaction,
    ctx: WalletNowContext,
    next: NextResultFn<Transaction, TransactionResult>,
  ): Promise<TransactionResult>;

  // ─── Kernel Lifecycle ──────────────────────────────────────────────
  onBoot?(ctx: WalletNowContext): Promise<void>;
  onShutdown?(): Promise<void>;
}
