/**
 * WalletNow Protocol — Wallet Types
 *
 * Entidade central que representa a identidade de um usuário no protocolo.
 * A Wallet é um Identity Object — não executa transações (INVARIANT-011).
 */

/** Estado do ciclo de vida da Wallet */
export type WalletStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting';

/** Tipo de conexão: autocustódia local vs provider externo */
export type WalletConnectionType =
  | 'local'       // Chave gerada/importada localmente, armazenada no vault
  | 'passkeys'    // Passkeys Plugin (WebAuthn)
  | 'external'    // Freighter, Albedo, WalletConnect
  | 'readonly';   // Apenas leitura, sem capacidade de assinar

/** Identificador único de uma Wallet */
export type WalletId = string;

/** Representa a identidade on-chain de um usuário */
export interface WalletAccount {
  /** ID interno do protocolo */
  readonly id: WalletId;
  /** Public key Stellar (formato G...) */
  readonly publicKey: string;
  /** Label legível definido pelo usuário */
  readonly label?: string;
  /** Tipo de conexão desta conta */
  readonly connectionType: WalletConnectionType;
  /** Timestamp de criação no protocolo */
  readonly createdAt: number;
  /** Se esta é a conta ativa no momento */
  readonly isActive: boolean;
  /** Metadados opcionais do provedor externo */
  readonly metadata?: Record<string, unknown>;
}

/** Resultado de uma operação de conexão */
export interface WalletConnectResult {
  readonly account: WalletAccount;
  readonly connectionType: WalletConnectionType;
  readonly connectedAt: number;
}

/** Parâmetros para importar uma conta existente */
export interface WalletImportParams {
  /** Secret key (começa com S...) ou mnemonic BIP-39 */
  readonly secretOrMnemonic: string;
  /** Label legível opcional */
  readonly label?: string;
  /** Se deve tornar esta conta a ativa imediatamente */
  readonly setAsActive?: boolean;
}
