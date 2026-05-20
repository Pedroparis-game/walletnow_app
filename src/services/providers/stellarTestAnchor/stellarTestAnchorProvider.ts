/**
 * Stellar Native XLM Deposit Provider
 *
 * [PT-BR] Provider de depósito via PIX com settlement final em XLM (Stellar Native).
 * Reutiliza 100% do fluxo Woovi existente. Substitui apenas o settlement final:
 * em vez de mintar BRW (token mock interno), envia XLM real da Stellar Testnet
 * a partir da treasury wallet (hot wallet operacional separada do issuer BRW).
 *
 * Posicionamento no selector de providers: abaixo do Stripe (após os providers fiat).
 * Etherfuse mantida como 'coming_soon' (congelada como experimental/enterprise).
 */

import { BaseDepositProvider, ProviderStatus } from '../depositProvider';
import { logger } from '../../../utils/logger';

export class StellarNativeXlmProvider extends BaseDepositProvider {
  id = 'stellar_testanchor';
  name = 'On/Off Ramp XLM Nativo';
  status: ProviderStatus = 'active';
  description = 'PIX → settlement real em XLM nativo na Stellar Testnet.';
  buttonLabel = 'Continue with PIX';
  iconName = 'Zap';

  public async initiateDeposit(amount: number, userId: string): Promise<any> {
    logger.info(
      '[WalletNow][TestAnchor]',
      `Iniciando depósito XLM Nativo para usuário ${userId}, valor: ${amount}`
    );

    // O fluxo de geração PIX é tratado no DepositModal (WooviService.createCharge).
    // Este método existe para conformidade com a interface — o settlement real
    // ocorre em StellarTestAnchorService.settleXLM() chamado pelo DepositModal.
    return { provider: this.id, amount, userId };
  }
}

export const stellarTestAnchorProvider = new StellarNativeXlmProvider();
