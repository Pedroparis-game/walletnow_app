/**
 * WalletNow Protocol — Abstract LoggerProvider
 *
 * ADR-000: INVARIANT-PROVIDERS-A — Não depende de outros Providers.
 * Builders podem usar Pino, Sentry, Datadog, Console ou qualquer outro.
 */

import type { ILoggerProvider } from '@walletnow/core';

export abstract class LoggerProvider implements ILoggerProvider {
  abstract debug(message: string, context?: Record<string, unknown>): void;
  abstract info(message: string, context?: Record<string, unknown>): void;
  abstract warn(message: string, context?: Record<string, unknown>): void;
  abstract error(message: string, context?: Record<string, unknown>): void;
}

/** Implementação Noop — descarta todos os logs. Útil para testes. */
export class NoopLoggerProvider extends LoggerProvider {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/** Implementação Console — usa console nativo do runtime. */
export class ConsoleLoggerProvider extends LoggerProvider {
  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(`[WalletNow] ${message}`, context ?? '');
  }
  info(message: string, context?: Record<string, unknown>): void {
    console.info(`[WalletNow] ${message}`, context ?? '');
  }
  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[WalletNow] ${message}`, context ?? '');
  }
  error(message: string, context?: Record<string, unknown>): void {
    console.error(`[WalletNow] ${message}`, context ?? '');
  }
}
