/**
 * WalletNow Protocol — IPlugin
 *
 * Contrato que todo plugin do protocolo deve implementar.
 * ADR-000: INVARIANT-002 — Plugins nunca se comunicam diretamente.
 * ADR-000: INVARIANT-015 — Todo plugin inclui CapabilityDescriptor.
 * ADR-000: 2.0.5 — health() obrigatório.
 */

import type { CapabilityDescriptor, PluginHealthStatus } from '../types/plugin.types.js';
import type { WalletNowContext } from '../context/index.js';
import type { IPluginHooks } from './IPluginHooks.js';

export interface IPlugin {
  /** Nome único do plugin (ex: '@walletnow/plugins/gasless') */
  readonly name: string;
  /** Versão semver do plugin */
  readonly version: string;
  /** Metadados completos da Capability que este plugin registra */
  readonly descriptor: CapabilityDescriptor;
  /** Hooks opcionais no Transaction Pipeline */
  readonly hooks?: IPluginHooks;

  /**
   * Chamado pelo Kernel durante boot().
   * O plugin deve registrar sua Capability aqui.
   * ADR-000: INVARIANT-002 — Recebe Context, nunca o Kernel diretamente.
   */
  install(ctx: WalletNowContext): Promise<void>;

  /**
   * Chamado pelo Kernel durante shutdown() ou quando plugin é removido.
   * Deve limpar todos os recursos e listeners.
   */
  uninstall(): Promise<void>;

  /**
   * Verifica se o plugin está operacional.
   * ADR-000: 2.0.5 — útil para health checks em produção.
   */
  health(): Promise<PluginHealthStatus>;
}
