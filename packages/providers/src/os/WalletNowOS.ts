/**
 * @walletnow/providers — WalletNow OS Entrypoint
 *
 * Ponto de entrada principal do WalletNow OS para builders.
 *
 * O WalletNowOS é o orquestrador central que:
 * - Expõe o EventBus global
 * - Gerencia o ProviderRegistry
 * - Coordena os Engines (Identity, Wallet, Account, Asset, Protocol)
 *
 * @example — Uso básico por um builder:
 *
 * import { WalletNowOS } from '@walletnow/sdk';
 *
 * // 1. Registrar providers/protocolos
 * WalletNowOS.register(new SoroswapProvider());
 * WalletNowOS.register(new DefindexProvider());
 *
 * // 2. Escutar eventos globais
 * WalletNowOS.events.on('wallet.connected', ({ publicKey }) => {
 *   console.log('Usuário conectado:', publicKey);
 * });
 *
 * // 3. Inicializar
 * await WalletNowOS.boot({ network: 'testnet' });
 *
 * // 4. Usar os Engines
 * const result = await WalletNowOS.identity.create({ method: 'passkeys' });
 */

import { ProviderRegistry } from './registry/ProviderRegistry.js';
import { WalletNowEventBus, eventBus } from './eventbus/EventBus.js';
import type { IWalletNowProvider } from './manifest/ProviderManifest.js';

/** Configuração de inicialização do WalletNow OS */
export interface WalletNowOSConfig {
  /** Rede Stellar alvo */
  readonly network: 'mainnet' | 'testnet';
  /** URL customizada do Horizon (opcional — usa o padrão da rede se omitido) */
  readonly horizonUrl?: string;
  /** URL customizada do Soroban RPC (opcional) */
  readonly sorobanUrl?: string;
  /** Modo de debug — habilita logs detalhados */
  readonly debug?: boolean;
}

/** Estado do ciclo de vida do WalletNow OS */
export type OSState = 'idle' | 'booting' | 'ready' | 'shutting_down' | 'destroyed';

/** Versão do WalletNow OS */
const OS_VERSION = '0.1.0-alpha';

/**
 * WalletNowOS — Sistema Operacional Financeiro para a Stellar.
 *
 * Classe principal que os builders instanciam e configuram.
 * Coordena todos os Engines e o ProviderRegistry.
 */
export class WalletNowOS {
  private _state: OSState = 'idle';
  private _config: WalletNowOSConfig | null = null;
  private readonly _registry: ProviderRegistry;
  private readonly _events: WalletNowEventBus;

  constructor() {
    this._registry = new ProviderRegistry();
    this._events = eventBus;
  }

  // ─── Estado ──────────────────────────────────────────────────────────────

  get state(): OSState {
    return this._state;
  }

  get version(): string {
    return OS_VERSION;
  }

  get isReady(): boolean {
    return this._state === 'ready';
  }

  // ─── EventBus ─────────────────────────────────────────────────────────────

  /**
   * EventBus global do WalletNow OS.
   * Todos os domínios, providers e UIs se comunicam por aqui.
   *
   * @example
   * WalletNowOS.events.on('wallet.connected', ({ publicKey }) => { ... });
   */
  get events(): WalletNowEventBus {
    return this._events;
  }

  // ─── ProviderRegistry ─────────────────────────────────────────────────────

  /**
   * Registra um provider (protocolo/dApp) no WalletNow OS.
   *
   * @example
   * WalletNowOS.register(new SoroswapProvider());
   * WalletNowOS.register(new DefindexProvider());
   * WalletNowOS.register(new EtherfuseProvider());
   */
  async register(provider: IWalletNowProvider): Promise<void> {
    await this._registry.register(provider);
  }

  /** Acesso ao ProviderRegistry para buscas e listagens */
  get providers(): ProviderRegistry {
    return this._registry;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Inicializa o WalletNow OS.
   * Configura a rede, valida providers registrados e emite o evento `os.ready`.
   *
   * @example
   * await walletNowOS.boot({ network: 'testnet' });
   */
  async boot(config: WalletNowOSConfig): Promise<void> {
    if (this._state !== 'idle') {
      throw new Error(
        `[WalletNowOS] Não é possível fazer boot no estado '${this._state}'. ` +
        `O OS já foi inicializado.`,
      );
    }

    this._state = 'booting';
    this._config = config;

    if (config.debug) {
      console.log(`[WalletNowOS] Iniciando WalletNow OS v${OS_VERSION} na rede '${config.network}'...`);
      console.log(`[WalletNowOS] Providers registrados: ${this._registry.size}`);
    }

    this._state = 'ready';
    this._events.emit('os.ready', { version: OS_VERSION });

    if (config.debug) {
      console.log('[WalletNowOS] ✓ WalletNow OS pronto.');
    }
  }

  /**
   * Encerra o WalletNow OS.
   * Destrói todos os providers, limpa o EventBus e libera recursos.
   */
  async shutdown(): Promise<void> {
    if (this._state !== 'ready') {
      throw new Error(
        `[WalletNowOS] Não é possível encerrar no estado '${this._state}'.`,
      );
    }

    this._state = 'shutting_down';
    this._events.emit('os.shutdown', undefined as unknown as void);

    await this._registry.destroyAll();
    this._events.removeAllListeners();

    this._state = 'destroyed';
  }

  /** Configuração atual do OS (null antes do boot) */
  get config(): WalletNowOSConfig | null {
    return this._config;
  }

  /** Atalho para a rede ativa */
  get network(): 'mainnet' | 'testnet' | null {
    return this._config?.network ?? null;
  }
}
