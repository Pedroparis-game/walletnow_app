import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Landmark, ArrowLeftRight, ChevronRight } from 'lucide-react';
import { useIntegrationEngine } from '../../contexts/IntegrationEngineContext';

interface Opportunity {
  id: string;
  title: string;
  value: string;
  protocol: string;
  actionText: string;
  route: string;
  icon: React.ReactNode;
  color: string;
  isStale?: boolean;
}

export default function OpportunityEngine() {
  const navigate = useNavigate();
  const engine = useIntegrationEngine();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchOpportunities = async () => {
      // Começamos com fallbacks estáticos (cache simulado / fallback)
      const fallbackOpps: Opportunity[] = [
        {
          id: 'yield-fallback',
          title: 'Melhor rendimento hoje',
          value: '11.82%',
          protocol: 'Defindex',
          actionText: 'Depositar',
          route: '/yield',
          icon: <Flame size={18} color="var(--color-yield)" />,
          color: 'var(--color-yield)',
          isStale: true
        },
        {
          id: 'rwa-fallback',
          title: 'Tesouro IPCA+',
          value: '13.14%',
          protocol: 'Etherfuse',
          actionText: 'Comprar',
          route: '/rwa',
          icon: <Landmark size={18} color="var(--color-rwa)" />,
          color: 'var(--color-rwa)',
          isStale: true
        },
        {
          id: 'swap-fallback',
          title: 'Melhor rota',
          value: 'BTC → USDC',
          protocol: 'Soroswap',
          actionText: 'Trocar',
          route: '/swap',
          icon: <ArrowLeftRight size={18} color="var(--color-swap)" />,
          color: 'var(--color-swap)',
          isStale: true
        }
      ];

      // Exibe fallback instantaneamente para nunca mostrar tela vazia
      if (mounted) setOpportunities(fallbackOpps);

      try {
        // Tenta buscar dados reais dos plugins via capabilities
        const realOpps: Opportunity[] = [];
        
        // 1. Yield
        const yieldCap = engine?.getCapability<any>('yield-vaults');
        if (yieldCap && yieldCap.provider) {
          try {
            const vaults = await yieldCap.provider.getVaults();
            if (vaults && vaults.length > 0) {
              // Pega o melhor APY (mocking logic para demo de Hackathon)
              const bestVault = vaults[0]; 
              realOpps.push({
                id: 'yield-real',
                title: 'Melhor rendimento hoje',
                value: `${bestVault.apy}%`,
                protocol: yieldCap.manifest.name,
                actionText: 'Depositar',
                route: '/yield',
                icon: <Flame size={18} color="var(--color-yield)" />,
                color: 'var(--color-yield)',
                isStale: false
              });
            }
          } catch (e) {
            console.warn("Failed to fetch real yield opp", e);
          }
        }

        // 2. RWA
        const rwaCap = engine?.getCapability<any>('rwa');
        if (rwaCap && rwaCap.provider) {
          try {
            const assets = await rwaCap.provider.getAvailableAssets();
            if (assets && assets.length > 0) {
              const bestAsset = assets.find((a: any) => a.id === 'TESOURO') || assets[0];
              realOpps.push({
                id: 'rwa-real',
                title: bestAsset.name || 'Ativo RWA',
                value: `${bestAsset.apy || '13.1'}%`,
                protocol: rwaCap.manifest.name,
                actionText: 'Comprar',
                route: '/rwa',
                icon: <Landmark size={18} color="var(--color-rwa)" />,
                color: 'var(--color-rwa)',
                isStale: false
              });
            }
          } catch (e) {
            console.warn("Failed to fetch real RWA opp", e);
          }
        }

        // 3. Swap (como não temos getRates estático fácil, manteremos o fallback visual ou usaremos dummy logic para simular a IA)
        const swapCap = engine?.getCapability<any>('swap');
        if (swapCap) {
          realOpps.push({
            id: 'swap-real',
            title: 'Melhor rota em alta',
            value: 'XLM → USDC',
            protocol: swapCap.manifest.name,
            actionText: 'Trocar',
            route: '/swap',
            icon: <ArrowLeftRight size={18} color="var(--color-swap)" />,
            color: 'var(--color-swap)',
            isStale: false
          });
        }

        // Merge real opps with fallbacks where real data is missing
        if (mounted && realOpps.length > 0) {
          const merged = fallbackOpps.map(fb => {
            const type = fb.id.split('-')[0];
            const real = realOpps.find(ro => ro.id.startsWith(type));
            return real || fb;
          });
          setOpportunities(merged);
        }
      } catch (e) {
        console.error("Opportunity Engine Error:", e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchOpportunities();

    return () => {
      mounted = false;
    };
  }, [engine]);

  return (
    <div className="animate-fade-in-up delay-300" style={{ marginBottom: 'var(--space-8)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h2 className="section-title">Oportunidades</h2>
        {opportunities.some(o => o.isStale) && (
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 999 }}>
            Estimativas
          </span>
        )}
      </div>

      <div className="cards-grid-3">
        {opportunities.map((opp, idx) => (
          <div
            key={opp.id}
            className={`glass-card glass-card-hover animate-slide-up delay-${(idx + 1) * 100}`}
            style={{
              padding: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => navigate(opp.route)}
          >
            {/* Background Hint */}
            <div style={{
              position: 'absolute',
              top: 0, right: 0,
              width: 100, height: 100,
              background: `radial-gradient(circle at top right, ${opp.color}15 0%, transparent 70%)`,
              pointerEvents: 'none'
            }} />

            {/* Header: Title & Icon */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {opp.icon}
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {opp.title}
                </span>
              </div>
            </div>

            {/* Main Value */}
            <div style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)'
            }}>
              {opp.value}
            </div>

            {/* Footer: Protocol Source & Action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                via {opp.protocol}
              </span>

              <button
                className="btn btn-ghost btn-sm"
                style={{ color: opp.color, padding: '4px 8px', gap: 4, background: `${opp.color}10` }}
                onClick={(e) => { e.stopPropagation(); navigate(opp.route); }}
              >
                {opp.actionText}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
