/**
 * WalletNow Protocol — IStorageProvider
 *
 * Contrato de persistência agnóstico de runtime.
 * ADR-000: INVARIANT-005 — Todo provider é injetado.
 * ADR-000: INVARIANT-PROVIDERS-A — Providers nunca dependem de outros Providers.
 */

export interface IStorageProvider {
  /**
   * Recupera um valor pelo chave.
   * @returns null se não encontrado.
   */
  get(key: string): Promise<string | null>;

  /**
   * Persiste um par chave-valor.
   * Dados sensíveis devem ser encriptados ANTES de chamar este método.
   * A encriptação é responsabilidade de quem escreve, não do Provider.
   */
  set(key: string, value: string): Promise<void>;

  /** Remove uma entrada pelo chave. */
  remove(key: string): Promise<void>;

  /** Remove todas as entradas do namespace deste provider. */
  clear(): Promise<void>;

  /** Verifica se uma chave existe. */
  has(key: string): Promise<boolean>;
}
