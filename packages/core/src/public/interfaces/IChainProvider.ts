/**
 * WalletNow Protocol — IChainProvider
 *
 * Contrato de identidade e metadados da rede Stellar.
 * Separado de IRPCProvider (comunicação com nó).
 * ADR-000: Seção 2.1
 */

import type { NetworkInfo, NetworkType } from '../types/network.types.js';

export interface IChainProvider {
  /** Retorna o network passphrase da rede atual. */
  getNetworkPassphrase(): string;

  /** Retorna o tipo de rede atual. */
  getNetworkType(): NetworkType;

  /** Retorna URL do block explorer para um hash de transação. */
  getExplorerUrl(txHash: string): string;

  /** Verifica se há conectividade com a rede. */
  isConnected(): Promise<boolean>;

  /** Retorna informações completas da rede. */
  getNetworkInfo(): NetworkInfo;
}
