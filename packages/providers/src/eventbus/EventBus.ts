/**
 * @walletnow/providers — WalletNow EventBus
 *
 * Barramento de eventos global e tipado do WalletNow OS.
 *
 * Princípios:
 * - Todos os domínios se comunicam através de eventos
 * - Eventos seguem o namespace {domain}.{action}
 * - Frontend (React/Vue), CLI, SDK e backends escutam os mesmos eventos
 * - Zero acoplamento direto entre domínios
 *
 * @example
 * // Escutar eventos
 * eventBus.on('wallet.connected', ({ publicKey }) => {
 *   console.log('Wallet conectada:', publicKey);
 * });
 *
 * @example
 * // Emitir eventos (use apenas dentro dos Engines)
 * eventBus.emit('swap.started', { assetIn: 'XLM', assetOut: 'USDC', amount: '100' });
 */

// ─── Event Catalog ────────────────────────────────────────────────────────────

/**
 * Catálogo de todos os eventos do WalletNow OS.
 * Namespace obrigatório: {domain}.{action}
 *
 * Adicionar novos eventos aqui mantém o sistema centralizado e tipado.
 */
export interface WalletNowOSEvents {

  // ─── OS / Kernel ─────────────────────────────────────────────────────────
  'os.ready':                    { version: string };
  'os.shutdown':                 void;

  // ─── Identity Engine ──────────────────────────────────────────────────────
  'identity.created':            { identityId: string; method: string };
  'identity.authenticated':      { identityId: string; publicKey: string };
  'identity.locked':             { identityId: string };
  'identity.logged_out':         { identityId: string };
  'identity.removed':            { identityId: string };

  // ─── Wallet Engine ────────────────────────────────────────────────────────
  'wallet.created':              { walletId: string; publicKey: string; network: string };
  'wallet.imported':             { walletId: string; publicKey: string };
  'wallet.connected':            { walletId: string; publicKey: string; network: string };
  'wallet.disconnected':         { walletId: string };
  'wallet.active_changed':       { walletId: string; publicKey: string };
  'wallet.removed':              { walletId: string };

  // ─── Account Engine ───────────────────────────────────────────────────────
  'account.synced':              { publicKey: string; xlmBalance: string };
  'account.activated':           { publicKey: string };
  'account.trustline_added':     { publicKey: string; assetCode: string; assetIssuer: string };

  // ─── Asset Engine ─────────────────────────────────────────────────────────
  'asset.balance_changed':       { publicKey: string; assetCode: string; balance: string };
  'asset.balances_refreshed':    { publicKey: string };

  // ─── Provider Registry ────────────────────────────────────────────────────
  'provider.registered':         { id: string; name: string; capabilities: string[] };
  'provider.unregistered':       { id: string };
  'provider.health_changed':     { id: string; status: string };
  'provider.initialize_failed':  { id: string; error: string };

  // ─── Transaction Pipeline ─────────────────────────────────────────────────
  'transaction.building':        { id: string; type: string };
  'transaction.built':           { id: string; xdr: string };
  'transaction.signing':         { id: string };
  'transaction.signed':          { id: string; xdr: string };
  'transaction.submitting':      { id: string };
  'transaction.submitted':       { id: string; txHash: string };
  'transaction.confirmed':       { id: string; txHash: string; ledger: number };
  'transaction.failed':          { id: string; error: string; code: string };

  // ─── Gas / Sponsor (Fee Abstraction Stellar) ──────────────────────────────
  'gas.sponsor_requested':       { publicKey: string; operationType: string };
  'gas.sponsor_completed':       { publicKey: string; txHash: string };
  'gas.sponsor_failed':          { publicKey: string; error: string };

  // ─── Swap ──────────────────────────────────────────────────────────────────
  'swap.quote_requested':        { assetIn: string; assetOut: string; amount: string };
  'swap.quote_received':         { amountOut: string; priceImpact: number; protocol: string };
  'swap.started':                { assetIn: string; assetOut: string; amount: string; publicKey: string };
  'swap.confirmed':              { txHash: string; amountOut: string; protocol: string };
  'swap.failed':                 { error: string; assetIn: string; assetOut: string };

  // ─── Yield ─────────────────────────────────────────────────────────────────
  'yield.deposit_started':       { providerId: string; amount: string; asset: string };
  'yield.deposit_confirmed':     { providerId: string; txHash: string; sharesReceived: string };
  'yield.withdraw_started':      { providerId: string; shares: string };
  'yield.withdraw_confirmed':    { providerId: string; txHash: string; amountReceived: string };

  // ─── Payments (PIX/On-Ramp) ───────────────────────────────────────────────
  'payment.pix_qr_generated':   { paymentId: string; amount: string; qrCode: string };
  'payment.pix_received':        { paymentId: string; amount: string; txHash: string };
  'payment.onramp_started':      { provider: string; amountFiat: string; currency: string };
  'payment.onramp_completed':    { provider: string; txHash: string; amountCrypto: string };

  // ─── Testnet Kit ──────────────────────────────────────────────────────────
  'testnet.faucet_claimed':      { publicKey: string; asset: string; amount: string };
  'testnet.account_funded':      { publicKey: string; xlmAmount: string };
  'testnet.liquidity_seeded':    { poolId: string; assetA: string; assetB: string };

  // ─── Erros Globais ────────────────────────────────────────────────────────
  'error':                       { code: string; message: string; domain?: string };
}

/** Nome tipado de todos os eventos do WalletNow OS */
export type WalletNowOSEventName = keyof WalletNowOSEvents;

/** Handler tipado para um evento */
export type OSEventHandler<K extends WalletNowOSEventName> = (
  payload: WalletNowOSEvents[K],
) => void | Promise<void>;

/** Função de cancelamento de assinatura de evento */
export type Unsubscribe = () => void;

// ─── EventBus Implementation ──────────────────────────────────────────────────

/**
 * WalletNowEventBus — Implementação do barramento de eventos global.
 *
 * Singleton que conecta todos os domínios do WalletNow OS.
 * Completamente tipado: o TypeScript garante que os payloads
 * correspondam ao evento correto em tempo de compilação.
 */
export class WalletNowEventBus {
  private readonly listeners = new Map<
    WalletNowOSEventName,
    Set<OSEventHandler<WalletNowOSEventName>>
  >();

  /**
   * Registra um handler para um evento.
   * @returns Função de cancelamento (unsubscribe)
   *
   * @example
   * const unsub = eventBus.on('wallet.connected', ({ publicKey }) => {
   *   console.log('Conectado:', publicKey);
   * });
   * // Remover o listener:
   * unsub();
   */
  on<K extends WalletNowOSEventName>(
    event: K,
    handler: OSEventHandler<K>,
  ): Unsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.listeners.get(event)!.add(handler as OSEventHandler<any>);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.listeners.get(event)?.delete(handler as OSEventHandler<any>);
    };
  }

  /**
   * Registra um handler que será chamado apenas uma vez.
   */
  once<K extends WalletNowOSEventName>(
    event: K,
    handler: OSEventHandler<K>,
  ): Unsubscribe {
    const unsub = this.on(event, (payload) => {
      unsub();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (handler as OSEventHandler<any>)(payload);
    });
    return unsub;
  }

  /**
   * Emite um evento para todos os handlers registrados.
   * Chamadas assíncronas são awaited silenciosamente.
   */
  emit<K extends WalletNowOSEventName>(
    event: K,
    payload: WalletNowOSEvents[K],
  ): void {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) return;

    for (const handler of handlers) {
      try {
        const result = handler(payload);
        // Se o handler retorna uma Promise, captura erros silenciosamente
        if (result instanceof Promise) {
          result.catch((err) => {
            console.error(`[WalletNow EventBus] Error in handler for '${event}':`, err);
          });
        }
      } catch (err) {
        console.error(`[WalletNow EventBus] Sync error in handler for '${event}':`, err);
      }
    }
  }

  /**
   * Remove todos os listeners de um evento específico.
   */
  off(event: WalletNowOSEventName): void {
    this.listeners.delete(event);
  }

  /**
   * Remove todos os listeners de todos os eventos.
   * Chamado durante o shutdown do OS.
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Lista os nomes dos eventos que têm listeners ativos.
   * Útil para debugging.
   */
  activeEvents(): WalletNowOSEventName[] {
    return Array.from(this.listeners.keys()).filter(
      (k) => (this.listeners.get(k)?.size ?? 0) > 0,
    );
  }
}

/** Instância singleton do EventBus do WalletNow OS */
export const eventBus = new WalletNowEventBus();
