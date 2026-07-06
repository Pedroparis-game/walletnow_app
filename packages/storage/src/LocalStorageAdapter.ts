/**
 * @walletnow/storage — LocalStorageAdapter
 *
 * Implementação de IStorage usando window.localStorage.
 * Apenas para ambientes browser — não persiste dados sensíveis.
 *
 * Para dados sensíveis (chaves privadas), use ISecureStorage.
 *
 * Usos:
 * - Preferências do usuário (tema, rede preferida)
 * - Metadados de identities (label, createdAt — sem chaves)
 * - Cache de estado de UI
 */

import type { IStorage } from '@walletnow/contracts';
import { StorageError } from '@walletnow/contracts';

/**
 * LocalStorageAdapter — IStorage para ambientes browser.
 *
 * Namespaceado: todas as chaves são prefixadas com `walletnow:{namespace}:`
 * para evitar colisões com outras aplicações no mesmo domínio.
 *
 * @example
 * const storage = new LocalStorageAdapter('identity');
 * await storage.set('active', JSON.stringify({ id: 'abc', label: 'Minha Wallet' }));
 * const raw = await storage.get('active'); // '{"id":"abc",...}'
 */
export class LocalStorageAdapter implements IStorage {
  private readonly prefix: string;

  constructor(namespace: string) {
    this.prefix = `walletnow:${namespace}:`;
  }

  private prefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(this.prefixedKey(key));
    } catch (err) {
      throw new StorageError('STORAGE_READ_FAILED', `Falha ao ler '${key}'`, { cause: String(err) });
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(this.prefixedKey(key), value);
    } catch (err) {
      throw new StorageError('STORAGE_WRITE_FAILED', `Falha ao escrever '${key}'`, { cause: String(err) });
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.prefixedKey(key));
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(this.prefixedKey(key)) !== null;
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    for (const key of keys) {
      localStorage.removeItem(this.prefixedKey(key));
    }
  }

  async keys(): Promise<string[]> {
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const rawKey = localStorage.key(i);
      if (rawKey?.startsWith(this.prefix)) {
        result.push(rawKey.slice(this.prefix.length));
      }
    }
    return result;
  }
}
