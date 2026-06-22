/**
 * WalletNow Protocol — Account Types
 *
 * Representa o estado on-chain de uma conta Stellar.
 * Separado de WalletAccount que é a identidade do protocolo.
 */

/** Informações on-chain de uma conta Stellar */
export interface StellarAccount {
  readonly publicKey: string;
  readonly sequence: string;
  readonly subentryCount: number;
  readonly thresholds: AccountThresholds;
  readonly flags: AccountFlags;
  readonly existsOnChain: boolean;
}

/** Limiares de assinatura da conta */
export interface AccountThresholds {
  readonly lowThreshold: number;
  readonly medThreshold: number;
  readonly highThreshold: number;
}

/** Flags de configuração da conta */
export interface AccountFlags {
  readonly authRequired: boolean;
  readonly authRevocable: boolean;
  readonly authImmutable: boolean;
  readonly clawbackEnabled: boolean;
}

/** Resultado de uma query de estado on-chain */
export interface AccountState {
  readonly account: StellarAccount;
  readonly fetchedAt: number;
  readonly isCached: boolean;
}
