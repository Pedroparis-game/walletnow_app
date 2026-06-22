/**
 * WalletNow Protocol — Gas Types
 *
 * Tipos relacionados ao patrocínio de taxas (Gasless Plugin).
 */

/** Status de uma solicitação de patrocínio */
export type SponsorStatus = 'requested' | 'approved' | 'rejected' | 'completed';

/** Solicitação de fee bump ao Relayer */
export interface SponsorRequest {
  readonly signedXdr: string;
  readonly sourcePublicKey: string;
  readonly requestedAt: number;
}

/** Resposta do Relayer com o XDR com fee bump */
export interface SponsorResponse {
  readonly feeBumpedXdr: string;
  readonly sponsorPublicKey: string;
  readonly fee: string;
  readonly respondedAt: number;
}

/** Estimativa de custo de uma transação */
export interface FeeEstimate {
  readonly baseFee: string;
  readonly recommendedFee: string;
  readonly currency: 'XLM';
  readonly estimatedAt: number;
}

/** Configuração do Relayer */
export interface GasConfig {
  readonly relayerUrl: string;
  readonly apiKey?: string;
  readonly autoSponsor: boolean;
  /** Timeout em ms para aguardar resposta do Relayer */
  readonly timeoutMs?: number;
}
