/**
 * @walletnow/identity — Identity Types
 *
 * Tipos centrais do Identity Engine.
 * A Identity é a entidade raiz do WalletNow OS.
 * Uma Identity pode possuir múltiplas Wallets, em múltiplas redes.
 *
 * Identity-First Model:
 *   Identity → Wallet → Account → Asset
 */

// ─── Identity Status ─────────────────────────────────────────────────────────

/** Estado do ciclo de vida da Identity */
export type IdentityStatus =
  | 'unauthenticated'  // Sem sessão ativa
  | 'authenticating'   // Autenticando via biometria ou provider
  | 'authenticated'    // Sessão ativa e válida
  | 'locking'          // Encerrando sessão
  | 'locked';          // Vault travado (sessão expirada)

// ─── Auth Methods ─────────────────────────────────────────────────────────────

/**
 * Método de autenticação suportado pelo Identity Engine.
 * Stellar-specific: passkeys é o método primário recomendado.
 */
export type IdentityAuthMethod =
  | 'passkeys'    // FIDO2/WebAuthn — método principal (Stellar + Passkeys SEP-30)
  | 'keypair'     // Par de chaves Stellar importado manualmente
  | 'mnemonic'    // BIP-39 mnemonic phrase
  | 'secret-key'  // Secret Key Stellar direta (S...)
  | 'readonly';   // Somente leitura (apenas public key, sem assinar)

// ─── Identity Entity ──────────────────────────────────────────────────────────

/** Identificador único de uma Identity */
export type IdentityId = string;

/**
 * Identity — Entidade raiz do WalletNow OS.
 *
 * Representa o usuário de forma abstrata, independente de qual
 * carteira ou conta Stellar ele está usando no momento.
 * Uma Identity pode possuir N Wallets.
 */
export interface Identity {
  /** ID interno único da identity */
  readonly id: IdentityId;
  /** Método usado para autenticação desta identity */
  readonly authMethod: IdentityAuthMethod;
  /** Label legível opcional (ex: "João Silva", "Conta Principal") */
  readonly label?: string;
  /** Timestamp de criação da identity */
  readonly createdAt: number;
  /** Timestamp do último login desta identity */
  readonly lastAuthAt: number;
  /** Se esta é a identity ativa no contexto atual */
  readonly isActive: boolean;
  /** Metadados adicionais de autenticação (ex: credentialId do Passkey) */
  readonly metadata?: IdentityMetadata;
}

/**
 * Metadados de autenticação armazenados junto à identity.
 * Sensível — nunca enviar para servidores externos.
 */
export interface IdentityMetadata {
  /** ID da credencial WebAuthn (para passkeys) */
  readonly credentialId?: string;
  /** Public key do authenticador (para passkeys) */
  readonly authenticatorPublicKey?: string;
  /** Algoritmo de assinatura usado (ex: -7 para ES256) */
  readonly algorithm?: number;
  /** RPId do domínio (para passkeys) */
  readonly rpId?: string;
}

// ─── Auth Params ──────────────────────────────────────────────────────────────

/** Parâmetros para criar uma nova Identity via Passkeys (FIDO2) */
export interface CreateIdentityWithPasskeyParams {
  readonly method: 'passkeys';
  /** Label para identificação da identity */
  readonly label?: string;
  /** RPId para o WebAuthn (ex: 'walletnow.app') — omitir usa o domínio atual */
  readonly rpId?: string;
  /** Nome de usuário exibido no prompt biométrico */
  readonly displayName?: string;
}

/** Parâmetros para criar uma nova Identity via secret key ou mnemonic */
export interface CreateIdentityWithKeypairParams {
  readonly method: 'keypair' | 'mnemonic' | 'secret-key';
  /** Secret key (S...) ou mnemonic BIP-39 */
  readonly secretOrMnemonic: string;
  /** Label para identificação da identity */
  readonly label?: string;
}

/** Parâmetros para criar uma Identity de somente leitura */
export interface CreateIdentityReadonlyParams {
  readonly method: 'readonly';
  /** Public key Stellar (G...) */
  readonly publicKey: string;
  /** Label para identificação da identity */
  readonly label?: string;
}

/** União discriminada de todos os parâmetros de criação de Identity */
export type CreateIdentityParams =
  | CreateIdentityWithPasskeyParams
  | CreateIdentityWithKeypairParams
  | CreateIdentityReadonlyParams;

// ─── Auth Result ──────────────────────────────────────────────────────────────

/** Resultado da criação ou autenticação de uma Identity */
export interface IdentityAuthResult {
  /** A identity criada ou autenticada */
  readonly identity: Identity;
  /** Public key Stellar derivada desta identity */
  readonly publicKey: string;
  /** Timestamp da autenticação */
  readonly authenticatedAt: number;
  /** Método usado */
  readonly method: IdentityAuthMethod;
}

// ─── Session ──────────────────────────────────────────────────────────────────

/** Estado da sessão ativa da Identity */
export interface IdentitySession {
  /** Identity proprietária da sessão */
  readonly identityId: IdentityId;
  /** Public key ativa na sessão */
  readonly publicKey: string;
  /** Timestamp de início da sessão */
  readonly startedAt: number;
  /** Tempo de expiração (null = nunca expira) */
  readonly expiresAt: number | null;
  /** Método de autenticação usado */
  readonly method: IdentityAuthMethod;
}
