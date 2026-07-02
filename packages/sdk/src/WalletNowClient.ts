/**
 * @walletnow/sdk — WalletNowClient
 *
 * Facade de alto nível para o WalletNow OS.
 * Oculta toda a infraestrutura (Kernel, Engines, Storage) do builder.
 * Expõe apenas os domínios de negócio, como Onboarding.
 */

import { WalletNowOS } from '@walletnow/providers';
import { OnboardingOrchestrator } from '@walletnow/onboarding';
import type { OnboardingContext } from '@walletnow/onboarding';
import type { IIdentityEngine, IWalletEngine, IAccountEngine } from '@walletnow/contracts';

export interface WalletNowClientConfig {
  apiKey?: string;
  network?: 'mainnet' | 'testnet';
  engines?: Partial<OnboardingContext>;
}

export class WalletNowClient {
  private constructor(
    private readonly os: WalletNowOS,
    public readonly onboarding: OnboardingOrchestrator,
  ) {}

  /**
   * Inicializa o WalletNow SDK.
   * Dá boot no WalletNow OS e instancializa os domínios de negócio.
   */
  static async init(config: WalletNowClientConfig): Promise<WalletNowClient> {
    const network = config.network ?? 'testnet';

    // 1. Inicializa o Kernel (WalletNowOS)
    const os = new WalletNowOS();
    await os.boot({ network });

    // 2. Extrai engines do OS para compor o contexto do domínio Onboarding
    // NOTA: Em uma implementação real, os ports (gasStation, faucet, etc)
    // seriam implementações concretas que chamam a API do WalletNow Cloud.
    const onboardingCtx: OnboardingContext = {
      identity: config.engines?.identity ?? os.identity,
      wallet: config.engines?.wallet ?? os.wallet,
      account: config.engines?.account ?? os.account,
      
      // FIXME: Implementações reais a serem criadas na próxima sprint
      gasStation: config.engines?.gasStation ?? ({} as any),
      faucet: config.engines?.faucet ?? ({} as any),
      session: config.engines?.session ?? ({} as any),
      analytics: config.engines?.analytics ?? ({} as any),
      
      network,
    };

    // 3. Instancia o Domínio Onboarding
    const onboarding = new OnboardingOrchestrator(onboardingCtx);

    return new WalletNowClient(os, onboarding);
  }

  /**
   * Encerra todos os serviços em background.
   */
  async destroy(): Promise<void> {
    await this.os.shutdown();
  }
}
