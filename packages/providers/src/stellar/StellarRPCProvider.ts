import type { IRPCProvider } from '@walletnow/core';
import type {
  AccountRecord,
  TransactionRecord,
  SubmitTransactionResult,
  BalanceStreamCallback,
  Unsubscribe,
} from '@walletnow/core';
import { Horizon } from '@stellar/stellar-sdk';

export class StellarRPCProvider implements IRPCProvider {
  private server: Horizon.Server;

  constructor(horizonUrl: string) {
    this.server = new Horizon.Server(horizonUrl);
  }

  async getAccount(publicKey: string): Promise<AccountRecord> {
    const account = await this.server.loadAccount(publicKey);
    return {
      id: account.id,
      sequence: account.sequence,
      subentryCount: account.subentry_count,
      thresholds: {
        low_threshold: account.thresholds.low_threshold,
        med_threshold: account.thresholds.med_threshold,
        high_threshold: account.thresholds.high_threshold,
      },
    };
  }

  async submitTransaction(xdr: string): Promise<SubmitTransactionResult> {
    // A API do Horizon requer um objeto Transaction, mas podemos submeter via POST direto
    // ou transformar o XDR. O SDK novo (TransactionBuilder) resolve isso.
    try {
      const response = await this.server.submitTransaction(xdr as any); // fallback para tipagem do SDK novo
      return {
        hash: response.hash,
        ledger: response.ledger,
        successful: response.successful,
        envelopeXdr: response.envelope_xdr,
        resultXdr: response.result_xdr,
      };
    } catch (e: any) {
      if (e.response && e.response.data) {
        throw new Error(`Submit failed: ${JSON.stringify(e.response.data)}`);
      }
      throw e;
    }
  }

  async getTransactions(publicKey: string, limit: number = 10): Promise<TransactionRecord[]> {
    const page = await this.server.transactions().forAccount(publicKey).order('desc').limit(limit).call();
    return page.records.map((r) => ({
      id: r.id,
      hash: r.hash,
      ledger: r.ledger_attr,
      createdAt: r.created_at,
      sourceAccount: r.source_account,
      feeCharged: String(r.fee_charged),
      successful: r.successful,
    }));
  }

  streamBalance(publicKey: string, callback: BalanceStreamCallback): Unsubscribe {
    // Utiliza SSE do Horizon para escutar operações e informar callback
    const closeStream = this.server.operations().forAccount(publicKey).cursor('now').stream({
      onmessage: () => callback(publicKey),
      onerror: () => { /* noop */ },
    });
    return () => closeStream();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const root = await this.server.root();
      return !!root.core_version;
    } catch {
      return false;
    }
  }
}
