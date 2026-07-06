/**
 * @walletnow/identity — Public API
 */

export { IdentityEngine } from './IdentityEngine.js';

// Re-exporta contratos de identity
export type {
  IIdentityEngine,
  IAuthAdapter,
  Identity,
  IdentityId,
  IdentitySession,
  IdentityAuthResult,
  CreateIdentityParams,
} from '@walletnow/contracts';
