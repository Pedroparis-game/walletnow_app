import React from 'react';
import { Github } from 'lucide-react';

export default function PublicGoodsSection() {
  return (
    <section style={{
      padding: '100px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        .pg-feature:hover {
          background: rgba(0,255,153,0.04) !important;
          border-color: rgba(0,255,153,0.2) !important;
          transform: translateY(-3px);
        }
        @media(max-width:768px){
          .pg-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Full-width dark panel */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,255,153,0.02) 50%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 700, height: 400,
        background: 'radial-gradient(ellipse, rgba(0,255,153,0.04) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#00FF99', display: 'block', marginBottom: 20,
          }}>
            Public Goods
          </span>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2,
            color: 'var(--text-primary)', margin: '0 auto 20px',
          }}>
            Built for the Ecosystem.{' '}
            <span style={{
              background: 'linear-gradient(135deg, #00FF99 0%, #00C46A 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              100% Open Source.
            </span>
          </h2>
          <p style={{
            fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7,
            maxWidth: 580, margin: '0 auto',
          }}>
            Onboarding should not be a competitive moat hoarded by proprietary SaaS platforms.
            It should be a shared foundation that lifts every builder in the ecosystem.
          </p>
        </div>

        {/* Features grid */}
        <div className="pg-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16, marginBottom: 48,
        }}>
          {[
            {
              icon: '📦',
              title: '@walletnow/core',
              desc: 'Vanilla TypeScript. Zero framework dependencies. Works everywhere — React, Vue, Node, Edge.',
            },
            {
              icon: '⚛️',
              title: '@walletnow/react',
              desc: 'Drop-in hooks and components. <WalletNowConnect /> and useWallet() ready for production.',
            },
            {
              icon: '🏗️',
              title: 'Open Source Templates',
              desc: 'Starter projects for Next.js and Vite with WalletNow pre-configured. Clone and build.',
            },
            {
              icon: '🛍️',
              title: 'Marketplace Demo',
              desc: 'Full e-commerce app on Stellar showing embedded checkout and gasless payments.',
            },
            {
              icon: '🎮',
              title: 'Gaming Demo',
              desc: 'In-game microtransactions and wallet provisioning without any crypto UX.',
            },
            {
              icon: '🏠',
              title: 'RWA Demo',
              desc: 'Real World Asset tokenization using Stellar and WalletNow as the onboarding layer.',
            },
          ].map(item => (
            <div key={item.title} className="pg-feature" style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 16, padding: '24px',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'monospace' }}>
                {item.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>

        {/* GitHub CTA */}
        <div style={{ textAlign: 'center' }}>
          <a href="https://github.com/nsdBRoficial/walletnow_app"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 28px', borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-primary)', fontWeight: 600, fontSize: 14,
              textDecoration: 'none', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <Github size={17} />
            Star on GitHub — MIT Licensed
          </a>
        </div>
      </div>
    </section>
  );
}
