/**
 * @walletnow/crypto — InMemoryStellarSigner (Stub)
 *
 * Stub de implementação de assinatura de transações Stellar em memória.
 * Na Fase 2, este signer receberá a secret key decriptada do vault
 * e a usará para assinar XDRs de transação.
 *
 * Hierarchy de signers (Fase 2+):
 * - InMemoryStellarSigner: chave privada temporária em RAM (auto-limpeza no logout)
 * - PasskeyStellarSigner: assina via Secure Enclave (WebAuthn)
 * - FreighterStellarSigner: delega para extensão browser Freighter
 */

import type { IStellarSigner } from '@walletnow/contracts';
import { NotImplementedError } from '@walletnow/contracts';

/**
 * InMemoryStellarSigner — Signer de transações Stellar.
 *
 * STATUS: Stub — aguardando Fase 2.
 *
 * Na implementação concreta:
 * 1. Recebe a private key decriptada do vault
 * 2. Assina XDRs via stellar-sdk Keypair.sign()
 * 3. Limpa a chave da RAM via zeroize() no logout
 *
 * @example — Como será na Fase 2:
 * const signer = new InMemoryStellarSigner(keypair);
 * const signedXdr = await signer.signTransaction(unsignedXdr, passphrase);
 */
export class InMemoryStellarSigner implements IStellarSigner {
  readonly publicKey: string;

  constructor(publicKey: string) {
    this.publicKey = publicKey;
  }

  async signTransaction(_xdr: string, _networkPassphrase: string): Promise<string> {
    throw new NotImplementedError('InMemoryStellarSigner', 'signTransaction');
  }

  async signPayload(_payload: Uint8Array): Promise<Uint8Array> {
    throw new NotImplementedError('InMemoryStellarSigner', 'signPayload');
  }

  isReady(): boolean {
    // Fase 2: retorna true apenas se a chave privada estiver carregada em RAM
    return false;
  }

  zeroize(): void {
    // Fase 2: sobrescreve a chave privada em RAM com zeros
    // e remove a referência
  }
}
