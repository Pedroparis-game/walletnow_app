/**
 * WalletNow Protocol — Vault Types
 *
 * Representa o vault criptografado local do usuário.
 * O vault nunca contém chaves em plaintext — apenas encrypted blobs.
 * INVARIANT-006: Nenhum segredo persiste após disconnect().
 */

/** Estado do vault */
export type VaultStatus = 'locked' | 'unlocked' | 'uninitialized';

/** Entrada criptografada no vault */
export interface VaultEntry {
  /** ID da entrada (geralmente publicKey) */
  readonly id: string;
  /** Dados encriptados como base64 */
  readonly encryptedData: string;
  /** IV usado na encriptação como base64 */
  readonly iv: string;
  /** Algoritmo de encriptação usado */
  readonly algorithm: 'AES-GCM-256';
  /** Timestamp de criação */
  readonly createdAt: number;
  /** Timestamp da última modificação */
  readonly updatedAt: number;
}

/** Manifesto do vault (metadados não sensíveis) */
export interface VaultManifest {
  readonly version: '1';
  readonly entries: Array<{
    readonly id: string;
    readonly label?: string;
    readonly createdAt: number;
  }>;
}

/** Resultado de uma operação de unlock do vault */
export interface VaultUnlockResult {
  readonly success: boolean;
  readonly unlockedAt: number;
  /** Tempo de expiração em ms (após isso o vault bloqueia automaticamente) */
  readonly expiresIn?: number;
}
