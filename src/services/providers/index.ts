export * from './depositProvider';
export * from './wooviProvider';
export * from './etherfuseProvider';
export * from './stripeProvider';
export * from './stellarTestAnchor/stellarTestAnchorProvider';

import { wooviProvider } from './wooviProvider';
import { etherfuseProvider } from './etherfuseProvider';
import { stripeProvider } from './stripeProvider';
import { stellarTestAnchorProvider } from './stellarTestAnchor/stellarTestAnchorProvider';
import { IDepositProvider } from './depositProvider';

/**
 * Registry centralizado de providers de depósito.
 * Ordem: ativos (Woovi, Stellar TestAnchor) → coming_soon (Stripe, Etherfuse).
 * Etherfuse: congelada como experimental/enterprise (compliance sandbox pendente).
 */
export const availableProviders: IDepositProvider[] = [
  wooviProvider,
  stellarTestAnchorProvider,
  stripeProvider,
  etherfuseProvider,
];

