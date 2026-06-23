/**
 * WalletNow Protocol — Context
 *
 * Módulo de contexto de execução e inicialização do protocolo.
 * Centralizado aqui para evitar dependências circulares com o Kernel e Plugins.
 */

import type { IStorageProvider } from '../interfaces/IStorageProvider.js';
import type { IAuthProvider } from '../interfaces/IAuthProvider.js';
import type { ILoggerProvider } from '../interfaces/ILoggerProvider.js';
import type { IChainProvider } from '../interfaces/IChainProvider.js';
import type { IRPCProvider } from '../interfaces/IRPCProvider.js';
import type { ISignerProvider } from '../interfaces/ISignerProvider.js';
import type { WalletNowConfig } from '../types/config.types.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { PluginError } from '../errors/PluginError.js';

/** Fábrica de ExecutionContexts para plugins */
export interface ExecutionContextFactory {
  create(operationId?: string): ExecutionContext;
}

/** Contexto de execução por operação — mutável e isolado */
export interface ExecutionContext {
  readonly parent: WalletNowContext;
  readonly operationId: string;
  readonly startedAt: number;
  readonly metadata: Map<string, unknown>;
  abort(reason?: string): void;
  isAborted(): boolean;
}

/** Registro de Capabilities instaladas pelos plugins */
export class CapabilityRegistry {
  private readonly registry = new Map<string, unknown>();

  register(id: string, capability: unknown): void {
    if (this.registry.has(id)) {
      throw new PluginError(
        'CAPABILITY_ALREADY_REGISTERED',
        `Capability '${id}' is already registered. Each capability ID must be unique.`,
        { id },
      );
    }
    this.registry.set(id, capability);
  }

  get<T = unknown>(id: string): T | undefined {
    return this.registry.get(id) as T | undefined;
  }

  has(id: string): boolean {
    return this.registry.has(id);
  }

  listIds(): string[] {
    return Array.from(this.registry.keys());
  }
}

import type { IntegrationEngine } from '../os/IntegrationEngine.js';

/**
 * Struct compartilhado com todos os subsistemas e plugins.
 * Imutável após boot(). Congelado via Object.freeze().
 * ADR-000: INVARIANT-014
 */
export interface WalletNowContext {
  readonly config: WalletNowConfig;
  readonly storage: IStorageProvider;
  readonly auth: IAuthProvider;
  readonly logger: ILoggerProvider;
  readonly chain: IChainProvider;
  readonly rpc: IRPCProvider;
  readonly signer: ISignerProvider;
  readonly events: EventEmitter;
  readonly capabilities: CapabilityRegistry;
  readonly integrations: IntegrationEngine;
  /** Fábrica de contextos de execução por operação — ADR-000: 2.0.1 */
  readonly executionFactory: ExecutionContextFactory;
}
