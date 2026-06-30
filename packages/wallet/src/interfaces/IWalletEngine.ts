/**
 * @walletnow/wallet — IWalletEngine & IAccountEngine
 *
 * Contratos do Wallet Engine e Account Engine do WalletNow OS.
 *
 * WalletEngine: ciclo de vida da carteira (criação, import, conexão, export)
 * AccountEngine: operações on-chain na conta Stellar (sync, trustlines, histórico)
 */

import type { IdentityId } from '@walletnow/identity';
import type {
  StellarWallet,
  WalletId,
  StellarAccount,
  AccountId,
  AccountOnChainState,
  ImportWalletParams,
  CreateWalletFromIdentityParams,
} from '../types/wallet.types.js';

// ─── IWalletEngine ────────────────────────────────────────────────────────────

/**
 * IWalletEngine — Gerencia a carteira Stellar do usuário.
 *
 * Responsabilidades:
 * - Criar wallets a partir de uma Identity (Passkeys)
 * - Importar wallets via secret key ou mnemonic
 * - Exportar a public key (nunca a private key diretamente)
 * - Gerenciar múltiplas wallets por identity
 *
 * @example
 * // Criar wallet a partir de uma identity Passkey existente
 * const wallet = await walletEngine.createFromIdentity({ identityId: 'id-123' });
 *
 * @example
 * // Importar via secret key
 * const wallet = await walletEngine.import({ secretOrMnemonic: 'SXYZ...', label: 'Cold Wallet' });
 */
export interface IWalletEngine {

  // ─── Estado ──────────────────────────────────────────────────────────────

  /** Wallet ativa no contexto atual */
  readonly active: StellarWallet | null;

  /** Public key da wallet ativa (atalho) */
  readonly publicKey: string | null;

  // ─── Criação & Importação ─────────────────────────────────────────────────

  /**
   * Cria uma nova wallet Stellar a partir de uma Identity existente.
   * Para identities com Passkeys: deriva o keypair do authenticador.
   */
  createFromIdentity(params: CreateWalletFromIdentityParams): Promise<StellarWallet>;

  /**
   * Importa uma wallet via secret key Stellar (S...) ou mnemonic BIP-39.
   * A chave privada é criptografada e armazenada localmente no vault.
   */
  import(params: ImportWalletParams): Promise<StellarWallet>;

  // ─── Gerenciamento ────────────────────────────────────────────────────────

  /** Lista todas as wallets de uma identity */
  list(identityId: IdentityId): Promise<StellarWallet[]>;

  /** Recupera uma wallet pelo ID */
  get(walletId: WalletId): Promise<StellarWallet | null>;

  /** Define uma wallet como ativa */
  setActive(walletId: WalletId): Promise<StellarWallet>;

  /**
   * Remove uma wallet permanentemente do vault local.
   * NÃO afeta a conta no ledger Stellar.
   */
  remove(walletId: WalletId): Promise<void>;

  // ─── Assinatura ───────────────────────────────────────────────────────────

  /**
   * Assina um XDR de transação Stellar com a chave da wallet ativa.
   * A chave privada é lida do vault em memória e nunca é exposta.
   *
   * @param xdr - Envelope XDR não assinado
   * @param networkPassphrase - Passphrase da rede Stellar
   * @returns XDR assinado
   */
  signTransaction(xdr: string, networkPassphrase: string): Promise<string>;
}

// ─── IAccountEngine ───────────────────────────────────────────────────────────

/**
 * IAccountEngine — Operações de conta Stellar no ledger.
 *
 * Responsabilidades:
 * - Verificar existência e estado de contas no Horizon
 * - Sincronizar saldo e trustlines
 * - Criar trustlines para novos ativos
 * - Listar múltiplas contas (sub-accounts) de uma wallet
 *
 * @example
 * // Verificar se a conta existe no ledger
 * const exists = await accountEngine.existsOnChain('GXYZ...');
 *
 * @example
 * // Obter estado completo da conta
 * const state = await accountEngine.getOnChainState('GXYZ...');
 * console.log(state.xlmBalance, state.trustlines);
 */
export interface IAccountEngine {

  // ─── Estado On-Chain ──────────────────────────────────────────────────────

  /**
   * Verifica se uma conta existe e está ativada no ledger Stellar.
   * Uma conta só existe após receber pelo menos 1 XLM (minimum reserve).
   */
  existsOnChain(publicKey: string): Promise<boolean>;

  /**
   * Busca o estado completo de uma conta no Horizon.
   * Inclui XLM balance, trustlines, sequence number e thresholds.
   */
  getOnChainState(publicKey: string): Promise<AccountOnChainState>;

  // ─── Gerenciamento ────────────────────────────────────────────────────────

  /** Lista todas as accounts de uma wallet */
  list(walletId: WalletId): Promise<StellarAccount[]>;

  /** Recupera uma account pelo ID interno */
  get(accountId: AccountId): Promise<StellarAccount | null>;

  /**
   * Sincroniza o estado local de uma account com o ledger Stellar.
   * Atualiza balance, trustlines e sequenceNumber.
   */
  sync(publicKey: string): Promise<StellarAccount>;

  /**
   * Define a account ativa para operações.
   */
  setActive(accountId: AccountId): Promise<StellarAccount>;
}
