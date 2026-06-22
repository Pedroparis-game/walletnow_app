/**
 * WalletNow Protocol — IAuthProvider
 *
 * Contrato de autenticação e gestão de identidade de sessão.
 * ADR-000: INVARIANT-005 — Todo provider é injetado.
 * ADR-000: INVARIANT-PROVIDERS-A — Não pode depender de outros Providers.
 */

export interface IAuthProvider {
  /** Retorna o ID único do usuário autenticado, ou null. */
  getCurrentUserId(): Promise<string | null>;

  /** Verifica se existe sessão ativa. */
  isAuthenticated(): Promise<boolean>;

  /**
   * Inicia o fluxo de autenticação.
   * A implementação concreta define o método (email, OAuth, etc.).
   */
  signIn(params?: Record<string, unknown>): Promise<{ userId: string }>;

  /** Encerra a sessão atual. */
  signOut(): Promise<void>;
}
