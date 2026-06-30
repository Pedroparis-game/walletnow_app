/**
 * @walletnow/providers — ProviderRegistry
 *
 * Registry global de providers do WalletNow OS.
 *
 * Responsabilidades:
 * - Registrar e desregistrar providers (dApps/protocolos)
 * - Buscar providers por ID ou capability
 * - Inicializar e destruir providers de forma controlada
 * - Integrar com o EventBus para notificar mudanças de estado
 *
 * @example
 * // Registrar um provider (feito pelos builders)
 * WalletNowOS.register(new SoroswapProvider());
 * WalletNowOS.register(new DefindexProvider());
 *
 * @example
 * // Buscar providers por capability
 * const swapProviders = registry.getByCapability('swap');
 */

import type { IWalletNowProvider, ProviderCapability } from '../manifest/ProviderManifest.js';
import { eventBus } from '../eventbus/EventBus.js';

/**
 * ProviderRegistry — Registro central de todos os providers do WalletNow OS.
 *
 * Cada provider é identificado pelo `manifest.id` único.
 * O registro é case-sensitive e imutável após o registro (para evitar colisões).
 */
export class ProviderRegistry {
  private readonly providers = new Map<string, IWalletNowProvider>();

  /**
   * Registra um provider no OS.
   *
   * O provider será inicializado (`initialize()`) automaticamente.
   * Um evento `provider.registered` será emitido no EventBus.
   *
   * @throws Error se um provider com o mesmo ID já estiver registrado
   */
  async register(provider: IWalletNowProvider): Promise<void> {
    const { id, name, capabilities } = provider.manifest;

    if (this.providers.has(id)) {
      throw new Error(
        `[ProviderRegistry] Provider '${id}' já está registrado. ` +
        `Use um ID único por provider.`,
      );
    }

    try {
      await provider.initialize();
      this.providers.set(id, provider);

      eventBus.emit('provider.registered', { id, name, capabilities });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      eventBus.emit('provider.initialize_failed', { id, error: message });
      throw new Error(`[ProviderRegistry] Falha ao inicializar provider '${id}': ${message}`);
    }
  }

  /**
   * Remove um provider do Registry e chama seu método `destroy()`.
   * Emite `provider.unregistered` no EventBus.
   *
   * @throws Error se o provider não existir no Registry
   */
  async unregister(id: string): Promise<void> {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`[ProviderRegistry] Provider '${id}' não encontrado.`);
    }

    await provider.destroy();
    this.providers.delete(id);
    eventBus.emit('provider.unregistered', { id });
  }

  /**
   * Recupera um provider pelo ID.
   * @returns O provider ou undefined se não encontrado
   */
  get(id: string): IWalletNowProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Lista todos os providers registrados que implementam uma capability.
   *
   * @example
   * const swapProviders = registry.getByCapability('swap');
   * // → [SoroswapProvider, PhoenixProvider]
   */
  getByCapability(capability: ProviderCapability): IWalletNowProvider[] {
    return Array.from(this.providers.values()).filter((p) =>
      p.manifest.capabilities.includes(capability),
    );
  }

  /**
   * Lista todos os providers disponíveis para uma rede Stellar específica.
   */
  getByNetwork(network: 'stellar-mainnet' | 'stellar-testnet'): IWalletNowProvider[] {
    return Array.from(this.providers.values()).filter((p) =>
      p.manifest.networks.includes(network),
    );
  }

  /**
   * Lista todos os providers registrados.
   */
  list(): IWalletNowProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Verifica se um provider está registrado.
   */
  has(id: string): boolean {
    return this.providers.has(id);
  }

  /**
   * Retorna o número de providers registrados.
   */
  get size(): number {
    return this.providers.size;
  }

  /**
   * Executa health check em todos os providers registrados.
   * Retorna um snapshot do estado de saúde de cada um.
   */
  async healthAll(): Promise<Record<string, { status: string; latencyMs?: number }>> {
    const results: Record<string, { status: string; latencyMs?: number }> = {};

    await Promise.allSettled(
      Array.from(this.providers.entries()).map(async ([id, provider]) => {
        try {
          const result = await provider.health();
          results[id] = { status: result.status, latencyMs: result.latencyMs };
          eventBus.emit('provider.health_changed', { id, status: result.status });
        } catch {
          results[id] = { status: 'unavailable' };
          eventBus.emit('provider.health_changed', { id, status: 'unavailable' });
        }
      }),
    );

    return results;
  }

  /**
   * Destrói todos os providers e limpa o Registry.
   * Chamado durante o shutdown do WalletNow OS.
   */
  async destroyAll(): Promise<void> {
    const ids = Array.from(this.providers.keys());
    await Promise.allSettled(ids.map((id) => this.unregister(id)));
  }
}
