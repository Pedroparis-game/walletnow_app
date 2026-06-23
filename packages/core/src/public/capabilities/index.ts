/**
 * WalletNow Protocol — Capability Interfaces
 *
 * Contratos de todas as capabilities built-in do protocolo.
 * ADR-000: INVARIANT-012 — CQRS: query e command separados (singular).
 * ADR-000: INVARIANT-011 — Wallet é Identity Object (não executa transações).
 */

import type { WalletAccount, WalletConnectResult, WalletImportParams } from '../types/wallet.types.js';
import type { StellarAccount, AccountState } from '../types/account.types.js';
import type { Transaction, TransactionParams, TransactionResult } from '../types/transaction.types.js';
import type { AssetBalance, AccountBalances, StellarAsset } from '../types/asset.types.js';
import type { FeeEstimate } from '../types/gas.types.js';
import type { SignParams, SignatureResult } from '../types/signer.types.js';

// ─── Wallet Capability ─────────────────────────────────────────────────────
/**
 * Identity Object — representa a identidade do usuário.
 * ADR-000: INVARIANT-011 — não executa transações ou queries de negócio.
 */
export interface IWalletCapability {
  /** Public key da conta ativa, ou null se não conectado */
  readonly publicKey: string | null;

  /** Conecta via auth provider configurado */
  connect(): Promise<WalletConnectResult>;

  /** Encerra sessão e limpa RAM de dados sensíveis */
  disconnect(): Promise<void>;

  /**
   * Assina bytes arbitrários.
   * Para assinar transações, use wn.transactions.command.sign()
   */
  sign(params: SignParams): Promise<SignatureResult>;
}

// ─── Accounts Capability (CQRS) ────────────────────────────────────────────
export interface IAccountsQuery {
  /** Retorna a conta ativa no protocolo */
  getActive(): Promise<WalletAccount | null>;
  /** Retorna todas as contas importadas */
  getAll(): Promise<WalletAccount[]>;
  /** Retorna estado on-chain de uma conta */
  getOnChainState(publicKey: string): Promise<AccountState>;
  /** Verifica se uma conta existe no ledger */
  existsOnChain(publicKey: string): Promise<boolean>;
}

export interface IAccountsCommand {
  /** Importa uma conta via secret key ou mnemonic */
  import(params: WalletImportParams): Promise<WalletAccount>;
  /** Define a conta ativa */
  setActive(accountId: string): Promise<WalletAccount>;
  /** Remove uma conta importada (não afeta o ledger) */
  remove(accountId: string): Promise<void>;
}

export interface IAccountsCapability {
  readonly query: IAccountsQuery;
  readonly command: IAccountsCommand;
}

// ─── Transactions Capability (CQRS) ────────────────────────────────────────
export interface ITransactionsQuery {
  /** Busca histórico de transações de uma conta */
  getHistory(publicKey: string, limit?: number): Promise<Transaction[]>;
  /** Busca uma transação pelo hash */
  getByHash(hash: string): Promise<Transaction | null>;
}

export interface ITransactionsCommand {
  /**
   * Executa o pipeline completo: Build → Validate → Sign → Sponsor → Submit → Confirm.
   * Este é o método principal para enviar valor.
   */
  send(params: TransactionParams): Promise<TransactionResult>;

  /** Apenas constrói a transação (sem submeter) */
  build(params: TransactionParams): Promise<Transaction>;

  /** Apenas assina um XDR (sem submeter) */
  sign(xdr: string): Promise<Transaction>;
}

export interface ITransactionsCapability {
  readonly query: ITransactionsQuery;
  readonly command: ITransactionsCommand;
}

// ─── Assets Capability (CQRS) ──────────────────────────────────────────────
export interface IAssetsQuery {
  /** Retorna todos os saldos de uma conta */
  getBalances(publicKey: string): Promise<AccountBalances>;
  /** Retorna a lista de ativos suportados pela rede */
  getSupportedAssets(): Promise<StellarAsset[]>;
  /** Verifica se uma trustline existe */
  hasTrustline(publicKey: string, assetCode: string, issuer: string): Promise<boolean>;
}

export interface IAssetsCapability {
  readonly query: IAssetsQuery;
}

// ─── Swap Capability ───────────────────────────────────────────────────────

/** Token de uma rede Soroban/Stellar */
export interface SwapToken {
  code: string;
  name: string;
  contract: string;        // Contract ID (C...) ou 'native' para XLM
  issuer?: string;         // Para Stellar Asset Contracts (G...)
  icon: string;
  decimals: number;
  org?: string;
}

export type SwapProtocol = 'soroswap' | 'phoenix' | 'aqua' | 'sdex';

export type SwapTradeType = 'EXACT_IN' | 'EXACT_OUT';

/** Parâmetros para solicitar um quote */
export interface SwapQuoteParams {
  assetIn: string;         // Contract ID ou 'native'
  assetOut: string;
  amount: string;          // Em stroops (7 decimais)
  tradeType?: SwapTradeType;
  protocols?: SwapProtocol[];
}

/** Resultado de um quote */
export interface SwapQuoteResult {
  assetIn: string;
  assetOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;     // Em % (ex: 0.12 = 0.12%)
  path: string[];
  protocol: SwapProtocol;
  tradeType: SwapTradeType;
  networkFee: string;
  /** Quote expira em (timestamp ms) */
  expiresAt: number;
}

/** Resultado de uma estimativa de fees */
export interface SwapFeeEstimate {
  networkFee: string;       // Em XLM
  protocolFee: string;      // Em % do amountIn
  totalFeeUsd?: string;     // Estimativa em USD se disponível
}

/** Rota ótima para um par */
export interface SwapRoute {
  path: string[];
  protocol: SwapProtocol;
  priceImpact: number;
  expectedOutput: string;
}

/** Parâmetros para executar um swap */
export interface SwapExecuteParams {
  quote: SwapQuoteResult;
  from: string;             // Public key G...
  to?: string;              // Default: from
  slippageTolerance?: number; // Em % (ex: 0.5 = 0.5%). Default: 0.5
}

/** Resultado de um swap executado */
export interface SwapExecuteResult {
  txHash: string;
  amountOut: string;
  fee: string;
  ledger: number;
}

/** Status de saúde do serviço de swap */
export interface SwapHealthStatus {
  status: 'healthy' | 'degraded' | 'unavailable';
  latency: number;          // ms
  network: string;          // 'testnet' | 'mainnet'
  apiVersion?: string;
  supportedProtocols: SwapProtocol[];
  lastCheck: number;        // timestamp ms
}

/**
 * ISwapCapability — Contrato completo para qualquer integração de Swap no WalletNow.
 * Implementado por SoroswapPlugin, e futuramente por outros agregadores.
 */
export interface ISwapCapability {
  /** Obtém a lista de tokens suportados */
  supportedTokens(): Promise<SwapToken[]>;

  /** Obtém os protocolos disponíveis no aggregator */
  supportedProtocols(): Promise<SwapProtocol[]>;

  /** Obtém a melhor quote para um par de ativos */
  quote(params: SwapQuoteParams): Promise<SwapQuoteResult>;

  /** Obtém a melhor rota sem commitar o quote */
  bestRoute(params: SwapQuoteParams): Promise<SwapRoute>;

  /** Estima o impacto no preço para um par */
  estimatePriceImpact(params: SwapQuoteParams): Promise<number>;

  /** Estima as taxas de uma operação */
  estimateFees(params: SwapQuoteParams): Promise<SwapFeeEstimate>;

  /**
   * Executa o ciclo completo de swap: Build → Sign (Freighter) → Submit → Confirm.
   * Emite eventos: swap.started → swap.signed → swap.submitted → swap.confirmed | swap.failed
   */
  swap(params: SwapExecuteParams): Promise<SwapExecuteResult>;

  /** Verifica a saúde do serviço de swap */
  health(): Promise<SwapHealthStatus>;
}

// ─── Gas Capability ────────────────────────────────────────────────────────
export interface IGasCapability {
  /** Estima o custo de uma transação */
  estimate(tx: Transaction): Promise<FeeEstimate>;
}

// ─── Portfolio Capability ──────────────────────────────────────────────────

export * from './integration.js';
