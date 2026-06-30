/**
 * @walletnow/identity — Public API Barrel
 *
 * Exportações públicas do Identity Engine.
 * Tudo que um builder precisa para gerenciar identidades no WalletNow OS.
 */

// ─── Interfaces ───────────────────────────────────────────────────────────────
export type { IIdentityEngine } from './interfaces/IIdentityEngine.js';

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  Identity,
  IdentityId,
  IdentityStatus,
  IdentityAuthMethod,
  IdentityMetadata,
  IdentitySession,
  IdentityAuthResult,
  CreateIdentityParams,
  CreateIdentityWithPasskeyParams,
  CreateIdentityWithKeypairParams,
  CreateIdentityReadonlyParams,
} from './types/identity.types.js';

// ─── Errors ───────────────────────────────────────────────────────────────────
export { IdentityError } from './errors/IdentityError.js';
export type { IdentityErrorCode } from './errors/IdentityError.js';
