/**
 * WalletNow Protocol — Event Types
 *
 * Tipos do sistema de eventos global.
 * ADR-000: INVARIANT-007 — Todo evento segue namespace {domain}.{action}
 */

import type { WalletAccount, WalletConnectResult } from './wallet.types.js';
import type { Transaction, TransactionResult } from './transaction.types.js';
import type { AssetBalance } from './asset.types.js';
import type { NetworkConfig } from './network.types.js';
import type { SponsorRequest, SponsorResponse } from './gas.types.js';
import type { WalletNowError } from '../errors/WalletNowError.js';

/**
 * Catálogo oficial de todos os eventos do protocolo.
 * Namespace obrigatório: {domain}.{action}
 * ADR-000 v1.1.0 — Seção 2.4
 */
export interface WalletNowEvents {
  // Kernel
  'kernel.booted':           { plugins: string[] };
  'kernel.shutdown':         void;
  'plugin.loaded':           { id: string; version: string };
  'plugin.unloaded':         { id: string };

  // Wallet / Identity
  'wallet.connected':        WalletConnectResult;
  'wallet.disconnected':     void;

  // Account
  'account.imported':        WalletAccount;
  'account.switched':        WalletAccount;

  // Vault / Security
  'vault.unlocked':          void;
  'vault.locked':            void;

  // Transaction Pipeline
  'transaction.built':       Transaction;
  'transaction.validated':   Transaction;
  'transaction.signed':      Transaction;
  'transaction.sent':        Transaction;
  'transaction.confirmed':   TransactionResult;
  'transaction.failed':      { transaction: Transaction; error: WalletNowError };

  // Gas / Sponsor
  'gas.sponsor.requested':   SponsorRequest;
  'gas.sponsor.completed':   SponsorResponse;
  'gas.sponsor.failed':      { request: SponsorRequest; error: WalletNowError };

  // Assets
  'assets.balance.changed':  AssetBalance[];

  // Network
  'network.changed':         NetworkConfig;
  'network.disconnected':    void;

  // Recovery
  'recovery.started':        void;
  'recovery.completed':      WalletAccount;
  'recovery.failed':         WalletNowError;

  // Errors
  'error':                   WalletNowError;
}

/** Nomes de todos os eventos do protocolo */
export type WalletNowEventName = keyof WalletNowEvents;

/** Handler tipado de um evento */
export type EventHandler<TEvents, K extends keyof TEvents> = (payload: TEvents[K]) => void | Promise<void>;

/** Função de cancelamento de assinatura de evento */
export type UnsubscribeEvent = () => void;
