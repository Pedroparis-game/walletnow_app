/**
 * WalletNow Protocol — Asset Types
 *
 * Representa ativos Stellar e saldos on-chain.
 */

import type { AssetIdentifier } from './transaction.types.js';

/** Tipo de ativo */
export type AssetType = 'native' | 'credit_alphanum4' | 'credit_alphanum12' | 'liquidity_pool_shares';

/** Ativo Stellar completo com metadados */
export interface StellarAsset extends AssetIdentifier {
  readonly type: AssetType;
  /** Nome completo do ativo (enriquecido via TOML) */
  readonly name?: string;
  /** URL do ícone (enriquecido via TOML) */
  readonly image?: string;
  /** Domínio do emissor (enriquecido via TOML) */
  readonly domain?: string;
}

/** Saldo de um ativo em uma conta */
export interface AssetBalance {
  readonly asset: StellarAsset;
  /** Saldo disponível como string para preservar precisão */
  readonly balance: string;
  /** Saldo reservado pelo protocolo Stellar */
  readonly reserved?: string;
  /** Se a trustline está autorizada */
  readonly isAuthorized?: boolean;
  /** Limite da trustline */
  readonly limit?: string;
}

/** Lista de saldos de uma conta */
export interface AccountBalances {
  readonly publicKey: string;
  readonly balances: AssetBalance[];
  readonly fetchedAt: number;
}
