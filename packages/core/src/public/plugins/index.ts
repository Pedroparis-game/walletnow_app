/**
 * WalletNow Protocol — Plugins Barrel
 */

export type { IPlugin } from './IPlugin.js';
export type { IPluginHooks, NextFn, NextResultFn } from './IPluginHooks.js';
export { PluginRegistry } from './PluginRegistry.js';
export { CapabilityRegistry } from '../context/index.js';
export type {
  WalletNowContext,
  ExecutionContext,
  ExecutionContextFactory,
} from '../context/index.js';
