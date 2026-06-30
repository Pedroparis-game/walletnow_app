/**
 * @walletnow/wallet — Wallet & Account Types
 *
 * Tipos para o Wallet Engine e Account Engine do WalletNow OS.
 * Foco exclusivo na rede Stellar.
 *
 * Hierarquia:
 *   Identity → Wallet (este módulo) → Account → Asset
 */

import type { IdentityId } from '@walletnow/identity';

// ─── Wallet ───────────────────────────────────────────────────────────────────

/** Tipo de custódia da wallet */
export type WalletCustodyType =
  | 'self-custody'   // Chave privada sob controle do usuário (Passkeys ou importada)
  | 'readonly';      // Apenas observação, sem capacidade de assinar

/** Status operacional da wallet */
export type WalletStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'locked';

/** Identificador único de uma Wallet */
export type WalletId = string;

/**
 * Wallet — representa a carteira Stellar do usuário.
 * Uma Wallet pertence a uma Identity e contém N Accounts.
 *
 * Na rede Stellar, uma Wallet é essencialmente associada a um par de chaves
 * (private key → public key = endereço Stellar G...).
 */
export interface StellarWallet {
  readonly id: WalletId;
  /** Identity proprietária desta wallet */
  readonly identityId: IdentityId;
  /** Public key Stellar principal (G...) — nunca a chave privada */
  readonly publicKey: string;
  /** Rede para a qual esta wallet foi criada */
  readonly network: 'mainnet' | 'testnet';
  /** Tipo de custódia */
  readonly custodyType: WalletCustodyType;
  /** Label legível (ex: "Carteira Principal", "Conta de Trading") */
  readonly label?: string;
  /** Timestamp de criação */
  readonly createdAt: number;
  /** Se esta é a wallet ativa no contexto atual */
  readonly isActive: boolean;
}

// ─── Account ──────────────────────────────────────────────────────────────────

/** Identificador único de uma Account */
export type AccountId = string;

/**
 * StellarAccount — representa um endereço (conta) específico na rede Stellar.
 *
 * Enquanto uma Wallet é o objeto lógico de custódia, uma Account é o mapeamento
 * direto com o ledger Stellar: é o que tem XLM, trustlines, e histórico.
 */
export interface StellarAccount {
  readonly id: AccountId;
  /** Wallet à qual esta conta pertence */
  readonly walletId: WalletId;
  /** Endereço Stellar (G...) */
  readonly publicKey: string;
  /** Sequence number no ledger (null se conta não ativada) */
  readonly sequenceNumber: string | null;
  /** Se a conta existe e está ativa no ledger Stellar */
  readonly isActivated: boolean;
  /** Número de subentradas (trustlines + ofertas + signers) */
  readonly subentryCount: number;
  /** Label legível opcional */
  readonly label?: string;
  /** Timestamp do último sync com o ledger */
  readonly lastSyncAt: number;
}

/** Thresholds de segurança de uma conta Stellar */
export interface AccountThresholds {
  readonly low: number;
  readonly medium: number;
  readonly high: number;
}

/** Estado completo de uma conta no ledger Stellar */
export interface AccountOnChainState {
  readonly publicKey: string;
  readonly exists: boolean;
  readonly xlmBalance: string;          // Em XLM (não stroops)
  readonly sequenceNumber: string;
  readonly subentryCount: number;
  readonly thresholds: AccountThresholds;
  readonly trustlines: StellarTrustline[];
}

/** Trustline de um ativo na conta Stellar */
export interface StellarTrustline {
  readonly assetCode: string;
  readonly assetIssuer: string;
  readonly balance: string;
  readonly limit: string;
  readonly isAuthorized: boolean;
}

// ─── Wallet Import ────────────────────────────────────────────────────────────

/** Parâmetros para importar uma wallet via secret key */
export interface ImportWalletParams {
  readonly secretOrMnemonic: string;
  readonly label?: string;
  readonly network?: 'mainnet' | 'testnet';
  readonly setAsActive?: boolean;
}

/** Parâmetros para criar uma wallet via Passkeys (derivada da identity) */
export interface CreateWalletFromIdentityParams {
  readonly identityId: IdentityId;
  readonly label?: string;
  readonly network?: 'mainnet' | 'testnet';
}
