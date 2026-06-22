/**
 * WalletNow Protocol — WalletNowError (Base)
 *
 * Classe base de todos os erros do protocolo.
 * ADR-000: INVARIANT-010 — Todo erro é instância de WalletNowError.
 */

export class WalletNowError extends Error {
  /** Código de erro tipado para switch/case */
  readonly code: string;
  /** Contexto adicional para debugging */
  readonly context?: Record<string, unknown> | undefined;
  /** Timestamp do erro */
  readonly timestamp: number;

  constructor(
    code: string,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'WalletNowError';
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();

    // Mantém stack trace correto em V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
