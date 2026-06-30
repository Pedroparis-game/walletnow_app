/**
 * @walletnow/crypto — WebCryptoEncryptor (Stub)
 *
 * Stub de encriptação AES-256-GCM usando Web Crypto API.
 *
 * Na Fase 2, usa:
 * - PBKDF2 para derivação de chave a partir de passphrase
 * - AES-GCM 256-bit para encriptação
 * - IV aleatório de 12 bytes por operação
 * - Salt aleatório de 32 bytes para PBKDF2
 *
 * Por que Web Crypto API?
 * - Disponível nativamente em browser E Node.js ≥ 15
 * - Operações criptográficas executam no nível do SO (não JS)
 * - Imune a timing attacks (execução em C)
 */

import type { IEncryptor, EncryptedData } from '@walletnow/contracts';
import { NotImplementedError } from '@walletnow/contracts';

/**
 * WebCryptoEncryptor — Encriptação AES-256-GCM.
 *
 * STATUS: Stub — aguardando Fase 2.
 *
 * @example — Como será na Fase 2:
 * const encryptor = new WebCryptoEncryptor();
 * const encrypted = await encryptor.encrypt(privateKeyBytes, 'user-passphrase');
 * // Armazene `encrypted` no ISecureStorage
 * const decrypted = await encryptor.decrypt(encrypted, 'user-passphrase');
 * // Use `decrypted` para criar o signer, depois descarte
 */
export class WebCryptoEncryptor implements IEncryptor {
  async encrypt(_data: Uint8Array, _passphrase: string): Promise<EncryptedData> {
    throw new NotImplementedError('WebCryptoEncryptor', 'encrypt');
  }

  async decrypt(_encrypted: EncryptedData, _passphrase: string): Promise<Uint8Array> {
    throw new NotImplementedError('WebCryptoEncryptor', 'decrypt');
  }
}
