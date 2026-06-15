/**
 * WalletNow Landing Page v2
 * 
 * Reposicionamento: WalletNow não é mais uma carteira.
 * É a camada de abstração Web3 para builders da rede Stellar.
 * 
 * "Stop building Web3 infrastructure. Start building products."
 * 
 * Estrutura:
 * 1. Navbar (floating pill)
 * 2. HeroSection
 * 3. WhyWeExistSection
 * 4. PublicGoodsSection
 * 5. AbstractionFeaturesSection
 * 6. EducationalComparisonSection
 * 7. EcosystemFlywheelSection
 * 8. BottomCTASection
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Github } from 'lucide-react';

import HeroSection from '../components/landing/v2/HeroSection';
import WhyWeExistSection from '../components/landing/v2/WhyWeExistSection';
import PublicGoodsSection from '../components/landing/v2/PublicGoodsSection';
import AbstractionFeaturesSection from '../components/landing/v2/AbstractionFeaturesSection';
import EducationalComparisonSection from '../components/landing/v2/EducationalComparisonSection';
import EcosystemFlywheelSection from '../components/landing/v2/EcosystemFlywheelSection';
import BottomCTASection from '../components/landing/v2/BottomCTASection';

const NAV_LINKS = [
  { href: '#why', label: 'Why WalletNow' },
  { href: '#open-source', label: 'Open Source' },
  { href: '#ecosystem', label: 'Ecosystem' },
];

export default function Landing() {
  const navigate = useNavigate();

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className="dark"
      style={{
        minHeight: '100vh',
        background: '#050505',
        color: '#F5F5F5',
        overflowX: 'hidden',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Fira+Code:wght@400;500&display=swap');

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-orb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.04); }
        }

        /* CSS variables para o dark mode forçado nesta página */
        .wn-landing {
          --bg-main: #050505;
          --bg-surface: rgba(255, 255, 255, 0.03);
          --bg-surface-solid: #0A0A0A;
          --text-primary: #F5F5F5;
          --text-secondary: #8B8B8B;
          --border-subtle: rgba(255, 255, 255, 0.08);
          --border-light: rgba(255, 255, 255, 0.03);
          --shadow-premium: 0 12px 40px -8px rgba(0, 0, 0, 0.5);
          --glow-primary: rgba(0, 255, 153, 0.15);
          --color-wn-green: #00FF99;
        }

        .navbar-link {
          font-size: 13px; font-weight: 500;
          color: #8B8B8B; text-decoration: none;
          padding: 6px 12px; border-radius: 8px;
          transition: color 0.2s, background 0.2s;
          white-space: nowrap;
        }
        .navbar-link:hover { color: #F5F5F5; background: rgba(255,255,255,0.05); }

        .nav-links-desktop {
          display: flex;
        }
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-launch-app { display: none !important; }
        }
      `}</style>

      <div className="wn-landing">

        {/* ── Floating Navbar ── */}
        <nav style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, padding: '0 20px', height: 56,
          width: 'calc(100% - 32px)', maxWidth: 1040, borderRadius: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 24px -4px rgba(0,0,0,0.4)',
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              height: 28, width: 28, borderRadius: 8,
              background: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4,
            }}>
              <img
                src={`${import.meta.env.BASE_URL}logo-walletnow.svg`}
                alt="WalletNow Logo"
                style={{ height: '100%', width: 'auto', display: 'block' }}
              />
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: '#F5F5F5' }}>
              WalletNow
            </span>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
              background: 'rgba(0,255,153,0.1)', color: '#00FF99',
              border: '1px solid rgba(0,255,153,0.2)', letterSpacing: '0.06em',
            }}>
              INFRA
            </span>
          </div>

          {/* Nav links — desktop only */}
          <div className="nav-links-desktop" style={{ alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} className="navbar-link"
                onClick={(e) => handleScroll(e, link.href)}>
                {link.label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <a href="https://github.com/nsdBRoficial/walletnow_app"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: '#8B8B8B', fontSize: 12, fontWeight: 600,
                textDecoration: 'none', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = '#F5F5F5';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = '#8B8B8B';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <Github size={13} />
              GitHub
            </a>

            {/* Launch the demo app */}
            <button
              className="nav-launch-app"
              onClick={() => navigate('/login')}
              style={{
                padding: '7px 16px', borderRadius: 999, fontSize: 12,
                fontWeight: 700, cursor: 'pointer', border: 'none',
                background: '#00FF99', color: '#050505',
                boxShadow: '0 4px 16px rgba(0,255,153,0.25)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#00CC7A';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,255,153,0.35)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = '#00FF99';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,255,153,0.25)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              Launch Demo App →
            </button>
          </div>
        </nav>

        {/* ── Page Sections ── */}
        <main style={{ paddingTop: 56 }}>

          {/* 1. Hero */}
          <HeroSection />

          {/* 2. Why We Exist */}
          <div id="why">
            <WhyWeExistSection />
          </div>

          {/* 3. Public Goods */}
          <div id="open-source">
            <PublicGoodsSection />
          </div>

          {/* 4. Abstraction Features */}
          <AbstractionFeaturesSection />

          {/* 5. Educational Comparison */}
          <EducationalComparisonSection />

          {/* 6. Ecosystem Flywheel */}
          <div id="ecosystem">
            <EcosystemFlywheelSection />
          </div>

          {/* 7. Bottom CTA + Footer */}
          <BottomCTASection />
        </main>

      </div>
    </div>
  );
}
