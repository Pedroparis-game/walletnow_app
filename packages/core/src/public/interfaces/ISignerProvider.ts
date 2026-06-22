/**
 * WalletNow Protocol — ISignerProvider
 *
 * Contrato de assinatura criptográfica.
 * Agnóstico de hardware (Ledger, Secure Enclave) vs software (RAM).
 */

import type { SignParams, SignatureResult } from '../types/signer.types.js';

export interface ISignerProvider {
  /** Retorna a public key gerenciada por este signer. */
  getPublicKey(): Promise<string>;

  /**
   * Assina um payload arbitrário.
   * INVARIANT-006: A chave privada usada aqui deve ser limpa da RAM após disconnect().
   */
  sign(params: SignParams): Promise<SignatureResult>;

  /** Verifica se este signer está disponível e pronto. */
  isAvailable(): Promise<boolean>;
}
