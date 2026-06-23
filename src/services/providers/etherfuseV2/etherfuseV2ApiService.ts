/**
 * Re-export de Compatibilidade — etherfuseV2ApiService.ts
 *
 * SPRINT G: Este arquivo agora é apenas um re-export para garantir
 * compatibilidade com a UI existente (DepositModal, Dashboard, etc.)
 *
 * A implementação REAL está em @walletnow/provider-etherfuse.
 *
 * @see packages/providers/provider-etherfuse/src/EtherfuseV2ApiService.ts
 */

// ─── Re-exports de Tipos ─────────────────────────────────────────────────────
export type {
  EfV2CustomerResponse,
  EfV2KycStatus,
  EfV2KycStatusResponse,
  EfV2AssetsResponse,
  EfV2QuoteResult,
  EfV2OrderResult,
  EfV2OrderStatus,
} from '@walletnow/provider-etherfuse';

export { EfV2HttpError } from '@walletnow/provider-etherfuse';

// ─── Re-export da Factory ─────────────────────────────────────────────────────
export { createEtherfuseV2ApiService } from '@walletnow/provider-etherfuse';

// ─── Instância com Configuração de Ambiente (Vite) ───────────────────────────
//
// Este objeto cria a instância configurada com as variáveis de ambiente do Vite.
// É a única referência a import.meta.env em todo o sistema Etherfuse.
//
import { createEtherfuseV2ApiService as _create } from '@walletnow/provider-etherfuse';

export const EtherfuseV2ApiService = _create({
  proxyEndpoint: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/etherfuse-proxy`,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
});
