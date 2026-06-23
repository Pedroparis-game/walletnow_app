/**
 * @walletnow/providers — Public API Barrel
 *
 * Classes abstratas e implementações base de providers.
 * Builders estendem estas classes para criar providers concretos.
 *
 * @example
 * import { StorageProvider } from '@walletnow/providers';
 * class MyLocalStorageProvider extends StorageProvider { ... }
 */

export {
  StorageProvider,
  SecureStorageProvider,
  MemoryStorageProvider,
  CloudStorageProvider,
} from './StorageProvider.js';

export { AuthProvider } from './AuthProvider.js';

export {
  LoggerProvider,
  NoopLoggerProvider,
  ConsoleLoggerProvider,
} from './LoggerProvider.js';

export {
  ChainProvider,
  TestnetChainProvider,
  MainnetChainProvider,
} from './ChainProvider.js';

export * from './stellar/StellarChainProvider.js';
export * from './stellar/StellarRPCProvider.js';
export * from './stellar/StellarSignerProvider.js';
export * from './stellar/FreighterSignerProvider.js';
