/**
 * YieldPage — Página de Yield & DeFi via IYieldCapability.
 *
 * Renderiza vaults e protocolos de yield descobertos via manifesto.
 * INVARIANTE: Nunca importa DefindexPlugin diretamente.
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Info, ChevronRight, Shield, Zap, ExternalLink } from 'lucide-react';
import { useManifests } from '../hooks/useManifests';
import { useIntegrationEngine } from '../contexts/IntegrationEngineContext';
import ProtocolCard from '../components/protocol/ProtocolCard';
import EmptyState, { SkeletonCard, ErrorState, LoadingState } from '../components/ui/EmptyState';
import StatCard from '../components/ui/StatCard';
import type { ProtocolManifest } from '@walletnow/core';
import type { IYieldCapability, YieldVault } from '@walletnow/core';

// ─── Vault Card ───────────────────────────────────────────────────────────────

function VaultCard({ vault }: { vault: YieldVault }) {
  const riskColor = vault.riskLevel === 'low'
    ? 'var(--status-online)'
    : vault.riskLevel === 'medium'
    ? 'var(--status-degraded)'
    : 'var(--status-offline)';

  const riskLabel = { low: 'Baixo risco', medium: 'Médio risco', high: 'Alto risco' }[vault.riskLevel ?? 'low'];

  return (
    <div
      className="glass-card glass-card-hover"
      style={{
        padding: 'var(--space-5)',
        cursor: 'pointer',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
            {vault.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {vault.strategy ?? 'Estratégia automatizada'}
          </div>
        </div>

        <div style={{
          padding: '4px 10px',
          borderRadius: 999,
          background: `${riskColor}12`,
          border: `1px solid ${riskColor}25`,
          color: riskColor,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {riskLabel}
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>APY</div>
          <div style={{
            fontSize: 20,
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-yield)',
            letterSpacing: '-0.02em',
          }}>
            {vault.apy?.toFixed(1) ?? '—'}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>TVL</div>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)',
          }}>
            {vault.tvl ? `$${(vault.tvl / 1000).toFixed(1)}k` : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Token</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {vault.asset ?? 'Multi'}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-sm"
          style={{
            flex: 1,
            background: 'rgba(168,85,247,0.12)',
            color: 'var(--color-yield)',
            border: '1px solid rgba(168,85,247,0.2)',
          }}
        >
          Depositar
        </button>
        <button className="btn btn-ghost btn-icon-sm" title="Ver no explorer">
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Vault List ───────────────────────────────────────────────────────────────

function VaultList({ manifest }: { manifest: ProtocolManifest }) {
  const { engine } = useIntegrationEngine();
  const [vaults, setVaults] = useState<YieldVault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const capability = await engine.findByCapability<IYieldCapability>('yield', manifest.id);
        if (capability) {
          const vaultList = await capability.listVaults();
          setVaults(vaultList);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao carregar vaults';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [manifest.id, engine]);

  if (isLoading) {
    return (
      <div className="cards-grid-2" style={{ marginTop: 'var(--space-4)' }}>
        {[0, 1, 2, 3].map(i => <SkeletonCard key={i} height={180} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginTop: 'var(--space-4)' }}>
        <ErrorState description={error} />
      </div>
    );
  }

  if (vaults.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp size={20} />}
        title="Nenhum vault disponível"
        description="Os vaults de yield serão exibidos aqui quando disponíveis."
      />
    );
  }

  return (
    <div className="cards-grid-2" style={{ marginTop: 'var(--space-4)' }}>
      {vaults.map(vault => (
        <VaultCard key={vault.id} vault={vault} />
      ))}
    </div>
  );
}

// ─── YieldPage ────────────────────────────────────────────────────────────────

export default function YieldPage() {
  const { manifests, isLoading, error } = useManifests({ capability: 'yield' });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: 'var(--text-primary)' }}>
            Yield & DeFi
          </h1>
          <p className="section-subtitle">
            Faça seu capital trabalhar com vaults automatizados on-chain
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="cards-grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          label="Protocolos de Yield"
          value={String(manifests.length)}
          subtitle="Descobertos automaticamente"
          icon={<Zap size={14} />}
          accentColor="var(--color-yield)"
          monospace={false}
          loading={isLoading}
        />
        <StatCard
          label="Posição Total"
          value="—"
          subtitle="Conecte sua carteira"
          icon={<TrendingUp size={14} />}
          accentColor="var(--color-yield)"
          loading={false}
        />
        <StatCard
          label="Melhor APY"
          value="—"
          subtitle="Disponível agora"
          icon={<Shield size={14} />}
          accentColor="var(--color-yield)"
          loading={isLoading}
        />
      </div>

      {/* Content */}
      {error ? (
        <ErrorState description={error} />
      ) : isLoading ? (
        <LoadingState message="Descobrindo protocolos de yield..." />
      ) : manifests.length === 0 ? (
        <EmptyState
          icon={<TrendingUp size={24} />}
          title="Nenhum protocolo de yield disponível"
          description="Os protocolos de yield são descobertos automaticamente pelo Integration Engine."
        />
      ) : (
        manifests.map(manifest => (
          <section key={manifest.id} style={{ marginBottom: 'var(--space-8)' }}>
            {/* Protocol header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ProtocolCard manifest={manifest} compact />
              </div>
              <a
                href={manifest.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ gap: 4 }}
              >
                Docs <ChevronRight size={12} />
              </a>
            </div>

            {/* Vault list */}
            <VaultList manifest={manifest} />
          </section>
        ))
      )}

      {/* Info card */}
      <div style={{
        marginTop: 'var(--space-6)',
        padding: 'var(--space-5)',
        background: 'rgba(168,85,247,0.04)',
        border: '1px solid rgba(168,85,247,0.12)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        gap: 12,
      }}>
        <Info size={16} color="var(--color-yield)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Como funciona o Yield no WalletNow?
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            Os vaults são contratos Soroban que gerenciam sua liquidez automaticamente. 
            Você deposita ativos, recebe shares proporcionais, e o contrato aplica a estratégia para maximizar retornos. 
            Saques são processados on-chain com confirmação em ~5 segundos.
          </p>
        </div>
      </div>
    </div>
  );
}
