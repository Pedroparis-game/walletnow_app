import React from 'react';

const NODES = [
  { id: 'builders', label: 'Builders', sub: 'integrate WalletNow infrastructure', icon: '👨‍💻', accent: false },
  { id: 'products', label: 'Better Products', sub: 'ship faster with frictionless UX', icon: '🚀', accent: false },
  { id: 'users', label: 'More Stellar Users', sub: 'onboarding without Web3 friction', icon: '🌍', accent: true },
  { id: 'apps', label: 'More Applications', sub: 'ecosystem grows and diversifies', icon: '📱', accent: false },
  { id: 'more-builders', label: 'More Builders', sub: 'attracted by thriving ecosystem', icon: '🏗️', accent: false },
];

export default function EcosystemFlywheelSection() {
  return (
    <section style={{
      padding: '100px 24px',
      display: 'flex', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes spinSlow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes nodeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .flywheel-node {
          animation: nodeFloat 3s ease-in-out infinite;
        }
        .flywheel-node:nth-child(2) { animation-delay: 0.4s; }
        .flywheel-node:nth-child(3) { animation-delay: 0.8s; }
        .flywheel-node:nth-child(4) { animation-delay: 1.2s; }
        .flywheel-node:nth-child(5) { animation-delay: 1.6s; }
      `}</style>

      {/* Background ring glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(0,255,153,0.03) 0%, transparent 60%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 900, width: '100%', textAlign: 'center' }}>

        {/* Header */}
        <div style={{ marginBottom: 64 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#00FF99', display: 'block', marginBottom: 20,
          }}>
            Ecosystem Flywheel
          </span>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 42px)',
            fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2,
            color: 'var(--text-primary)', margin: '0 auto 20px',
          }}>
            We grow when{' '}
            <span style={{
              background: 'linear-gradient(135deg, #00FF99 0%, #00C46A 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Stellar grows.
            </span>
          </h2>
          <p style={{
            fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7,
            maxWidth: 520, margin: '0 auto',
          }}>
            WalletNow is not building a standalone business. We are strengthening 
            the entire Stellar ecosystem through a self-reinforcing growth loop.
          </p>
        </div>

        {/* Flywheel visual — vertical chain on mobile, centered loop on desktop */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
          maxWidth: 480, margin: '0 auto',
        }}>
          {NODES.map((node, i) => (
            <React.Fragment key={node.id}>
              {/* Node card */}
              <div className="flywheel-node" style={{
                animationDelay: `${i * 0.4}s`,
                background: node.accent
                  ? 'linear-gradient(135deg, rgba(0,255,153,0.1) 0%, rgba(0,196,106,0.06) 100%)'
                  : 'var(--bg-surface)',
                border: node.accent
                  ? '1px solid rgba(0,255,153,0.35)'
                  : '1px solid var(--border-subtle)',
                borderRadius: 16, padding: '20px 28px',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                width: '100%',
                boxShadow: node.accent ? '0 0 40px -10px rgba(0,255,153,0.2)' : 'var(--shadow-premium)',
                display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
              }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{node.icon}</span>
                <div>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: node.accent ? '#00FF99' : 'var(--text-primary)',
                    marginBottom: 3,
                  }}>
                    {node.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{node.sub}</div>
                </div>
              </div>

              {/* Arrow connector */}
              {i < NODES.length - 1 && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '6px 0', opacity: 0.5,
                }}>
                  <div style={{ width: 1, height: 12, background: 'rgba(0,255,153,0.4)' }} />
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M6 8 L0 0 L12 0 Z" fill="rgba(0,255,153,0.6)" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}

          {/* Loop indicator */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '6px 0', opacity: 0.5,
          }}>
            <div style={{ width: 1, height: 12, background: 'rgba(0,255,153,0.4)' }} />
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M6 8 L0 0 L12 0 Z" fill="rgba(0,255,153,0.6)" />
            </svg>
          </div>
          <div style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#00FF99', opacity: 0.7,
            padding: '8px 20px', borderRadius: 999,
            background: 'rgba(0,255,153,0.05)', border: '1px solid rgba(0,255,153,0.15)',
          }}>
            ↺ Repeats
          </div>
        </div>
      </div>
    </section>
  );
}
