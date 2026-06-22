/**
 * WalletNow Protocol — ILoggerProvider
 *
 * Contrato de logging agnóstico de implementação.
 * Builders podem usar Pino, Sentry, Datadog, Console ou qualquer outro.
 * ADR-000: INVARIANT-PROVIDERS-A — Não pode depender de outros Providers.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ILoggerProvider {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}
