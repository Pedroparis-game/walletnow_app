import { Horizon } from '@stellar/stellar-sdk';
import { logger } from '../../../utils/logger';

export interface EfV2Activity {
  orderId: string;
  txHash: string;
  explorerUrl: string;
  asset: string;
  amountBRL: string;
  amountToken: string;
  status: string;
  createdAt: string;
  completedAt: string;
  type: 'BUY TESOURO' | 'SELL TESOURO';
}

const STORAGE_PREFIX = 'walletnow_ef2_activity_';
const LOG_TAG = '[WalletNow][EtherfuseActivity]';

export const EtherfuseActivityService = {
  /**
   * Salva uma nova atividade no histórico local persistente da carteira.
   */
  saveActivity(publicKey: string, activity: EfV2Activity): void {
    const activities = this.getActivities(publicKey);
    
    // Evita duplicatas baseada na orderId
    const existingIndex = activities.findIndex(a => a.orderId === activity.orderId);
    if (existingIndex >= 0) {
      activities[existingIndex] = activity;
    } else {
      activities.unshift(activity); // Adiciona no início
    }

    try {
      localStorage.setItem(`${STORAGE_PREFIX}${publicKey}`, JSON.stringify(activities));
      logger.info(LOG_TAG, 'Activity saved locally', { orderId: activity.orderId });
    } catch (e) {
      logger.error(LOG_TAG, 'Failed to save activity', { error: String(e) });
    }
  },

  /**
   * Recupera todo o histórico salvo localmente.
   */
  getActivities(publicKey: string): EfV2Activity[] {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${publicKey}`);
      if (!raw) return [];
      return JSON.parse(raw) as EfV2Activity[];
    } catch {
      return [];
    }
  },

  /**
   * Tenta localizar a transação on-chain mais recente de recebimento de TESOURO na carteira
   * caso a Etherfuse não retorne o txHash diretamente via API.
   */
  async findLatestTesouroTransaction(publicKey: string): Promise<string | null> {
    logger.info(LOG_TAG, 'Searching settlement transaction via Horizon fallback', { publicKey });

    try {
      const server = new Horizon.Server('https://horizon-testnet.stellar.org');
      const page = await server.payments()
        .forAccount(publicKey)
        .limit(10)
        .order('desc')
        .call();

      for (const record of page.records) {
        if (record.type === 'payment' && (record as any).asset_code === 'TESOURO' && (record as any).to === publicKey) {
          logger.info(LOG_TAG, 'Settlement hash found', { txHash: record.transaction_hash });
          return record.transaction_hash;
        }
      }
      
      logger.warn(LOG_TAG, 'No recent TESOURO deposit found via fallback');
      return null;
    } catch (err) {
      logger.error(LOG_TAG, 'Horizon fallback search failed', { error: String(err) });
      return null;
    }
  }
};
