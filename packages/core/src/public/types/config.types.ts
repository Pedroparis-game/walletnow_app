/**
 * WalletNow Protocol — Config Types
 *
 * Estrutura completa de configuração do Kernel.
 * ADR-000: Seção 2.0 — Configuration Layer separada.
 */

import type { NetworkConfig } from './network.types.js';
import type { GasConfig } from './gas.types.js';
import type { IStorageProvider } from '../interfaces/IStorageProvider.js';
import type { IAuthProvider } from '../interfaces/IAuthProvider.js';
import type { ILoggerProvider } from '../interfaces/ILoggerProvider.js';
import type { IChainProvider } from '../interfaces/IChainProvider.js';
import type { IRPCProvider } from '../interfaces/IRPCProvider.js';
import type { ISignerProvider } from '../interfaces/ISignerProvider.js';

/** Configuração dos providers injetados */
export interface ProvidersConfig {
  /** Provider de persistência (obrigatório) */
  readonly storage: IStorageProvider;
  /** Provider de autenticação (obrigatório) */
  readonly auth: IAuthProvider;
  /** Provider de logging (opcional — usa NoopLogger por padrão) */
  readonly logger?: ILoggerProvider;
  /** Provider de rede — Chain info (opcional — usa defaults da network) */
  readonly chain?: IChainProvider;
  /** Provider de RPC — chamadas ao nó (opcional — usa Horizon padrão) */
  readonly rpc?: IRPCProvider;
  /** Provider de assinatura (opcional — usa InMemorySigner por padrão) */
  readonly signer?: ISignerProvider;
}

/** Configurações de segurança */
export interface SecurityConfig {
  /** Se requer hardware key (Ledger, Passkey) para operações de alto risco */
  readonly requireHardwareKey: boolean;
  /** Timeout de sessão em segundos (padrão: 3600) */
  readonly sessionTimeout?: number;
  /** Se permite armazenamento de chaves em plaintext como fallback */
  readonly allowPlaintextFallback: boolean;
}

/** Feature flags do protocolo */
export interface FeatureFlags {
  readonly enablePasskeys?: boolean;
  readonly enableGasless?: boolean;
  readonly enableRWA?: boolean;
  readonly enableSessions?: boolean;
  readonly enableCheckout?: boolean;
}

/** Configuração completa do Kernel — entrada do WalletNow.init() */
export interface WalletNowConfig {
  readonly network: NetworkConfig;
  readonly security: SecurityConfig;
  readonly providers: ProvidersConfig;
  readonly gas?: GasConfig;
  readonly features?: FeatureFlags;
}

// Re-exporta tipos de rede utilizados na config
export type { NetworkConfig } from './network.types.js';
