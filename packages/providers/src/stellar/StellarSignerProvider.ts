import type { ISignerProvider } from '@walletnow/core';
import type { SignParams, SignatureResult } from '@walletnow/core';
import { Keypair, TransactionBuilder, Transaction } from '@stellar/stellar-sdk';

/**
 * Provedor de assinatura local que retém o segredo temporariamente.
 * Utilizado apenas em ambientes não-custodiais ou testes seguros.
 */
export class StellarSignerProvider implements ISignerProvider {
  private secretKey: string | null;
  private keypair: Keypair | null;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
    this.keypair = Keypair.fromSecret(secretKey);
  }

  async getPublicKey(): Promise<string> {
    if (!this.keypair) throw new Error('Signer is not initialized or disconnected.');
    return this.keypair.publicKey();
  }

  async sign(params: SignParams): Promise<SignatureResult> {
    if (!this.keypair) throw new Error('Signer is not available.');
    
    if (!params.payloadXdr || !params.networkPassphrase) {
      throw new Error('payloadXdr and networkPassphrase are required for Stellar signatures.');
    }

    // Converte o XDR assinado para transaction object
    let tx: Transaction;
    try {
      tx = new Transaction(params.payloadXdr, params.networkPassphrase);
    } catch (e) {
      throw new Error(`Invalid transaction XDR: ${e instanceof Error ? e.message : e}`);
    }

    tx.sign(this.keypair);

    return {
      signature: Buffer.from(tx.signatures[0]?.signature() || []),
      publicKey: this.keypair.publicKey(),
      signerType: 'in-memory',
      signedAt: Date.now(),
      signedPayloadXdr: tx.toXDR(),
    };
  }

  async isAvailable(): Promise<boolean> {
    return this.keypair !== null;
  }

  /**
   * INVARIANT-006: A chave privada deve ser limpa após o uso/disconnect
   */
  disconnect(): void {
    this.secretKey = null;
    this.keypair = null;
  }
}
