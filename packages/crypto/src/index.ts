/**
 * @walletnow/crypto — Public API Barrel
 */

// ─── Stubs (prontos para Fase 2) ─────────────────────────────────────────────
export { StellarKeypairDeriver } from './StellarKeypairDeriver.js';
export { InMemoryStellarSigner } from './InMemoryStellarSigner.js';
export { WebCryptoEncryptor } from './WebCryptoEncryptor.js';

// ─── Re-exports de contratos (conveniência) ───────────────────────────────────
export type {
  IKeypairDeriver,
  DeriveInput,
  DerivedKeypair,
  IStellarSigner,
  IEncryptor,
  EncryptedData,
  IHasher,
  IMnemonicGenerator,
} from '@walletnow/contracts';
