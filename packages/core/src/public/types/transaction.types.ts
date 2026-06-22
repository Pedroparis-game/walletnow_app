/**
 * WalletNow Protocol — Transaction Types
 *
 * Ciclo de vida completo de uma transação Stellar no protocolo.
 * O pipeline: Build → Validate → Sign → Sponsor → Submit → Confirm
 */

/** Etapas do Transaction Pipeline */
export type TransactionStage =
  | 'building'
  | 'validating'
  | 'signing'
  | 'sponsoring'
  | 'submitting'
  | 'confirming'
  | 'confirmed'
  | 'failed';

/** Status final de uma transação */
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

/** Representação de uma transação no protocolo */
export interface Transaction {
  /** Hash único da transação */
  readonly hash: string;
  /** XDR da transação */
  readonly xdr: string;
  /** Etapa atual no pipeline */
  readonly stage: TransactionStage;
  /** Status final (disponível após confirmed/failed) */
  readonly status?: TransactionStatus;
  /** Ledger em que foi confirmada */
  readonly ledger?: number;
  /** Timestamp de criação local */
  readonly createdAt: number;
  /** Metadados extras (resultado do Horizon, erros parciais) */
  readonly metadata?: Record<string, unknown>;
}

/** Parâmetros para construir e enviar uma transação */
export interface TransactionParams {
  readonly sourcePublicKey: string;
  readonly destination: string;
  readonly amount: string;
  readonly asset: AssetIdentifier;
  readonly memo?: TransactionMemo;
  readonly timeoutSeconds?: number;
}

/** Identificador de ativo Stellar */
export interface AssetIdentifier {
  /** 'native' para XLM, ou código do asset */
  readonly code: string;
  /** Issuer (undefined para XLM nativo) */
  readonly issuer?: string;
}

/** Memo de uma transação */
export interface TransactionMemo {
  readonly type: 'text' | 'id' | 'hash' | 'return' | 'none';
  readonly value?: string;
}

/** Resultado de uma transação confirmada */
export interface TransactionResult {
  readonly hash: string;
  readonly ledger: number;
  readonly status: 'confirmed' | 'failed';
  readonly fee: string;
  readonly confirmedAt: number;
}
