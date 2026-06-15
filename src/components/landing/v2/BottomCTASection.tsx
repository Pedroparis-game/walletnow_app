import React from 'react';
import { ArrowRight, Github } from 'lucide-react';

export default function BottomCTASection() {
  return (
    <section style={{
      padding: '100px 24px 120px',
      display: 'flex', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        .bottom-cta-primary:hover {
          background: rgba(0,255,153,0.2) !important;
          border-color: rgba(0,255,153,0.6) !important;
          box-shadow: 0 8px 32px -8px rgba(0,255,153,0.25) !important;
          transform: translateY(-2px);
        }
        .bottom-cta-secondary:hover {
          border-color: rgba(255,255,255,0.2) !important;
          background: rgba(255,255,255,0.04) !important;
          transform: translateY(-2px);
        }
      `}</style>

      {/* Glow background */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800, height: 400,
        background: 'radial-gradient(ellipse, rgba(0,255,153,0.05) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 740, width: '100%', textAlign: 'center', position: 'relative' }}>

        {/* Pre-label */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 999,
          background: 'rgba(0,255,153,0.06)',
          border: '1px solid rgba(0,255,153,0.18)',
          marginBottom: 28,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FF99', boxShadow: '0 0 6px #00FF99' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#00FF99', letterSpacing: '0.04em' }}>
            Available now on Stellar Testnet
          </span>
        </div>

        <h2 style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1,
          color: 'var(--text-primary)', marginBottom: 20,
        }}>
          Ready to stop building{' '}
          <span style={{
            background: 'linear-gradient(135deg, #00FF99 0%, #00C46A 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            infrastructure?
          </span>
        </h2>

        <p style={{
          fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7,
          maxWidth: 500, margin: '0 auto 40px',
        }}>
          Start with the docs. Have a wallet running in minutes. 
          No signup required.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/docs" className="bottom-cta-primary" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 28px', borderRadius: 12,
            background: 'rgba(0,255,153,0.1)',
            border: '1px solid rgba(0,255,153,0.35)',
            color: '#00FF99', fontWeight: 700, fontSize: 15,
            textDecoration: 'none', cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            Read the Docs
            <ArrowRight size={16} />
          </a>
          <a href="https://github.com/nsdBRoficial/walletnow_app"
            target="_blank" rel="noopener noreferrer"
            className="bottom-cta-secondary" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 28px', borderRadius: 12,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-secondary)', fontWeight: 700, fontSize: 15,
              textDecoration: 'none', cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
            <Github size={16} />
            View on GitHub
          </a>
        </div>

        {/* Footer nav */}
        <div style={{
          marginTop: 64, paddingTop: 32,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Documentation', href: '/docs' },
            { label: 'GitHub', href: 'https://github.com/nsdBRoficial/walletnow_app' },
            { label: 'Stellar.org', href: 'https://stellar.org' },
            { label: 'Community', href: '#' },
          ].map(link => (
            <a key={link.label} href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              style={{
                fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none',
                fontWeight: 500, transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-secondary)', opacity: 0.5 }}>
          WalletNow — MIT License · Public Goods Infrastructure for Stellar
        </div>
      </div>
    </section>
  );
}
