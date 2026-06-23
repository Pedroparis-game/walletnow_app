export interface SwapQuoteParams {
  assetIn: string;
  assetOut: string;
  amountIn: string;
}

export interface SwapQuote {
  assetIn: string;
  assetOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  feeAmount: string;
  route: string[];
}
