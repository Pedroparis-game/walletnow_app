/**
 * WalletNow Developer Portal — Hero Page
 *
 * Primeira impressão: venda, não documentação.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, LayoutDashboard, ArrowRight, Terminal, Zap, Shield, Package } from 'lucide-react';
import { useDocsI18n } from '../../../contexts/DocsI18nContext';

// ─── Terminal animado ─────────────────────────────────────────────────────────

function AnimatedInstall({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [text]);

  useEffect(() => {
    const blink = setInterval(() => setCursor((c) => !c), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <span>
      <span style={{ color: '#6ee7b7' }}>$ </span>
      <span style={{ color: '#e2e8f0' }}>{displayed}</span>
      <span style={{ opacity: cursor ? 1 : 0, color: 'var(--accent)' }}>▌</span>
    </span>
  );
}

// ─── Quick nav cards ──────────────────────────────────────────────────────────

const QUICK_NAV = [
  { path: '/docs/why', icon: <Zap size={18} />, title: 'Why WalletNow', desc: 'The problem we solve' },
  { path: '/docs/playground', icon: <FlaskConical size={18} />, title: 'Live Playground', desc: 'Run the SDK in your browser', badge: 'Try it now' },
  { path: '/docs/quick-start', icon: <ArrowRight size={18} />, title: 'Quick Start', desc: '5 minutes to first user' },
  { path: '/docs/sdk', icon: <Package size={18} />, title: 'SDK Reference', desc: 'Full TypeScript API' },
  { path: '/docs/architecture', icon: <Shield size={18} />, title: 'Architecture', desc: 'How WalletNow is built' },
  { path: '/docs/examples', icon: <Terminal size={18} />, title: 'Examples', desc: 'By framework' },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function DocsHero() {
  const { t } = useDocsI18n();
  const navigate = useNavigate();

  return (
    <div className="hero-root">
      {/* Badge */}
      <div className="hero-badge">
        <span className="hero-badge-dot" />
        {t.hero.badge}
      </div>

      {/* Headline */}
      <h1 className="hero-headline">
        {t.hero.tagline}
      </h1>
      <p className="hero-sub">{t.hero.subtitle}</p>

      {/* CTAs */}
      <div className="hero-ctas">
        <button
          className="hero-cta-primary"
          onClick={() => navigate('/docs/quick-start')}
        >
          {t.hero.ctaStart}
          <ArrowRight size={16} />
        </button>
        <button
          className="hero-cta-secondary"
          onClick={() => navigate('/docs/playground')}
        >
          <FlaskConical size={15} />
          {t.hero.ctaPlayground}
        </button>
        <button
          className="hero-cta-ghost"
          onClick={() => navigate('/docs/dashboard')}
        >
          <LayoutDashboard size={15} />
          {t.hero.ctaDashboard}
        </button>
      </div>

      {/* Install terminal */}
      <div className="hero-terminal">
        <div className="hero-terminal-bar">
          <span className="hero-dot" style={{ background: '#f43f5e' }} />
          <span className="hero-dot" style={{ background: '#f59e0b' }} />
          <span className="hero-dot" style={{ background: '#10b981' }} />
        </div>
        <div className="hero-terminal-body">
          <AnimatedInstall text={t.hero.install} />
        </div>
      </div>

      {/* Divider */}
      <div className="hero-divider" />

      {/* Quick nav */}
      <p className="hero-nav-title">{t.hero.quickNavTitle}</p>
      <div className="hero-nav-grid">
        {QUICK_NAV.map((item) => (
          <button
            key={item.path}
            className={`hero-nav-card${item.badge ? ' hero-nav-card--featured' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="hero-nav-icon">{item.icon}</span>
            <div className="hero-nav-text">
              <span className="hero-nav-title-text">
                {item.title}
                {item.badge && <span className="hero-nav-badge">{item.badge}</span>}
              </span>
              <span className="hero-nav-desc">{item.desc}</span>
            </div>
            <ArrowRight size={14} className="hero-nav-arrow" />
          </button>
        ))}
      </div>

      {/* Tagline footer */}
      <div className="hero-footer-quote">
        <p>Built by builders, for builders.<br/>
        <span style={{ color: 'var(--accent)' }}>@walletnow/sdk</span> — the abstraction layer for Stellar.</p>
      </div>

      <style>{`
        .hero-root {
          padding-top: 8px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 600;
          color: var(--accent);
          border: 1px solid rgba(0,255,153,0.25);
          background: rgba(0,255,153,0.06);
          border-radius: 100px;
          padding: 4px 12px;
          margin-bottom: 24px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.03em;
        }
        .hero-badge-dot {
          width: 6px;
          height: 6px;
          background: var(--accent);
          border-radius: 50%;
          animation: hero-pulse 2s infinite;
          flex-shrink: 0;
        }
        @keyframes hero-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .hero-headline {
          font-size: clamp(32px, 5vw, 52px) !important;
          font-weight: 900 !important;
          letter-spacing: -0.03em !important;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 16px !important;
          line-height: 1.1 !important;
        }

        .hero-sub {
          font-size: 18px !important;
          color: var(--text-secondary) !important;
          margin: 0 0 36px !important;
          max-width: 480px;
        }

        .hero-ctas {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 40px;
        }
        .hero-cta-primary {
          display: flex;
          align-items: center;
          gap: 7px;
          background: var(--accent);
          color: #000;
          border: none;
          border-radius: var(--radius-lg);
          padding: 12px 22px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .hero-cta-primary:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,255,153,0.25);
        }
        .hero-cta-secondary {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.06);
          color: var(--text-primary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 12px 22px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .hero-cta-secondary:hover {
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.09);
        }
        .hero-cta-ghost {
          display: flex;
          align-items: center;
          gap: 7px;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid transparent;
          border-radius: var(--radius-lg);
          padding: 12px 22px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .hero-cta-ghost:hover {
          color: var(--text-primary);
          border-color: var(--border-subtle);
        }

        .hero-terminal {
          max-width: 440px;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--docs-code-bg, #0d0d0f);
          margin-bottom: 48px;
        }
        .hero-terminal-bar {
          display: flex;
          gap: 6px;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.02);
        }
        .hero-dot { width: 10px; height: 10px; border-radius: 50%; }
        .hero-terminal-body {
          padding: 14px 18px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          min-height: 44px;
        }

        .hero-divider {
          height: 1px;
          background: var(--border-subtle);
          margin: 0 0 32px;
        }

        .hero-nav-title {
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: var(--text-disabled) !important;
          margin: 0 0 16px !important;
        }

        .hero-nav-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 10px;
          margin-bottom: 56px;
        }

        .hero-nav-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .hero-nav-card:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.04);
          transform: translateY(-1px);
        }
        .hero-nav-card--featured {
          border-color: rgba(0,255,153,0.2);
          background: rgba(0,255,153,0.04);
        }
        .hero-nav-card--featured:hover {
          border-color: rgba(0,255,153,0.35);
        }

        .hero-nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: rgba(255,255,255,0.05);
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .hero-nav-card--featured .hero-nav-icon {
          background: rgba(0,255,153,0.1);
          color: var(--accent);
        }

        .hero-nav-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .hero-nav-title-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .hero-nav-badge {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 100px;
          background: rgba(0,255,153,0.15);
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .hero-nav-desc {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .hero-nav-arrow {
          color: var(--text-disabled);
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .hero-nav-card:hover .hero-nav-arrow {
          color: var(--text-secondary);
          transform: translateX(2px);
        }

        .hero-footer-quote {
          padding: 24px;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          background: rgba(255,255,255,0.015);
        }
        .hero-footer-quote p {
          font-size: 14px !important;
          color: var(--text-secondary) !important;
          margin: 0 !important;
          line-height: 1.7 !important;
        }
      `}</style>
    </div>
  );
}
