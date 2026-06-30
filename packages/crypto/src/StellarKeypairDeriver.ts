/**
 * @walletnow/crypto — StellarKeypairDeriver (Stub)
 *
 * Stub da implementação de derivação de keypairs Stellar.
 * Lança NotImplementedError até que a dependência @stellar/stellar-sdk
 * seja adicionada e a implementação concreta seja escrita.
 *
 * Implementação concreta virá na Fase 2:
 * - MnemonicDeriver: BIP-39 + SLIP-0010 para Stellar Ed25519
 * - SecretKeyDeriver: parse de Stellar secret key (S...)
 * - PasskeyDeriver: derivação via output do authenticador WebAuthn
 */

import type { IKeypairDeriver, DeriveInput, DerivedKeypair } from '@walletnow/contracts';
import { NotImplementedError } from '@walletnow/contracts';

/**
 * StellarKeypairDeriver — Derivação de keypairs Stellar.
 *
 * STATUS: Stub — aguardando Fase 2 para implementação concreta.
 *
 * @example — Como será usado na Fase 2:
 * const deriver = new StellarKeypairDeriver();
 * const publicKey = await deriver.derivePublicKey({ type: 'mnemonic', mnemonic: '...' });
 * console.log(publicKey); // G...
 */
export class StellarKeypairDeriver implements IKeypairDeriver {
  async derivePublicKey(_input: DeriveInput): Promise<string> {
    throw new NotImplementedError('StellarKeypairDeriver', 'derivePublicKey');
  }

  async deriveKeypair(_input: DeriveInput): Promise<DerivedKeypair> {
    throw new NotImplementedError('StellarKeypairDeriver', 'deriveKeypair');
  }
}
