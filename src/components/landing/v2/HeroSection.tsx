import React, { useEffect, useState } from 'react';
import { ArrowRight, Github, Copy, Check } from 'lucide-react';
import { useLanding } from '../../../contexts/LandingContext';

const CODE_LINES = [
  { tokens: [
    { text: 'import', color: '#C792EA' },
    { text: ' { WalletNow } ', color: '#89DDFF' },
    { text: 'from', color: '#C792EA' },
    { text: " '@walletnow/core'", color: '#C3E88D' },
  ]},
  { tokens: [{ text: '', color: '' }] },
  { tokens: [
    { text: '// Provision a Passkey wallet in seconds', color: '#546E7A' },
  ]},
  { tokens: [
    { text: 'const ', color: '#C792EA' },
    { text: 'wallet', color: '#89DDFF' },
    { text: ' = ', color: '#89DDFF' },
    { text: 'await ', color: '#C792EA' },
    { text: 'WalletNow', color: '#FFCB6B' },
    { text: '.create()', color: '#82AAFF' },
  ]},
  { tokens: [{ text: '', color: '' }] },
  { tokens: [
    { text: 'await ', color: '#C792EA' },
    { text: 'wallet', color: '#89DDFF' },
    { text: '.send({', color: '#89DDFF' },
  ]},
  { tokens: [
    { text: '  to', color: '#F07178' },
    { text: ': destination,', color: '#89DDFF' },
  ]},
  { tokens: [
    { text: '  amount', color: '#F07178' },
    { text: ': ', color: '#89DDFF' },
    { text: "'100'", color: '#C3E88D' },
  ]},
  { tokens: [
    { text: '})', color: '#89DDFF' },
  ]},
];

function AnimatedCode() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visibleLines >= CODE_LINES.length) return;
    const timer = setTimeout(() => setVisibleLines(v => v + 1), visibleLines === 0 ? 500 : 180);
    return () => clearTimeout(timer);
  }, [visibleLines]);

  const handleCopy = () => {
    const code = `import { WalletNow } from '@walletnow/core'\n\nconst wallet = await WalletNow.create()\n\nawait wallet.send({\n  to: destination,\n  amount: '100'\n})`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'relative',
      background: '#0D1117',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 32px 80px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
    }}>
      {/* Window chrome */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#FF5F57', '#FFBD2E', '#28C840'].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <span style={{ fontSize: 11, color: '#546E7A', fontFamily: 'monospace' }}>app.ts</span>
        <button onClick={handleCopy} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
          color: copied ? '#00FF99' : '#546E7A', fontSize: 11, fontFamily: 'monospace',
          transition: 'all 0.2s',
        }}>
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'copied!' : 'copy'}
        </button>
      </div>

      {/* Code body */}
      <div style={{ padding: '20px 24px', minHeight: 200 }}>
        {CODE_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} style={{
            display: 'flex', flexWrap: 'wrap',
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontSize: 13, lineHeight: '26px',
            opacity: 1, animation: 'codeFadeIn 0.25s ease forwards',
          }}>
            {line.tokens.map((token, j) => (
              <span key={j} style={{ color: token.color || 'transparent' }}>
                {token.text}
              </span>
            ))}
          </div>
        ))}
        {visibleLines < CODE_LINES.length && (
          <span style={{
            display: 'inline-block', width: 2, height: 16, background: '#00FF99',
            animation: 'cursorBlink 0.7s ease infinite', verticalAlign: 'middle',
          }} />
        )}
      </div>

      <div style={{
        position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)',
        width: 200, height: 80, background: 'rgba(0,255,153,0.06)',
        borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none',
      }} />
    </div>
  );
}

export default function HeroSection() {
  const { t } = useLanding();
  const h = t.hero;

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px 60px',
      position: 'relative', overflow: 'hidden',
    }}>

      <style>{`
        @keyframes codeFadeIn {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-cta-primary:hover {
          background: rgba(0,168,107,0.15) !important;
          border-color: rgba(0,168,107,0.5) !important;
          transform: translateY(-1px);
        }
        .hero-cta-secondary:hover {
          background: rgba(0,0,0,0.04) !important;
          transform: translateY(-1px);
        }
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .hero-text-col { text-align: center !important; align-items: center !important; }
          .hero-ctas { justify-content: center !important; }
        }
      `}</style>

      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '10%', width: 400, height: 400,
        background: 'radial-gradient(circle, var(--glow-primary) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
        animation: 'float-orb 12s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '8%', width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(130,170,255,0.04) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
        animation: 'float-orb 16s ease-in-out infinite reverse',
      }} />

      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '5px 14px', borderRadius: 999,
        background: 'rgba(0,168,107,0.07)',
        border: '1px solid rgba(0,168,107,0.2)',
        marginBottom: 28,
        animation: 'heroFadeUp 0.6s ease forwards',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-wn-green)', boxShadow: '0 0 6px var(--color-wn-green)' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-wn-green)', letterSpacing: '0.04em' }}>
          {h.badge}
        </span>
      </div>

      {/* Main grid */}
      <div className="hero-grid" style={{
        display: 'flex', alignItems: 'center', gap: 56,
        maxWidth: 1080, width: '100%',
      }}>
        {/* Left: Text */}
        <div className="hero-text-col" style={{
          flex: '1 1 0', display: 'flex', flexDirection: 'column',
          alignItems: 'flex-start', gap: 20,
          animation: 'heroFadeUp 0.7s ease 0.1s both',
        }}>
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 60px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            {h.headlinePlain1}{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--color-wn-green) 0%, #00C46A 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {h.headlineGreen}
            </span>{' '}
            {h.headlinePlain2}
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7, margin: 0,
            maxWidth: 460,
          }}>
            {h.description}
          </p>

          <div className="hero-ctas" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <a href="/docs" className="hero-cta-primary" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 10,
              background: 'rgba(0,168,107,0.08)',
              border: '1px solid rgba(0,168,107,0.3)',
              color: 'var(--color-wn-green)', fontWeight: 600, fontSize: 14,
              textDecoration: 'none', cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              {h.ctaDocs}
              <ArrowRight size={16} />
            </a>
            <a href="https://github.com/nsdBRoficial/walletnow_app" target="_blank" rel="noopener noreferrer"
              className="hero-cta-secondary" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 10,
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14,
                textDecoration: 'none', cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
              <Github size={15} />
              {h.ctaGitHub}
            </a>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 28, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { label: h.statStellar, value: '100%' },
              { label: h.statOpenSource, value: 'MIT' },
              { label: h.statSetup, value: '< 5min' },
            ].map(stat => (
              <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{stat.value}</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Animated Code */}
        <div style={{
          flex: '1 1 0', minWidth: 0,
          animation: 'heroFadeUp 0.7s ease 0.25s both',
        }}>
          <AnimatedCode />
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        opacity: 0.4,
        animation: 'bounce 2s ease-in-out infinite',
      }}>
        <div style={{ width: 20, height: 32, border: '2px solid var(--text-secondary)', borderRadius: 12, position: 'relative' }}>
          <div style={{
            width: 4, height: 8, background: 'var(--text-secondary)', borderRadius: 999,
            position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
            animation: 'bounce 2s ease-in-out infinite',
          }} />
        </div>
      </div>
    </section>
  );
}
