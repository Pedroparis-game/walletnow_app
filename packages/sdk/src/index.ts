/**
 * @walletnow/sdk — Public API Barrel (v4.1)
 *
 * Interface pública do WalletNow SDK.
 *
 * Princípio: O builder nunca deve ver Engines, Registries, Storage ou Crypto.
 * Este barrel expõe APENAS domínios orientados a negócio.
 *
 * Domínios disponíveis:
 *   - wn.onboarding  → Caso de uso nº 1: criar usuários na Stellar
 *
 * Uso:
 *   import { WalletNow } from '@walletnow/sdk';
 *   const wn = await WalletNow.init({ apiKey: '...' });
 *   const user = await wn.onboarding.createUser({ externalId: 'alice@...' });
 */

// ─── Entrypoint Principal (Facade) ─────────────────────────────────────────────
export { WalletNowClient } from './WalletNowClient.js';
export type { WalletNowClientConfig } from './WalletNowClient.js';

// ─── Domínio: Onboarding (Primeiro Domínio, Sempre) ──────────────────────────
export { OnboardingOrchestrator } from '@walletnow/onboarding';

// ─── Tipos Públicos do Domínio Onboarding ────────────────────────────────────
export type {
  IOnboardingDomain,
  CreateUserParams,
  RestoreUserParams,
  SetupTrustlinesParams,
  UserOnboardingResult,
  OnboardingAccountStatus,
  TrustlineSetupResult,
  OnboardingUserStatus,
} from '@walletnow/contracts';

// ─── Tipos de Rede (necessários para configuração) ───────────────────────────
export type {
  StellarNetworkType,
  StellarNetworkConfig,
} from '@walletnow/contracts';

// ─── Erros Públicos (o builder precisa conseguir capturar erros tipados) ──────
export {
  WalletNowError,
  OnboardingError,
  NetworkError,
} from '@walletnow/contracts';

export type {
  OnboardingErrorCode,
  NetworkErrorCode,
} from '@walletnow/contracts';

// ─── Kernel (para integração avançada — uso interno do SDK) ──────────────────
// NOTA: O builder NÃO deve importar WalletNowOS diretamente.
// Este export existe para testes e para provedores de plataforma.
// @internal
export { WalletNowOS } from '@walletnow/providers';
