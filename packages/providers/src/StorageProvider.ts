/**
 * WalletNow Protocol — Abstract StorageProvider
 *
 * Classe base para implementações de storage.
 * ADR-000: INVARIANT-PROVIDERS-A — Providers não dependem de outros Providers.
 *
 * Implementações oficiais futuras:
 * - @walletnow/provider-local (localStorage)
 * - @walletnow/provider-memory (MemoryStorage)
 * - @walletnow/provider-secure (Secure Enclave)
 * - @walletnow/provider-cloud (Cloud sync)
 */

import type { IStorageProvider } from '@walletnow/core';
import { StorageError } from '@walletnow/core';

export abstract class StorageProvider implements IStorageProvider {
  protected readonly namespace: string;

  constructor(namespace = 'walletnow') {
    this.namespace = namespace;
  }

  protected namespacedKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  abstract get(key: string): Promise<string | null>;
  abstract set(key: string, value: string): Promise<void>;
  abstract remove(key: string): Promise<void>;
  abstract clear(): Promise<void>;

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  protected handleError(operation: string, key: string, error: unknown): never {
    throw new StorageError(
      'STORAGE_OPERATION_FAILED',
      `Storage operation '${operation}' failed for key '${key}'.`,
      { operation, key, originalError: String(error) },
    );
  }
}

/** Provider de armazenamento seguro — requer unlock antes de leitura */
export abstract class SecureStorageProvider extends StorageProvider {
  abstract readonly encryptBeforeWrite: true;
  abstract requiresUnlock(): Promise<boolean>;
  abstract unlock(credential: unknown): Promise<void>;
  abstract lock(): Promise<void>;
}

/** Provider de armazenamento volátil em memória — limpo após restart */
export abstract class MemoryStorageProvider extends StorageProvider {
  abstract readonly isVolatile: true;
  abstract clearOnTimeout(seconds: number): void;
  abstract cancelTimeout(): void;
}

/** Provider com sincronização em nuvem */
export abstract class CloudStorageProvider extends StorageProvider {
  abstract syncToCloud(): Promise<void>;
  abstract restoreFromCloud(): Promise<void>;
  abstract getLastSyncAt(): Promise<number | null>;
}
