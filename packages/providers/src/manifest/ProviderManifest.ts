/**
 * @walletnow/providers — WalletNow Provider Manifest
 *
 * Especificação do manifesto que todo provider (dApp/protocolo) deve declarar
 * para ser registrado no WalletNow OS.
 *
 * Stellar-specific: os providers cobrem protocolos DeFi e pagamentos na Stellar.
 * Infra de rede (Horizon, RPC) é declarada como Service, não como Provider.
 */

// ─── Capabilities & Networks ──────────────────────────────────────────────────

/**
 * Capabilities que um provider pode declarar.
 * Determina quais operações o provider suporta.
 *
 * Stellar DeFi ecosystem:
 * - 'swap'     → Soroswap, Phoenix, Aquarius
 * - 'yield'    → Defindex, Blend
 * - 'rwa'      → Etherfuse (tokenized treasury bills)
 * - 'payment'  → MoneyGram, Vibrant
 * - 'liquidity'→ Aquarius, Soroswap LP
 * - 'anchor'   → SEP-24 anchors (on/off-ramp)
 */
export type ProviderCapability =
  | 'swap'       // Troca de ativos (DEX)
  | 'yield'      // Rendimentos / Vaults
  | 'rwa'        // Real World Assets (títulos tokenizados)
  | 'payment'    // Pagamentos e remessas
  | 'liquidity'  // Provedores de liquidez
  | 'anchor'     // SEP-24 On/Off-ramp anchors
  | 'lending'    // Empréstimos colateralizados
  | 'staking'    // Staking de tokens
  | 'nft'        // NFTs e colecionáveis
  | 'analytics'; // Dados e analytics

/** Redes Stellar suportadas (foco exclusivo na Stellar) */
export type StellarNetwork = 'stellar-mainnet' | 'stellar-testnet';

// ─── Provider Manifest ────────────────────────────────────────────────────────

/**
 * WalletNowProviderManifest — Declaração pública de um provider.
 *
 * Todo protocolo/dApp que deseja ser integrado ao WalletNow OS deve
 * declarar este manifesto e registrá-lo via `WalletNowOS.register()`.
 *
 * @example
 * export const SoroswapManifest: WalletNowProviderManifest = {
 *   id: 'soroswap',
 *   name: 'Soroswap',
 *   version: '1.0.0',
 *   capabilities: ['swap', 'liquidity'],
 *   networks: ['stellar-mainnet', 'stellar-testnet'],
 *   description: 'Leading DEX on Stellar Soroban',
 *   website: 'https://soroswap.finance',
 *   icon: 'https://soroswap.finance/logo.svg',
 *   author: 'Soroswap Team',
 * };
 */
export interface WalletNowProviderManifest {
  /** Identificador único e imutável do provider */
  readonly id: string;

  /** Nome de exibição legível */
  readonly name: string;

  /** Versão semver do provider (ex: '1.0.0') */
  readonly version: string;

  /** Lista de capabilities que este provider implementa */
  readonly capabilities: ProviderCapability[];

  /** Redes Stellar em que este provider está disponível */
  readonly networks: StellarNetwork[];

  /** Descrição curta do que o provider faz */
  readonly description: string;

  /** URL do site oficial */
  readonly website: string;

  /** URL do ícone (SVG preferencial) */
  readonly icon: string;

  /** Autor ou equipe responsável */
  readonly author: string;

  /** URL da documentação técnica (opcional) */
  readonly docs?: string;

  /** Se este provider é oficial/parceiro verificado da WalletNow */
  readonly verified?: boolean;

  /** Tags para busca no Marketplace */
  readonly tags?: string[];
}

// ─── Provider Status ──────────────────────────────────────────────────────────

/** Estado de saúde de um provider */
export type ProviderHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'unavailable'
  | 'unknown';

/** Resultado de um health check de provider */
export interface ProviderHealthResult {
  readonly status: ProviderHealthStatus;
  readonly latencyMs?: number;
  readonly checkedAt: number;
  readonly message?: string;
}

// ─── IWalletNowProvider ───────────────────────────────────────────────────────

/**
 * IWalletNowProvider — Contrato base que todo provider deve implementar.
 *
 * Para integrar um dApp/protocolo ao WalletNow OS:
 * 1. Declare o manifesto
 * 2. Implemente as capabilities declaradas
 * 3. Registre via `WalletNowOS.register(myProvider)`
 *
 * @example
 * class SoroswapProvider implements IWalletNowProvider {
 *   readonly manifest = SoroswapManifest;
 *
 *   async initialize() { await this.client.connect(); }
 *   async destroy() { this.client.disconnect(); }
 *   async health() { return this.client.ping(); }
 * }
 */
export interface IWalletNowProvider {
  /** Manifesto declarando as capacidades deste provider */
  readonly manifest: WalletNowProviderManifest;

  /**
   * Chamado pelo Registry durante o registro do provider.
   * Use para inicializar conexões com APIs externas, carregar configs etc.
   */
  initialize(): Promise<void>;

  /**
   * Chamado quando o provider é removido do Registry.
   * Use para limpar listeners, fechar conexões e liberar recursos.
   */
  destroy(): Promise<void>;

  /**
   * Verifica se o provider está operacional.
   * Chamado periodicamente pelo HealthMonitor do OS.
   */
  health(): Promise<ProviderHealthResult>;
}
