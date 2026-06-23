export interface RwaAsset {
  id: string;
  name: string;
  symbol: string;
  tvlUsd: number;
  projectedApy: number;
  maturityDate?: string;
}
