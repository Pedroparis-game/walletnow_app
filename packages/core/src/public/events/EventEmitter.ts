/**
 * WalletNow Protocol — EventEmitter
 *
 * Implementação do sistema de eventos global tipado.
 * ADR-000: INVARIANT-007 — Namespace {domain}.{action}
 * ADR-000: 2.0.4 — once() e removeAllListeners()
 *
 * INVARIANT-001: Zero dependências de runtime — implementação pura em TypeScript.
 */

import type { WalletNowEvents, EventHandler, UnsubscribeEvent } from '../types/event.types.js';

type AnyHandler = (payload: unknown) => void | Promise<void>;

export class EventEmitter {
  private readonly listeners = new Map<string, Set<AnyHandler>>();
  private readonly onceListeners = new Map<string, Set<AnyHandler>>();

  /**
   * Assina um evento. Retorna função de cancelamento.
   * ADR-000: INVARIANT-007 — evento deve seguir namespace {domain}.{action}
   */
  on<K extends keyof WalletNowEvents>(
    event: K,
    handler: EventHandler<WalletNowEvents, K>,
  ): UnsubscribeEvent {
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, new Set());
    }
    this.listeners.get(event as string)!.add(handler as AnyHandler);

    return () => this.off(event, handler);
  }

  /** Cancela uma assinatura específica. */
  off<K extends keyof WalletNowEvents>(
    event: K,
    handler: EventHandler<WalletNowEvents, K>,
  ): void {
    this.listeners.get(event as string)?.delete(handler as AnyHandler);
    this.onceListeners.get(event as string)?.delete(handler as AnyHandler);
  }

  /**
   * Assina um evento para ser executado apenas uma vez.
   * ADR-000: 2.0.4
   */
  once<K extends keyof WalletNowEvents>(
    event: K,
    handler: EventHandler<WalletNowEvents, K>,
  ): UnsubscribeEvent {
    if (!this.onceListeners.has(event as string)) {
      this.onceListeners.set(event as string, new Set());
    }
    this.onceListeners.get(event as string)!.add(handler as AnyHandler);

    return () => this.off(event, handler);
  }

  /** Emite um evento para todos os assinantes. */
  emit<K extends keyof WalletNowEvents>(event: K, payload: WalletNowEvents[K]): void {
    const key = event as string;

    // Handlers permanentes
    this.listeners.get(key)?.forEach((handler) => {
      void handler(payload);
    });

    // Handlers once — executa e remove
    const onceSet = this.onceListeners.get(key);
    if (onceSet) {
      onceSet.forEach((handler) => {
        void handler(payload);
      });
      this.onceListeners.delete(key);
    }
  }

  /**
   * Remove todos os listeners de um evento, ou de todos os eventos.
   * ADR-000: 2.0.4 — útil em React.useEffect cleanup
   */
  removeAllListeners(event?: keyof WalletNowEvents): void {
    if (event) {
      this.listeners.delete(event as string);
      this.onceListeners.delete(event as string);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }
}
