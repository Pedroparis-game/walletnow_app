/**
 * WalletNow Protocol — Internal Assertion Utils
 *
 * Utilitários de validação internos. NUNCA exportados publicamente.
 * ADR-000: INVARIANT-001 — Zero dependências de runtime.
 */

import { ValidationError } from '../public/errors/ValidationError.js';
import { StateError } from '../public/errors/StateError.js';

/** Garante que uma condição é verdadeira ou lança ValidationError */
export function assert(condition: boolean, code: string, message: string): asserts condition {
  if (!condition) {
    throw new ValidationError(code, message);
  }
}

/** Garante que um valor não é null/undefined */
export function assertDefined<T>(
  value: T | null | undefined,
  code: string,
  message: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new ValidationError(code, message);
  }
}

/** Garante que o Kernel está no estado correto */
export function assertState(
  currentState: string,
  expectedState: string,
  operation: string,
): void {
  if (currentState !== expectedState) {
    throw new StateError(
      'INVALID_KERNEL_STATE',
      `Cannot call '${operation}' in state '${currentState}'. Expected: '${expectedState}'.`,
      { current: currentState, expected: expectedState, operation },
    );
  }
}

/** Garante que o Kernel está em um dos estados permitidos */
export function assertStateIn(
  currentState: string,
  allowedStates: string[],
  operation: string,
): void {
  if (!allowedStates.includes(currentState)) {
    throw new StateError(
      'INVALID_KERNEL_STATE',
      `Cannot call '${operation}' in state '${currentState}'. Allowed: ${allowedStates.join(', ')}.`,
      { current: currentState, operation, allowed: allowedStates },
    );
  }
}
