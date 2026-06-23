/**
 * Re-export de Compatibilidade — etherfuseV2Types.ts
 *
 * SPRINT G: Este arquivo agora é apenas um re-export para garantir
 * compatibilidade com o DepositModal.tsx e outros componentes existentes.
 *
 * Os tipos REAIS estão em @walletnow/provider-etherfuse.
 *
 * @see packages/providers/provider-etherfuse/src/etherfuse.types.ts
 */

export type {
  EfV2CreateCustomerRequest,
  EfV2CustomerResponse,
  EfV2KycIdentity,
  EfV2KycStatus,
  EfV2KycStatusResponse,
  EfV2RegisterPixRequest,
  EfV2Asset,
  EfV2AssetsResponse,
  EfV2QuoteResult,
  EfV2OrderResult,
  EfV2OrderStatus,
  EfV2Activity,
  EfV2PersistenceData,
  TrustlineResult,
} from '@walletnow/provider-etherfuse';

export {
  SANDBOX_PIX_CPF_MOCK,
  SANDBOX_KYC_MOCK_IDENTITY,
} from '@walletnow/provider-etherfuse';
