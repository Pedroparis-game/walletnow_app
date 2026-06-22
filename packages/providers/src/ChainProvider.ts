/**
 * WalletNow Protocol — Abstract ChainProvider
 *
 * Identidade e metadados da rede Stellar.
 * Separado de RPCProvider (comunicação com nó).
 */

import type { IChainProvider } from '@walletnow/core';
import type { NetworkInfo, NetworkType } from '@walletnow/core';
import { NetworkError } from '@walletnow/core';

export abstract class ChainProvider implements IChainProvider {
  abstract getNetworkPassphrase(): string;
  abstract getNetworkType(): NetworkType;
  abstract getExplorerUrl(txHash: string): string;
  abstract isConnected(): Promise<boolean>;
  abstract getNetworkInfo(): NetworkInfo;

  protected handleNetworkError(operation: string, error: unknown): never {
    throw new NetworkError(
      'CHAIN_OPERATION_FAILED',
      `Chain operation '${operation}' failed.`,
      { operation, originalError: String(error) },
    );
  }
}

/** Provider pré-configurado para Testnet */
export class TestnetChainProvider extends ChainProvider {
  getNetworkPassphrase(): string {
    return 'Test SDF Network ; September 2015';
  }
  getNetworkType(): NetworkType {
    return 'testnet';
  }
  getExplorerUrl(txHash: string): string {
    return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
  }
  async isConnected(): Promise<boolean> {
    return true; // verificado via RPCProvider
  }
  getNetworkInfo(): NetworkInfo {
    return {
      type: 'testnet',
      passphrase: this.getNetworkPassphrase(),
      horizonUrl: 'https://horizon-testnet.stellar.org',
      isConnected: true,
    };
  }
}

/** Provider pré-configurado para Mainnet */
export class MainnetChainProvider extends ChainProvider {
  getNetworkPassphrase(): string {
    return 'Public Global Stellar Network ; September 2015';
  }
  getNetworkType(): NetworkType {
    return 'mainnet';
  }
  getExplorerUrl(txHash: string): string {
    return `https://stellar.expert/explorer/mainnet/tx/${txHash}`;
  }
  async isConnected(): Promise<boolean> {
    return true;
  }
  getNetworkInfo(): NetworkInfo {
    return {
      type: 'mainnet',
      passphrase: this.getNetworkPassphrase(),
      horizonUrl: 'https://horizon.stellar.org',
      isConnected: true,
    };
  }
}
