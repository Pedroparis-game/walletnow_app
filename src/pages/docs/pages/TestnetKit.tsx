/**
 * WalletNow Developer Portal — Testnet Kit
 */

import React from 'react';
import { useDocsI18n } from '../../../contexts/DocsI18nContext';
import CodeBlock from '../../../components/docs/CodeBlock';

const TESTNET_STEPS = [
  {
    step: 1,
    title: 'Initialize in Testnet mode',
    code: `const wn = await WalletNow.init({
  apiKey: 'wn_test_your_key',
  network: 'testnet', // explicit testnet
});`,
  },
  {
    step: 2,
    title: 'Create a test wallet',
    code: `const user = await wn.onboarding.createUser({
  externalId: 'test-alice-001',
  sponsored: true, // Friendbot++ activates the account
});
// user.stellarAddress → GABC... (on testnet)`,
  },
  {
    step: 3,
    title: 'Verify on Stellar Expert',
    code: `// Open in browser:
// https://stellar.expert/explorer/testnet/account/{user.stellarAddress}`,
    lang: 'text' as const,
  },
];

export default function TestnetKit() {
  const { t } = useDocsI18n();
  const tk = t.testnet;

  return (
    <div>
      <h1>{tk.title}</h1>
      <p className="doc-subtitle">{tk.subtitle}</p>

      {/* Friendbot++ explanation */}
      <div className="tk-info-card doc-info-card">
        <strong>What is Friendbot++?</strong>
        <p>The standard Stellar Friendbot funds accounts with 10,000 XLM. WalletNow's Friendbot++ goes further: it activates the account, configures testnet trustlines (USDW, BRW), and seeds initial test token balances — all in one step.</p>
      </div>

      <h2>Getting Started</h2>
      {TESTNET_STEPS.map((s) => (
        <div key={s.step} className="tk-step">
          <div className="tk-step-header">
            <div className="tk-step-num">{s.step}</div>
            <span className="tk-step-title">{s.title}</span>
          </div>
          <CodeBlock code={s.code} lang={s.lang ?? 'typescript'} filename="testnet.ts" />
        </div>
      ))}

      <h2>Test Assets Available</h2>
      <div className="tk-assets">
        {[
          { code: 'USDW', name: 'WalletNow USD', desc: 'Testnet USD stablecoin', color: '#10b981' },
          { code: 'BRW', name: 'WalletNow BRL', desc: 'Testnet BRL stablecoin', color: '#3b82f6' },
          { code: 'XLM', name: 'Stellar Lumens', desc: 'Native Stellar asset', color: '#a855f7' },
        ].map((asset) => (
          <div key={asset.code} className="tk-asset">
            <div className="tk-asset-code" style={{ color: asset.color, background: `${asset.color}15`, borderColor: `${asset.color}30` }}>
              {asset.code}
            </div>
            <div>
              <span className="tk-asset-name">{asset.name}</span>
              <span className="tk-asset-desc">{asset.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <h2>Useful Links</h2>
      <div className="tk-links">
        <a href="https://stellar.expert/explorer/testnet" target="_blank" rel="noopener noreferrer" className="tk-link">
          Stellar Expert (Testnet) →
        </a>
        <a href="https://laboratory.stellar.org" target="_blank" rel="noopener noreferrer" className="tk-link">
          Stellar Laboratory →
        </a>
        <a href="https://friendbot.stellar.org" target="_blank" rel="noopener noreferrer" className="tk-link">
          Standard Friendbot →
        </a>
      </div>

      <style>{`
        .tk-step { margin-bottom: 28px; }
        .tk-step-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .tk-step-num {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(0,255,153,0.15);
          color: var(--accent);
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-family: 'Inter', sans-serif;
          border: 1px solid rgba(0,255,153,0.25);
        }
        .tk-step-title { font-size: 15px; font-weight: 600; color: var(--text-primary); font-family: 'Inter', sans-serif; }

        .tk-assets { display: flex; flex-direction: column; gap: 10px; margin-bottom: 40px; }
        .tk-asset {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 16px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }
        .tk-asset-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid;
          flex-shrink: 0;
          min-width: 60px;
          text-align: center;
        }
        .tk-asset-name { display: block; font-size: 14px; font-weight: 600; color: var(--text-primary); font-family: 'Inter', sans-serif; }
        .tk-asset-desc { display: block; font-size: 12px; color: var(--text-tertiary); font-family: 'Inter', sans-serif; }

        .tk-links { display: flex; flex-direction: column; gap: 8px; }
        .tk-link {
          color: var(--accent);
          font-size: 14px;
          text-decoration: none;
          font-family: 'Inter', sans-serif;
        }
        .tk-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
