/**
 * WalletNow Protocol — Errors Barrel
 *
 * Hierarquia completa de erros do protocolo.
 * ADR-000: INVARIANT-010
 *
 * WalletNowError
 * ├── AuthenticationError
 * ├── StorageError
 * ├── SignerError
 * ├── TransactionError
 * ├── NetworkError
 * ├── GasError
 * ├── RecoveryError
 * ├── ValidationError
 * ├── PluginError
 * └── StateError        ← violações da State Machine do Kernel
 */

export { WalletNowError } from './WalletNowError.js';
export { AuthenticationError } from './AuthenticationError.js';
export { StorageError } from './StorageError.js';
export { GasError } from './GasError.js';
export { TransactionError } from './TransactionError.js';
export { NetworkError } from './NetworkError.js';
export { RecoveryError } from './RecoveryError.js';
export { ValidationError } from './ValidationError.js';
export { SignerError } from './SignerError.js';
export { PluginError } from './PluginError.js';
export { StateError } from './StateError.js';
