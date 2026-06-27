/**
 * @walletnow/plugin-soroswap — Tokens conhecidos na Testnet
 *
 * Lista mínima de tokens para desenvolvimento em testnet.
 * Em produção, a lista é buscada dinamicamente via SoroswapTokenService.
 *
 * Contratos SAC (Stellar Asset Contracts) da testnet Soroswap.
 * Fonte: https://api.soroswap.finance (pools endpoint) + faucet oficial
 */

import type { SwapToken } from '@walletnow/core';

/**
 * Token nativo XLM.
 * Na Soroswap API, XLM é representado pelo valor 'native' no campo contract.
 */
export const XLM_TESTNET: SwapToken = {
  code: 'XLM',
  name: 'Stellar Lumens',
  contract: 'native',
  icon: 'https://stellar.org/images/assets/xlm-icon.svg',
  decimals: 7,
  org: 'Stellar Development Foundation',
};

/**
 * Tokens testnet conhecidos da Soroswap.
 * Os endereços podem mudar entre reimplantações da testnet.
 * Usar SoroswapTokenService.getTokenList() para lista atualizada.
 */
export const TESTNET_TOKENS: SwapToken[] = [
  XLM_TESTNET,
  {
    code: 'USDC',
    name: 'USD Coin',
    // Endereço SAC USDC Testnet (Circle)
    contract: 'CB3TLW74NBIOT3BUWOZ3TUM6RFDF6A4GVIRUQRQZABG5KPOUL4JJOV2F',
    icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg',
    decimals: 7,
    org: 'Circle',
  },
  {
    code: 'EURC',
    name: 'Euro Coin',
    // Endereço SAC EURC Testnet (Circle)
    contract: 'GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO',
    icon: 'https://cryptologos.cc/logos/euro-coin-eurc-logo.svg',
    decimals: 7,
    org: 'Circle',
  },
];

/** Mapa de contract → token para lookup rápido */
export const TESTNET_TOKEN_MAP = new Map<string, SwapToken>(
  TESTNET_TOKENS.map((t) => [t.contract, t]),
);
