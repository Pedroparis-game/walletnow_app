import React from 'react';

const ROWS = [
  { feature: 'Focus',            saas: 'Multi-chain / Generic',            wn: 'Stellar-native' },
  { feature: 'Model',            saas: 'SaaS-first (monthly pricing)',      wn: 'Public Goods-first (open source)' },
  { feature: 'Integration',      saas: 'Generic onboarding',               wn: 'Optimized for Stellar (Soroban)' },
  { feature: 'Scope',            saas: 'Wallet creation only',             wn: 'Full onboarding abstraction' },
  { feature: 'Ecosystem',        saas: 'Vendor dependency',                wn: 'Open ecosystem approach' },
  { feature: 'Gas Handling',     saas: 'User-pays or wrapped tokens',      wn: 'Native Fee Bump transactions' },
];

export default function EducationalComparisonSection() {
  return (
    <section style={{
      padding: '100px 24px',
      display: 'flex', justifyContent: 'center',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 900, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#00FF99', display: 'block', marginBottom: 20,
          }}>
            Our Philosophy
          </span>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 42px)',
            fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2,
            color: 'var(--text-primary)', margin: '0 auto 20px',
          }}>
            Built specifically for Stellar.
          </h2>
          <p style={{
            fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7,
            maxWidth: 560, margin: '0 auto',
          }}>
            General-purpose tools exist, but they treat Stellar as an afterthought 
            and lock you into expensive vendor contracts. Our philosophy is different.
          </p>
        </div>

        {/* Table */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 20, overflow: 'hidden',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            background: 'rgba(0,0,0,0.15)',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Feature
            </div>
            <div style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', borderLeft: '1px solid var(--border-subtle)' }}>
              Generic SaaS Tools
            </div>
            <div style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00FF99', borderLeft: '1px solid var(--border-subtle)' }}>
              WalletNow
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => (
            <div key={row.feature} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              borderBottom: i < ROWS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {row.feature}
              </div>
              <div style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', borderLeft: '1px solid var(--border-subtle)' }}>
                {row.saas}
              </div>
              <div style={{ padding: '16px 24px', fontSize: 13, color: '#00FF99', fontWeight: 600, borderLeft: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10 }}>✦</span>
                {row.wn}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
