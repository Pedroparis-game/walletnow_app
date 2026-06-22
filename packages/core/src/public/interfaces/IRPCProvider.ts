/**
 * WalletNow Protocol — IRPCProvider
 *
 * Contrato de comunicação com o nó da rede Stellar.
 * Separado de IChainProvider (identidade da rede).
 * ADR-000: Seção 2.1
 *
 * Implementações possíveis: Horizon, SorobanRPC, QuickNode, Stellar Expert.
 */

import type {
  AccountRecord,
  TransactionRecord,
  SubmitTransactionResult,
  BalanceStreamCallback,
  Unsubscribe,
} from '../types/network.types.js';

export interface IRPCProvider {
  /** Busca dados da conta no ledger atual. */
  getAccount(publicKey: string): Promise<AccountRecord>;

  /** Submete uma transação XDR assinada ao ledger. */
  submitTransaction(xdr: string): Promise<SubmitTransactionResult>;

  /** Busca histórico de transações de uma conta. */
  getTransactions(publicKey: string, limit?: number): Promise<TransactionRecord[]>;

  /**
   * Subscreve para atualizações de saldo em tempo real.
   * @returns função de cancelamento
   */
  streamBalance(publicKey: string, callback: BalanceStreamCallback): Unsubscribe;

  /** Verifica se há conectividade com o nó RPC. */
  isAvailable(): Promise<boolean>;
}
