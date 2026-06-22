/**
 * WalletNow Protocol — WalletNow Kernel
 *
 * Classe orquestradora principal. Ponto de entrada único do protocolo.
 *
 * ADR-000: INVARIANT-009 — State Machine explícita.
 * ADR-000: INVARIANT-014 — WalletNowContext imutável após boot().
 * ADR-000: INVARIANT-001 — Zero dependências de runtime.
 *
 * Lifecycle:
 *   CREATED → INITIALIZED → BOOTING → READY → SHUTTING_DOWN → DESTROYED
 *
 * Usage:
 *   WalletNow.use(GaslessPlugin);
 *   const wn = WalletNow.init(config);
 *   await wn.boot();
 *   // ... uso normal ...
 *   await wn.shutdown();
 */

import type { WalletNowConfig } from './types/config.types.js';
import type { IWalletCapability, IAccountsCapability, ITransactionsCapability, IAssetsCapability, IGasCapability } from './capabilities/index.js';
import type { IPlugin } from './plugins/IPlugin.js';
import type { PluginsHealthReport } from './types/plugin.types.js';
import { EventEmitter } from './events/EventEmitter.js';
import { PluginRegistry } from './plugins/PluginRegistry.js';
import { CapabilityRegistry } from './context/index.js';
import { StateError } from './errors/StateError.js';
import { ValidationError } from './errors/ValidationError.js';
import { PluginError } from './errors/PluginError.js';
import { assertStateIn, assertState } from '../internal/assertion.js';

/** Estados possíveis do Kernel */
export type KernelState =
  | 'CREATED'
  | 'INITIALIZED'
  | 'BOOTING'
  | 'READY'
  | 'SHUTTING_DOWN'
  | 'DESTROYED';

export class WalletNow {
  // ─── Registro estático de plugins (antes do init) ─────────────────
  private static readonly stagedPlugins: IPlugin[] = [];

  // ─── Estado do Kernel ──────────────────────────────────────────────
  private _state: KernelState = 'INITIALIZED';
  private readonly _events: EventEmitter;
  private readonly _pluginRegistry: PluginRegistry;
  private readonly _capabilityRegistry: CapabilityRegistry;
  private readonly _config: WalletNowConfig;

  // ─── Capabilities built-in (preenchidas após boot) ─────────────────
  private _wallet!: IWalletCapability;
  private _accounts!: IAccountsCapability;
  private _transactions!: ITransactionsCapability;
  private _assets!: IAssetsCapability;
  private _gas!: IGasCapability;

  private constructor(config: WalletNowConfig) {
    this._config = config;
    this._events = new EventEmitter();
    this._pluginRegistry = new PluginRegistry();
    this._capabilityRegistry = new CapabilityRegistry();

    // Transfere plugins staged estaticamente para o registry da instância
    for (const plugin of WalletNow.stagedPlugins) {
      this._pluginRegistry.stage(plugin);
    }
  }

  // ─── API Estática ──────────────────────────────────────────────────

  /**
   * Registra um plugin para instalação durante boot().
   * Deve ser chamado ANTES de init().
   * ADR-000: INVARIANT-002 — plugins se comunicam apenas via Context.
   */
  static use(plugin: IPlugin): typeof WalletNow {
    const alreadyStaged = WalletNow.stagedPlugins.find((p) => p.name === plugin.name);
    if (alreadyStaged) {
      throw new PluginError(
        'PLUGIN_ALREADY_STAGED',
        `Plugin '${plugin.name}' is already registered.`,
        { name: plugin.name },
      );
    }
    WalletNow.stagedPlugins.push(plugin);
    return WalletNow;
  }

  /**
   * Inicializa o Kernel com a configuração fornecida.
   * ADR-000: INVARIANT-005 — providers obrigatórios são validados aqui.
   */
  static init(config: WalletNowConfig): WalletNow {
    WalletNow.validateConfig(config);
    const instance = new WalletNow(config);
    instance._state = 'INITIALIZED';
    return instance;
  }

  private static validateConfig(config: WalletNowConfig): void {
    if (!config.providers?.storage) {
      throw new ValidationError(
        'MISSING_STORAGE_PROVIDER',
        'WalletNowConfig.providers.storage is required. Provide an IStorageProvider implementation.',
      );
    }
    if (!config.providers?.auth) {
      throw new ValidationError(
        'MISSING_AUTH_PROVIDER',
        'WalletNowConfig.providers.auth is required. Provide an IAuthProvider implementation.',
      );
    }
    if (!config.network) {
      throw new ValidationError(
        'MISSING_NETWORK_CONFIG',
        'WalletNowConfig.network is required.',
      );
    }
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────

  /**
   * Inicializa todos os subsistemas e instala os plugins.
   * ADR-000: INVARIANT-009 — só pode ser chamado em INITIALIZED.
   */
  async boot(): Promise<void> {
    assertState(this._state, 'INITIALIZED', 'boot()');
    this._state = 'BOOTING';

    // O Context é construído e congelado aqui
    // A implementação concreta das capabilities virá do @walletnow/domain (Sprint 3)
    // Por ora, o Context representa os providers injetados
    const ctx = this.buildContext();

    // Instala todos os plugins em ordem de priority
    await this._pluginRegistry.installAll(ctx);

    this._state = 'READY';
    this._events.emit('kernel.booted', {
      plugins: Array.from(this._pluginRegistry.getInstalled().keys()),
    });
  }

  /**
   * Promise que resolve quando o Kernel atingir o estado READY.
   * Útil para aguardar o boot em contextos assíncronos.
   */
  ready(): Promise<void> {
    if (this._state === 'READY') return Promise.resolve();
    return new Promise((resolve, reject) => {
      this._events.once('kernel.booted', () => resolve());
      this._events.once('error', (err) => reject(err));
    });
  }

  /**
   * Encerra o Kernel: desinstala plugins, limpa RAM sensível.
   * ADR-000: INVARIANT-006 — nenhum segredo persiste após shutdown.
   */
  async shutdown(): Promise<void> {
    assertStateIn(this._state, ['INITIALIZED', 'READY'], 'shutdown()');
    this._state = 'SHUTTING_DOWN';

    await this._pluginRegistry.uninstallAll(this._events);

    this._events.emit('kernel.shutdown', undefined as unknown as void);
    this._events.removeAllListeners();
    this._state = 'DESTROYED';
  }

  // ─── Capabilities Built-in ─────────────────────────────────────────

  get wallet(): IWalletCapability {
    assertState(this._state, 'READY', 'wn.wallet');
    return this._wallet;
  }

  get accounts(): IAccountsCapability {
    assertState(this._state, 'READY', 'wn.accounts');
    return this._accounts;
  }

  get transactions(): ITransactionsCapability {
    assertState(this._state, 'READY', 'wn.transactions');
    return this._transactions;
  }

  get assets(): IAssetsCapability {
    assertState(this._state, 'READY', 'wn.assets');
    return this._assets;
  }

  get gas(): IGasCapability {
    assertState(this._state, 'READY', 'wn.gas');
    return this._gas;
  }

  // ─── Capability Registry (para plugins) ───────────────────────────

  get capabilities(): CapabilityRegistry {
    assertStateIn(this._state, ['READY'], 'wn.capabilities');
    return this._capabilityRegistry;
  }

  // ─── Event System ──────────────────────────────────────────────────

  /**
   * Sistema de eventos global.
   * ADR-000: 2.0.5 — eventos são globais via wn.events.on(...)
   */
  get events(): EventEmitter {
    return this._events;
  }

  // ─── Plugins Health Check ──────────────────────────────────────────

  /**
   * Executa health check em todos os plugins instalados.
   * ADR-000: 2.0.5 — health() obrigatório em IPlugin.
   */
  async pluginsHealth(): Promise<PluginsHealthReport> {
    assertState(this._state, 'READY', 'wn.pluginsHealth()');
    return this._pluginRegistry.health();
  }

  // ─── State ─────────────────────────────────────────────────────────

  get state(): KernelState {
    return this._state;
  }

  // ─── Internals ─────────────────────────────────────────────────────

  private buildContext(): import('./context/index.js').WalletNowContext {
    // Context será completamente construído na Sprint 3 com os providers
    // Por ora retornamos a estrutura mínima para que os plugins possam se instalar
    const ctx = {
      config: this._config,
      storage: this._config.providers.storage,
      auth: this._config.providers.auth,
      logger: this._config.providers.logger ?? this.buildNoopLogger(),
      chain: this._config.providers.chain ?? this.buildNoopChainProvider(),
      rpc: this._config.providers.rpc ?? this.buildNoopRPCProvider(),
      signer: this._config.providers.signer ?? this.buildNoopSignerProvider(),
      events: this._events,
      capabilities: this._capabilityRegistry,
      executionFactory: this.buildExecutionFactory(),
    };

    // INVARIANT-014: Context é congelado após construção
    return Object.freeze(ctx) as import('./context/index.js').WalletNowContext;
  }

  private buildExecutionFactory(): import('./context/index.js').ExecutionContextFactory {
    const self = this;
    return {
      create(operationId?: string) {
        let aborted = false;
        const ctx = Object.freeze({
          parent: self.buildContext(),
          operationId: operationId ?? `op_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          startedAt: Date.now(),
          metadata: new Map<string, unknown>(),
          abort(reason?: string) {
            aborted = true;
          },
          isAborted() {
            return aborted;
          },
        });
        return ctx;
      },
    };
  }

  // Noop providers — serão substituídos por implementações concretas na Sprint 3
  private buildNoopLogger(): import('./interfaces/ILoggerProvider.js').ILoggerProvider {
    return { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} };
  }

  private buildNoopChainProvider(): import('./interfaces/IChainProvider.js').IChainProvider {
    const network = this._config.network;
    return {
      getNetworkPassphrase: () => network.passphrase ?? 'Test SDF Network ; September 2015',
      getNetworkType: () => network.type,
      getExplorerUrl: (hash: string) => `https://stellar.expert/explorer/${network.type}/tx/${hash}`,
      isConnected: async () => false,
      getNetworkInfo: () => ({
        type: network.type,
        passphrase: network.passphrase ?? 'Test SDF Network ; September 2015',
        horizonUrl: network.horizonUrl ?? 'https://horizon-testnet.stellar.org',
        sorobanUrl: network.sorobanUrl,
        isConnected: false,
      }),
    };
  }

  private buildNoopRPCProvider(): import('./interfaces/IRPCProvider.js').IRPCProvider {
    throw new ValidationError(
      'MISSING_RPC_PROVIDER',
      'No IRPCProvider configured. Provide one via config.providers.rpc or install a network plugin.',
    );
  }

  private buildNoopSignerProvider(): import('./interfaces/ISignerProvider.js').ISignerProvider {
    throw new ValidationError(
      'MISSING_SIGNER_PROVIDER',
      'No ISignerProvider configured. Provide one via config.providers.signer or install a signer plugin.',
    );
  }
}
