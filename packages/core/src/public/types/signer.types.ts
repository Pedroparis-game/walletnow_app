/**
 * WalletNow Protocol — Signer Types
 *
 * Tipos relacionados à assinatura criptográfica.
 * O Signer opera sobre bytes puros — sem conhecimento de lógica de negócio.
 */

/** Tipo de signer disponível */
export type SignerType =
  | 'in-memory'    // Chave em RAM (volátil, limpa após disconnect)
  | 'passkeys'     // Secure Enclave via WebAuthn
  | 'hardware'     // Ledger/Trezor
  | 'external';    // Carteira externa (Freighter, Albedo)

/** Resultado de uma operação de assinatura */
export interface SignatureResult {
  /** Assinatura como Uint8Array */
  readonly signature: Uint8Array;
  /** Public key que assinou */
  readonly publicKey: string;
  /** Tipo de signer utilizado */
  readonly signerType: SignerType;
  /** Timestamp da assinatura */
  readonly signedAt: number;
}

/** Parâmetros para uma operação de assinatura */
export interface SignParams {
  /** Payload a ser assinado (bytes arbitrários ou XDR de transação) */
  readonly payload: Uint8Array;
  /** Public key a usar para assinar (deve estar no vault) */
  readonly publicKey: string;
  /** Contexto legível para exibir ao usuário em UIs de biometria */
  readonly displayMessage?: string;
}
