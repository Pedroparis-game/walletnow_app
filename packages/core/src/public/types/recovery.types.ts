/**
 * WalletNow Protocol — Recovery Types
 *
 * Tipos para operações de backup e recuperação de acesso.
 */

/** Status de uma operação de recovery */
export type RecoveryStatus = 'idle' | 'in-progress' | 'completed' | 'failed';

/** Métodos de recuperação disponíveis */
export type RecoveryMethod =
  | 'backup-phrase'   // Mnemonic BIP-39 exportado pelo usuário
  | 'social'          // Shamir Secret Sharing (futuro)
  | 'cloud';          // Backup em cloud provider (futuro)

/** Metadados de um backup */
export interface BackupMetadata {
  readonly method: RecoveryMethod;
  readonly publicKey: string;
  readonly label?: string;
  readonly createdAt: number;
  readonly checksum: string;
}

/** Resultado de uma operação de restore */
export interface RecoveryResult {
  readonly success: boolean;
  readonly recoveredPublicKey: string;
  readonly method: RecoveryMethod;
  readonly recoveredAt: number;
}
