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
  /** Payload XDR assinado, se for uma transação Stellar */
  readonly signedPayloadXdr?: string;
}

/** Parâmetros para uma operação de assinatura */
export interface SignParams {
  /** Payload a ser assinado (bytes arbitrários) */
  readonly payload: Uint8Array;
  /** Public key a usar para assinar (deve estar no vault) */
  readonly publicKey: string;
  /** Contexto legível para exibir ao usuário em UIs de biometria */
  readonly displayMessage?: string;
  /** Payload em formato XDR, se for uma transação Stellar */
  readonly payloadXdr?: string;
  /** Passphrase da rede, necessário para validação do XDR */
  readonly networkPassphrase?: string;
}
