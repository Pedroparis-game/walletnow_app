/**
 * IntegrationEngineContext
 *
 * Provider React que inicializa e expõe o Integration Engine para toda a UI.
 *
 * A UI nunca importa SoroswapPlugin, DefindexPlugin ou EtherfusePlugin.
 * Ela conhece apenas: ProtocolManifest, Capability, DiscoveryService.
 *
 * Os manifestos são importados diretamente dos pacotes de plugin
 * (aprovado para hackathon — será substituído por LocalManifestRegistry pós-MVP).
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react';

import {
  DiscoveryService,
  HealthMonitor,
  IntegrationEngine,
  HealthStatus,
} from '@walletnow/core';
import type {
  ProtocolManifest,
} from '@walletnow/core';
import type { HealthCheckResult } from '@walletnow/core';

// Importação dos manifestos oficiais (não dos plugins — apenas os contratos públicos)
import { SOROSWAP_MANIFEST } from '@walletnow/plugin-soroswap';
import { DEFINDEX_MANIFEST } from '@walletnow/plugin-defindex';
import { ETHERFUSE_MANIFEST } from '@walletnow/plugin-etherfuse';

// ─── Portfolio Manifest (built-in, sem plugin externo) ────────────────────────
const PORTFOLIO_MANIFEST: ProtocolManifest = {
  id: 'portfolio',
  name: 'Portfolio',
  version: '1.0.0',
  category: 'wallet',
  description: 'Visão consolidada de todos os seus ativos, posições DeFi e investimentos em tempo real.',
  website: 'https://walletnow.app',
  icon: `${import.meta.env.BASE_URL}logo-walletnow.svg`,
  networks: ['testnet', 'mainnet'],
  capabilities: [
    {
      id: 'portfolio',
      version: '1.0.0',
      dependencies: [],
      experimental: false,
      permissions: ['network.read'],
      lifecycle: 'persistent',
      priority: 100,
    },
    {
      id: 'portfolio-contributor',
      version: '1.0.0',
      dependencies: [],
      experimental: false,
      permissions: ['network.read'],
      lifecycle: 'persistent',
      priority: 100,
    },
  ],
  permissions: ['network.read'],
  author: 'WalletNow',
  priority: 100,
  display: {
    section: 'other',
    priority: 100,
    featured: true,
    color: '#00FF99',
    actionLabel: 'Ver Portfolio',
  },
  healthCheck: async () => HealthStatus.ONLINE,
};

// ─── Tipos do Context ─────────────────────────────────────────────────────────

export interface HealthMap {
  [pluginId: string]: HealthCheckResult;
}

export interface IntegrationEngineContextValue {
  /** Engine principal — use para findByCapability, getManifest, etc. */
  engine: IntegrationEngine;
  /** Lista de todos os manifestos descobertos */
  manifests: ProtocolManifest[];
  /** Mapa de health por pluginId */
  healthStatuses: HealthMap;
  /** true enquanto a inicialização ainda está em andamento */
  isLoading: boolean;
  /** Erro de inicialização (raro) */
  error: string | null;
  /** Busca uma capability mockada do provider. Para hackathon MVP. */
  getCapability: <T>(capabilityId: string, manifestId?: string) => { manifest: ProtocolManifest; provider: T } | null;
  /** Re-executa o health check de todos os protocolos */
  refreshHealth: () => Promise<void>;
}

const IntegrationEngineContext = createContext<IntegrationEngineContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface IntegrationEngineProviderProps {
  children: ReactNode;
}

export function IntegrationEngineProvider({ children }: IntegrationEngineProviderProps) {
  const [manifests, setManifests] = useState<ProtocolManifest[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<HealthMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Engine é singleton — criado uma única vez
  const { engine } = useMemo(() => {
    const discovery = new DiscoveryService();
    const health = new HealthMonitor();
    const eng = new IntegrationEngine(discovery, health);
    return { engine: eng, discovery, health };
  }, []);

  const refreshHealth = async () => {
    const discovered = engine['discoveryService'].getDiscoveredManifests();
    const newHealth: HealthMap = {};
    await Promise.allSettled(
      discovered.map(async (m) => {
        const result = await engine.getHealthStatus(m.id);
        newHealth[m.id] = result;
      })
    );
    setHealthStatuses(newHealth);
  };

  const getCapability = <T,>(capabilityId: string, manifestId?: string) => {
    // MOCK para Hackathon: Em um cenário real, isso instanciaria o plugin correto
    const manifest = engine['discoveryService'].getDiscoveredManifests().find(m => 
      m.capabilities.some(c => c.id === capabilityId) && (!manifestId || m.id === manifestId)
    );
    if (!manifest) return null;

    // Retorna um provider com métodos mockados seguros para a UI não quebrar
    const provider = {
      getVaults: async () => [],
      listVaults: async () => [],
      getAvailableAssets: async () => [],
      getAssets: async () => [],
      getRates: async () => [],
    } as unknown as T;

    return { manifest, provider };
  };

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Registra os manifestos oficiais no Discovery Service
        engine['discoveryService'].registerLocalManifest(PORTFOLIO_MANIFEST);
        engine['discoveryService'].registerLocalManifest(SOROSWAP_MANIFEST);
        engine['discoveryService'].registerLocalManifest(DEFINDEX_MANIFEST);
        engine['discoveryService'].registerLocalManifest(ETHERFUSE_MANIFEST);

        // Inicializa a engine (dispara health checks em paralelo)
        await engine.initialize();

        const discovered = engine['discoveryService'].getDiscoveredManifests();
        setManifests(discovered);

        // Coleta health inicial
        const initialHealth: HealthMap = {};
        for (const m of discovered) {
          initialHealth[m.id] = engine.getHealthStatus(m.id);
        }
        setHealthStatuses(initialHealth);

        // Subscreve a mudanças de health em tempo real
        engine.subscribeToHealthChanges((pluginId, health) => {
          setHealthStatuses(prev => ({ ...prev, [pluginId]: health }));
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao inicializar Integration Engine';
        console.error('[IntegrationEngineContext]', err);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [engine]);

  const value = useMemo<IntegrationEngineContextValue>(
    () => ({ engine, manifests, healthStatuses, isLoading, error, refreshHealth, getCapability }),
    
    [engine, manifests, healthStatuses, isLoading, error]
  );

  return (
    <IntegrationEngineContext.Provider value={value}>
      {children}
    </IntegrationEngineContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useIntegrationEngine(): IntegrationEngineContextValue {
  const ctx = useContext(IntegrationEngineContext);
  if (!ctx) {
    throw new Error('useIntegrationEngine deve ser usado dentro de <IntegrationEngineProvider>');
  }
  return ctx;
}
