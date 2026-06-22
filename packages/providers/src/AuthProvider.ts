/**
 * WalletNow Protocol — Abstract AuthProvider
 *
 * ADR-000: INVARIANT-PROVIDERS-A — Não depende de outros Providers.
 */

import type { IAuthProvider } from '@walletnow/core';
import { AuthenticationError } from '@walletnow/core';

export abstract class AuthProvider implements IAuthProvider {
  abstract getCurrentUserId(): Promise<string | null>;
  abstract isAuthenticated(): Promise<boolean>;
  abstract signIn(params?: Record<string, unknown>): Promise<{ userId: string }>;
  abstract signOut(): Promise<void>;

  protected handleAuthError(operation: string, error: unknown): never {
    throw new AuthenticationError(
      'AUTH_OPERATION_FAILED',
      `Auth operation '${operation}' failed.`,
      { operation, originalError: String(error) },
    );
  }
}
