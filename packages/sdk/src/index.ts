/**
 * @walletnow/sdk — Public API Barrel
 *
 * Agrega e re-exporta todos os módulos do WalletNow OS em um único pacote.
 */

// ─── OS Entrypoint ────────────────────────────────────────────────────────────
export { WalletNowOS, ProviderRegistry, WalletNowEventBus } from '@walletnow/providers';

// ─── Engines ──────────────────────────────────────────────────────────────────
export { IdentityEngine } from '@walletnow/identity';
export { WalletEngine, AccountEngine } from '@walletnow/wallet';

// ─── Contracts (Tipos & Interfaces) ───────────────────────────────────────────
export * from '@walletnow/contracts';

// ─── Utilities (Storage & Crypto) ─────────────────────────────────────────────
export * from '@walletnow/storage';
export * from '@walletnow/crypto';
