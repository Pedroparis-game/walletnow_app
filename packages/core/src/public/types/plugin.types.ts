/**
 * WalletNow Protocol — Plugin Types
 *
 * Tipos do sistema de plugins e capabilities.
 * ADR-000: INVARIANT-015 — CapabilityDescriptor com metadados completos.
 */

/** Permissões que uma Capability pode solicitar */
export type Permission =
  | 'storage.read'
  | 'storage.write'
  | 'network.read'
  | 'network.write'
  | 'signer.sign'
  | 'signer.keygen'
  | 'auth.read'
  | 'events.emit';

/** Ciclo de vida de uma Capability */
export type CapabilityLifecycle = 'session' | 'persistent' | 'request';

/**
 * Descritor completo de uma Capability.
 * Obrigatório para todo plugin que registra uma Capability (INVARIANT-015).
 */
export interface CapabilityDescriptor {
  /** Identificador único: 'passkeys', 'gasless', 'rwa' */
  readonly id: string;
  /** Versão semver: '1.0.0' */
  readonly version: string;
  /** IDs de outras capabilities que devem estar instaladas antes */
  readonly dependencies: string[];
  /** Se esta capability expõe APIs instáveis (sujeitas a mudança) */
  readonly experimental: boolean;
  /** Permissões que esta capability necessita */
  readonly permissions: Permission[];
  /** Duração da capability */
  readonly lifecycle: CapabilityLifecycle;
  /**
   * Prioridade de execução dos hooks no Transaction Pipeline.
   * Maior = executa primeiro. Range: 0–100. Padrão: 50.
   * ADR-000: 2.0.2
   */
  readonly priority: number;
}

/** Status de saúde de um plugin */
export type PluginHealthStatusValue = 'healthy' | 'degraded' | 'unhealthy';

/** Resultado do health check de um plugin */
export interface PluginHealthStatus {
  readonly status: PluginHealthStatusValue;
  readonly message?: string;
  readonly details?: Record<string, unknown>;
  readonly checkedAt: number;
}

/** Resultado do health check de todos os plugins instalados */
export type PluginsHealthReport = Record<string, PluginHealthStatus>;
