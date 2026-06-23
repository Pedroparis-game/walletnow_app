/**
 * Re-export de Compatibilidade — etherfuseActivityService.ts
 *
 * SPRINT G: Este arquivo agora é apenas um re-export para garantir
 * compatibilidade com o Dashboard.tsx e outros componentes existentes.
 *
 * A implementação REAL está em @walletnow/provider-etherfuse.
 *
 * @see packages/providers/provider-etherfuse/src/EtherfuseActivityService.ts
 */

export type { EfV2Activity } from '@walletnow/provider-etherfuse';
export { EtherfuseActivityService } from '@walletnow/provider-etherfuse';
