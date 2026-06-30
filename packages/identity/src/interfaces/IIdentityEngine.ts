/**
 * @walletnow/identity — IIdentityEngine
 *
 * Contrato público do Identity Engine.
 * Responsável pelo ciclo de vida completo da identidade do usuário.
 *
 * Princípios:
 * - A Identity é a entidade raiz. Tudo parte daqui.
 * - Chaves privadas nunca saem da RAM local.
 * - O engine nunca persiste segredos — apenas metadados de autenticação.
 */

import type {
  Identity,
  IdentityId,
  IdentityStatus,
  IdentitySession,
  IdentityAuthResult,
  CreateIdentityParams,
} from '../types/identity.types.js';

/**
 * IIdentityEngine — Contrato da camada de Identity do WalletNow OS.
 *
 * Responsabilidades:
 * - Criar identidades via Passkeys (FIDO2), keypair, mnemonic ou readonly
 * - Gerenciar sessões ativas (autenticar, travar, destruir)
 * - Listar e trocar entre identidades
 * - Nunca persistir chaves privadas — apenas metadados seguros
 *
 * @example
 * // Criar uma identity via Passkeys (método recomendado)
 * const result = await identity.create({ method: 'passkeys', label: 'Minha Carteira' });
 * console.log(result.publicKey); // G...
 *
 * @example
 * // Autenticar uma identity existente
 * await identity.authenticate(identityId);
 */
export interface IIdentityEngine {

  // ─── Estado ──────────────────────────────────────────────────────────────

  /** Status atual do Identity Engine */
  readonly status: IdentityStatus;

  /** Sessão ativa (null se não autenticado) */
  readonly session: IdentitySession | null;

  /** Public key da identity ativa (null se não autenticado) */
  readonly publicKey: string | null;

  // ─── Criação ─────────────────────────────────────────────────────────────

  /**
   * Cria uma nova Identity.
   *
   * Para Passkeys: dispara o prompt biométrico do dispositivo (WebAuthn).
   * Para keypair/mnemonic: deriva a public key Stellar da chave fornecida.
   *
   * @returns IdentityAuthResult com a identity criada e a public key derivada
   * @throws IdentityError se a criação falhar ou o usuário cancelar
   */
  create(params: CreateIdentityParams): Promise<IdentityAuthResult>;

  // ─── Autenticação ─────────────────────────────────────────────────────────

  /**
   * Autentica uma identity existente, iniciando uma sessão.
   * Para Passkeys: dispara o prompt biométrico.
   * Para keypair: decripta o vault local.
   *
   * @param identityId - ID da identity a autenticar
   * @returns IdentityAuthResult com a sessão iniciada
   */
  authenticate(identityId: IdentityId): Promise<IdentityAuthResult>;

  /**
   * Trava o vault sem destruir a sessão.
   * A identity permanece listada mas inacessível para assinar.
   */
  lock(): Promise<void>;

  /**
   * Encerra a sessão ativa completamente.
   * Limpa dados sensíveis da RAM (chaves privadas, tokens de sessão).
   */
  logout(): Promise<void>;

  // ─── Gerenciamento de Identidades ────────────────────────────────────────

  /**
   * Lista todas as identities armazenadas localmente.
   * Não inclui dados sensíveis — apenas metadados públicos.
   */
  list(): Promise<Identity[]>;

  /**
   * Recupera os metadados de uma identity específica.
   * @returns null se não encontrada
   */
  get(identityId: IdentityId): Promise<Identity | null>;

  /**
   * Define uma identity como ativa (sem reautenticar).
   * Útil para switching entre contas já autenticadas.
   */
  setActive(identityId: IdentityId): Promise<Identity>;

  /**
   * Remove permanentemente uma identity do dispositivo.
   * Não afeta o ledger Stellar — apenas remove os metadados locais.
   *
   * @throws IdentityError se tentar remover a identity ativa sem logout
   */
  remove(identityId: IdentityId): Promise<void>;

  // ─── Assinatura ───────────────────────────────────────────────────────────

  /**
   * Assina bytes arbitrários com a chave privada da identity ativa.
   * Requer sessão ativa.
   *
   * @param payload - Bytes a assinar (tipicamente o hash de uma transação Stellar)
   * @returns Assinatura em formato Uint8Array
   * @throws IdentityError se não houver sessão ativa ou o usuário cancelar
   */
  sign(payload: Uint8Array): Promise<Uint8Array>;
}
