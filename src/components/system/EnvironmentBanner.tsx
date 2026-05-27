import React from 'react';
import { AppConfig } from '../../config/environment';

export const EnvironmentBanner: React.FC = () => {
  // Não renderizar em produção
  if (AppConfig.isProduction) {
    return null;
  }

  const isHomolog = AppConfig.isHomolog;

  const bannerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999, // Ficar acima de tudo
    padding: '6px 12px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: isHomolog ? '#0ea5e9' : '#f97316', // Azul para homolog, Laranja para testnet
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    letterSpacing: '0.05em',
  };

  return (
    <div style={bannerStyle}>
      {isHomolog ? (
        <span>🔵 HOMOLOG MAINNET — Mainnet staging environment</span>
      ) : (
        <span>🟠 TESTNET ENVIRONMENT — Sandbox assets • Friendbot • Fake funds</span>
      )}
    </div>
  );
};
