import type { IChainProvider } from '@walletnow/core';
import type { NetworkInfo, NetworkType } from '@walletnow/core';
import { Networks } from '@stellar/stellar-sdk';

export interface StellarChainOptions {
  type: NetworkType;
  passphrase?: string;
  horizonUrl: string;
  sorobanUrl?: string;
}

export class StellarChainProvider implements IChainProvider {
  private options: StellarChainOptions;

  constructor(options: StellarChainOptions) {
    this.options = options;

    if (this.options.type === 'custom' && !this.options.passphrase) {
      throw new Error('Passphrase is required for custom networks.');
    }
  }

  getNetworkPassphrase(): string {
    if (this.options.type === 'mainnet') return Networks.PUBLIC;
    if (this.options.type === 'testnet') return Networks.TESTNET;
    return this.options.passphrase!;
  }

  getNetworkType(): NetworkType {
    return this.options.type;
  }

  getExplorerUrl(txHash: string): string {
    const isTestnet = this.options.type === 'testnet';
    const baseUrl = isTestnet ? 'https://stellar.expert/explorer/testnet' : 'https://stellar.expert/explorer/public';
    return `${baseUrl}/tx/${txHash}`;
  }

  async isConnected(): Promise<boolean> {
    try {
      const response = await fetch(this.options.horizonUrl);
      return response.ok;
    } catch {
      return false;
    }
  }

  getNetworkInfo(): NetworkInfo {
    return {
      type: this.options.type,
      passphrase: this.getNetworkPassphrase(),
      horizonUrl: this.options.horizonUrl,
      sorobanUrl: this.options.sorobanUrl,
      isConnected: true, // simplified, assuming caller handles dynamic status
    };
  }
}
