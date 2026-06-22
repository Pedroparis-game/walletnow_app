/**
 * WalletNow Protocol — Network Types
 *
 * Separação entre Chain (identidade da rede) e RPC (comunicação com nó).
 * ADR-000: IChainProvider e IRPCProvider são contratos distintos.
 */

/** Tipo de rede Stellar */
export type NetworkType = 'mainnet' | 'testnet' | 'custom';

/** Configuração de rede */
export interface NetworkConfig {
  readonly type: NetworkType;
  readonly horizonUrl?: string;
  readonly sorobanUrl?: string;
  /** Passphrase da rede (obrigatório para 'custom') */
  readonly passphrase?: string;
}

/** Informações de uma rede Stellar */
export interface NetworkInfo {
  readonly type: NetworkType;
  readonly passphrase: string;
  readonly horizonUrl: string;
  readonly sorobanUrl?: string | undefined;
  readonly isConnected: boolean;
}

/** Record retornado pelo Horizon para uma conta */
export interface AccountRecord {
  readonly id: string;
  readonly sequence: string;
  readonly subentryCount: number;
  readonly thresholds: {
    readonly low_threshold: number;
    readonly med_threshold: number;
    readonly high_threshold: number;
  };
}

/** Record retornado pelo Horizon para uma transação */
export interface TransactionRecord {
  readonly id: string;
  readonly hash: string;
  readonly ledger: number;
  readonly createdAt: string;
  readonly sourceAccount: string;
  readonly feeCharged: string;
  readonly successful: boolean;
}

/** Resultado da submissão de uma transação ao Horizon */
export interface SubmitTransactionResult {
  readonly hash: string;
  readonly ledger: number;
  readonly successful: boolean;
  readonly envelopeXdr: string;
  readonly resultXdr: string;
}

/** Callback para streaming de saldos */
export type BalanceStreamCallback = (publicKey: string) => void;

/** Função de cancelamento de stream */
export type Unsubscribe = () => void;
