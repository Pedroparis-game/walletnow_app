/**
 * @walletnow/testing — Public API Barrel
 *
 * Exporta utilitários de teste e fakes.
 */

export { FakeIdentityEngine, FAKE_PUBLIC_KEY, FAKE_IDENTITY_ID } from './FakeIdentityEngine.js';
export { FakeProviderRegistry, makeFakeProvider } from './FakeProviderRegistry.js';
export { FakeEventBus } from './FakeEventBus.js';
export * from './builders.js';
