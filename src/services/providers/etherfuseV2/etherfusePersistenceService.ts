/**
 * Re-export de Compatibilidade — etherfusePersistenceService.ts
 *
 * SPRINT G: Este arquivo agora é apenas um re-export para garantir
 * compatibilidade com o DepositModal.tsx e outros componentes existentes.
 *
 * A implementação REAL está em @walletnow/provider-etherfuse.
 *
 * @see packages/providers/provider-etherfuse/src/EtherfusePersistenceService.ts
 */

export type { EfV2PersistenceData } from '@walletnow/provider-etherfuse';
export { EtherfusePersistenceService } from '@walletnow/provider-etherfuse';
