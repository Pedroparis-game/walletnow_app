/**
 * WalletNow Protocol — PluginRegistry + WalletNowContext
 *
 * Gerencia o ciclo de vida de plugins e expõe o WalletNowContext.
 * ADR-000: INVARIANT-014 — Context imutável após boot().
 * ADR-000: 2.0.1 — executionFactory no Context.
 */

import type { WalletNowContext } from '../context/index.js';
import type { PluginsHealthReport } from '../types/plugin.types.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { PluginError } from '../errors/PluginError.js';

/** PluginRegistry — gerencia ciclo de vida dos plugins */
export class PluginRegistry {
  private readonly staged: Map<string, import('./IPlugin.js').IPlugin> = new Map();
  private readonly installed: Map<string, import('./IPlugin.js').IPlugin> = new Map();

  /** Registra um plugin para instalação durante boot() */
  stage(plugin: import('./IPlugin.js').IPlugin): void {
    if (this.staged.has(plugin.name)) {
      throw new PluginError(
        'PLUGIN_ALREADY_STAGED',
        `Plugin '${plugin.name}' is already staged for installation.`,
        { name: plugin.name },
      );
    }
    this.staged.set(plugin.name, plugin);
  }

  /** Instala todos os plugins staged, ordenados por priority (desc) */
  async installAll(ctx: WalletNowContext): Promise<void> {
    const sorted = Array.from(this.staged.values()).sort(
      (a, b) => (b.descriptor.priority ?? 50) - (a.descriptor.priority ?? 50),
    );

    for (const plugin of sorted) {
      await plugin.install(ctx);
      this.installed.set(plugin.name, plugin);
      ctx.events.emit('plugin.loaded', {
        id: plugin.descriptor.id,
        version: plugin.descriptor.version,
      });
    }
  }

  /** Desinstala todos os plugins em ordem reversa */
  async uninstallAll(events: EventEmitter): Promise<void> {
    const plugins = Array.from(this.installed.values()).reverse();
    for (const plugin of plugins) {
      await plugin.uninstall();
      events.emit('plugin.unloaded', { id: plugin.descriptor.id });
    }
    this.installed.clear();
  }

  /** Executa health check em todos os plugins instalados */
  async health(): Promise<PluginsHealthReport> {
    const report: PluginsHealthReport = {};
    for (const [name, plugin] of this.installed) {
      report[name] = {
        ...(await plugin.health()),
        checkedAt: Date.now(),
      };
    }
    return report;
  }

  getInstalled(): Map<string, import('./IPlugin.js').IPlugin> {
    return new Map(this.installed);
  }

  getStaged(): Map<string, import('./IPlugin.js').IPlugin> {
    return new Map(this.staged);
  }
}
