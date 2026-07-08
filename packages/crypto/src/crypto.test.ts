import { describe, it, expect } from 'vitest';
import { StellarKeypairDeriver } from './StellarKeypairDeriver';
import { WebCryptoEncryptor } from './WebCryptoEncryptor';

describe('@walletnow/crypto SDK Module', () => {
  describe('StellarKeypairDeriver', () => {
    it('should throw NotImplementedError for derivePublicKey currently (Stub phase)', async () => {
      const deriver = new StellarKeypairDeriver();
      
      await expect(
        deriver.derivePublicKey({ type: 'mnemonic', mnemonic: 'test mnemonic' })
      ).rejects.toThrowError('NotImplementedError');
    });

    it('should throw NotImplementedError for deriveKeypair currently (Stub phase)', async () => {
      const deriver = new StellarKeypairDeriver();
      
      await expect(
        deriver.deriveKeypair({ type: 'mnemonic', mnemonic: 'test mnemonic' })
      ).rejects.toThrowError('NotImplementedError');
    });
  });

  describe('WebCryptoEncryptor', () => {
    it('should throw NotImplementedError for encrypt currently (Stub phase)', async () => {
      const encryptor = new WebCryptoEncryptor();
      
      await expect(
        encryptor.encrypt(new Uint8Array([1, 2, 3]), 'passphrase')
      ).rejects.toThrowError('NotImplementedError');
    });

    it('should throw NotImplementedError for decrypt currently (Stub phase)', async () => {
      const encryptor = new WebCryptoEncryptor();
      
      await expect(
        encryptor.decrypt({ ciphertext: 'base64', iv: 'iv', salt: 'salt' }, 'passphrase')
      ).rejects.toThrowError('NotImplementedError');
    });
  });
});
