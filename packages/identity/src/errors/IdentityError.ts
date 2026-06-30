/**
 * @walletnow/identity — IdentityError
 *
 * Erros específicos do Identity Engine.
 */

export type IdentityErrorCode =
  | 'IDENTITY_NOT_FOUND'
  | 'IDENTITY_ALREADY_EXISTS'
  | 'IDENTITY_NOT_ACTIVE'
  | 'AUTHENTICATION_FAILED'
  | 'AUTHENTICATION_CANCELLED'
  | 'SESSION_EXPIRED'
  | 'SESSION_NOT_FOUND'
  | 'VAULT_LOCKED'
  | 'INVALID_SECRET'
  | 'PASSKEY_NOT_SUPPORTED'
  | 'PASSKEY_CREATION_FAILED'
  | 'SIGNING_FAILED'
  | 'CANNOT_REMOVE_ACTIVE_IDENTITY';

export class IdentityError extends Error {
  readonly code: IdentityErrorCode;
  readonly context?: Record<string, unknown>;

  constructor(code: IdentityErrorCode, message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'IdentityError';
    this.code = code;
    this.context = context;

    // Garantir que a instância da subclasse funcione corretamente no TypeScript
    Object.setPrototypeOf(this, IdentityError.prototype);
  }
}
