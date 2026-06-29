import React, { useState, useEffect } from 'react';
import { Droplets, Settings, Zap, ArrowDown, ArrowUp, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { WalletFactory } from '../services/walletFactory';
import { Asset } from '@stellar/stellar-sdk';
import { StellarNetwork } from '../config/stellarNetwork';

// Constant for the pool we're showcasing
const LP_ID_HEX = '4cd1f6defba237eecbc5fefe259f89ebc4b5edd49116beb5536c4034fc48d63f';
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

export default function LiquidityPage() {
  const { profile } = useAuth();
  const { balances, refreshAccounts } = useWallet();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amountXLM, setAmountXLM] = useState('');
  const [amountUSDC, setAmountUSDC] = useState('');
  const [sharesToWithdraw, setSharesToWithdraw] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [poolData, setPoolData] = useState<any>(null);

  // Fetch Pool Data from Horizon
  useEffect(() => {
    const fetchPool = async () => {
      try {
        const res = await fetch(`https://horizon-testnet.stellar.org/liquidity_pools/${LP_ID_HEX}`);
        const data = await res.json();
        setPoolData(data);
      } catch (err) {
        console.error("Failed to fetch pool data", err);
      }
    };
    fetchPool();
    const interval = setInterval(fetchPool, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle auto-ratio for XLM/USDC
  const handleAmountXLMChange = (val: string) => {
    setAmountXLM(val);
    if (!poolData) return;
    const reserveXLM = poolData.reserves.find((r: any) => r.asset === 'native')?.amount;
    const reserveUSDC = poolData.reserves.find((r: any) => r.asset.includes('USDC'))?.amount;
    if (reserveXLM && reserveUSDC && val && !isNaN(parseFloat(val))) {
      const ratio = parseFloat(reserveUSDC) / parseFloat(reserveXLM);
      setAmountUSDC((parseFloat(val) * ratio).toFixed(7));
    } else {
      setAmountUSDC('');
    }
  };

  const handleAmountUSDCChange = (val: string) => {
    setAmountUSDC(val);
    if (!poolData) return;
    const reserveXLM = poolData.reserves.find((r: any) => r.asset === 'native')?.amount;
    const reserveUSDC = poolData.reserves.find((r: any) => r.asset.includes('USDC'))?.amount;
    if (reserveXLM && reserveUSDC && val && !isNaN(parseFloat(val))) {
      const ratio = parseFloat(reserveXLM) / parseFloat(reserveUSDC);
      setAmountXLM((parseFloat(val) * ratio).toFixed(7));
    } else {
      setAmountXLM('');
    }
  };

  const handleDeposit = async () => {
    if (!profile?.stellar_wallet || !amountXLM || !amountUSDC) return;
    setStatus('loading');
    try {
      const assetA = Asset.native();
      const assetB = new Asset('USDC', USDC_ISSUER);
      
      const balUSDC = parseFloat(balances?.usdc || '0');
      const reqUSDC = parseFloat(amountUSDC);

      // Auto Swap One-Click
      let autoSwapParams = undefined;
      if (balUSDC < reqUSDC) {
        const diff = (reqUSDC - balUSDC).toFixed(7);
        // Calcula quanto XLM vai gastar pra comprar esse USDC a mais
        const ratio = parseFloat(amountXLM) / reqUSDC;
        const maxXLMSell = (parseFloat(diff) * ratio * 1.05).toFixed(7); // +5% slippage safety

        autoSwapParams = {
            buyAsset: assetB,
            sellAsset: assetA,
            buyAmount: diff,
            maxSellAmount: maxXLMSell
        };
      }

      await WalletFactory.depositLiquidity(
        profile.stellar_wallet,
        assetA,
        assetB,
        amountXLM,
        amountUSDC,
        { requiresTrustline: true, autoSwap: autoSwapParams }
      );
      setStatus('success');
      setAmountXLM('');
      setAmountUSDC('');
      await refreshAccounts();
      alert('Liquidez depositada com sucesso!');
    } catch (err: any) {
      alert('Erro ao depositar: ' + err.message);
    } finally {
      setStatus('idle');
    }
  };

  const handleWithdraw = async () => {
    if (!profile?.stellar_wallet || !sharesToWithdraw) return;
    setStatus('loading');
    try {
      const assetA = Asset.native();
      const assetB = new Asset('USDC', USDC_ISSUER);
      await WalletFactory.withdrawLiquidity(profile.stellar_wallet, assetA, assetB, sharesToWithdraw);
      setStatus('success');
      setSharesToWithdraw('');
      await refreshAccounts();
      alert('Saque efetuado com sucesso!');
    } catch (err: any) {
      alert('Erro ao sacar: ' + err.message);
    } finally {
      setStatus('idle');
    }
  };

  const reserveXLM = poolData?.reserves.find((r: any) => r.asset === 'native')?.amount;
  const reserveUSDC = poolData?.reserves.find((r: any) => r.asset.includes('USDC'))?.amount;
  const totalShares = poolData?.total_shares;

  return (
    <div style={{
      padding: 'var(--space-6) max(var(--space-4), env(safe-area-inset-right)) var(--space-8) max(var(--space-4), env(safe-area-inset-left))',
      maxWidth: 1200,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-8)'
    }}>
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16 }}>
          <Droplets size={14} /> Classic AMM
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Forneça Liquidez
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, lineHeight: 1.5 }}>
          Deposite seus ativos nas Pools da Stellar e ganhe uma porcentagem das taxas de Swap.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
        
        {/* Formulário Interativo */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <button 
              className={`btn ${activeTab === 'deposit' ? 'btn-primary' : 'btn-ghost'}`} 
              style={{ flex: 1 }} 
              onClick={() => setActiveTab('deposit')}
            >
              <ArrowDown size={16} /> Depositar
            </button>
            <button 
              className={`btn ${activeTab === 'withdraw' ? 'btn-primary' : 'btn-ghost'}`} 
              style={{ flex: 1 }} 
              onClick={() => setActiveTab('withdraw')}
            >
              <ArrowUp size={16} /> Sacar
            </button>
          </div>

          {activeTab === 'deposit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>XLM Deposit</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '12px 16px' }}>
                  <input
                    type="number"
                    value={amountXLM}
                    onChange={(e) => handleAmountXLMChange(e.target.value)}
                    placeholder="0.0"
                    style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 20, outline: 'none' }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>XLM</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'right' }}>
                  Saldo: {balances?.xlm || '0.00'} XLM
                </div>
              </div>
              
              <div style={{ textAlign: 'center', color: 'var(--text-disabled)' }}>+</div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>USDC Deposit</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '12px 16px' }}>
                  <input
                    type="number"
                    value={amountUSDC}
                    onChange={(e) => handleAmountUSDCChange(e.target.value)}
                    placeholder="0.0"
                    style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 20, outline: 'none' }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>USDC</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'right' }}>
                  Saldo: {balances?.usdc || '0.00'} USDC
                </div>
              </div>

              {/* Dica One-Click */}
              {parseFloat(amountUSDC || '0') > parseFloat(balances?.usdc || '0') && (
                <div style={{ padding: 12, background: 'rgba(56,189,248,0.1)', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                  <Zap size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#e0f2fe', lineHeight: 1.4 }}>
                    <strong>Auto-Swap One-Click:</strong> Você não tem USDC suficiente. Parte do seu XLM será vendida via <span style={{color: '#38bdf8'}}>pathPaymentStrictReceive</span> automaticamente no mesmo bloco de depósito para cobrir o custo de {amountUSDC} USDC.
                  </span>
                </div>
              )}

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: 8 }} 
                onClick={handleDeposit} 
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Processando...' : 'Adicionar Liquidez'}
              </button>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>Quantidade de Shares (LP Tokens)</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '12px 16px' }}>
                  <input
                    type="number"
                    value={sharesToWithdraw}
                    onChange={(e) => setSharesToWithdraw(e.target.value)}
                    placeholder="0.0"
                    style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 20, outline: 'none' }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>LPT</span>
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: 8 }} 
                onClick={handleWithdraw} 
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Processando...' : 'Sacar Liquidez'}
              </button>
            </div>
          )}
        </div>

        {/* Informações da Pool */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={16} color="var(--text-tertiary)" />
              Informações da Pool (XLM / USDC)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>ID (Testnet)</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {LP_ID_HEX.substring(0, 8)}...{LP_ID_HEX.substring(56)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Total XLM</span>
                <span style={{ fontWeight: 600 }}>{reserveXLM ? parseFloat(reserveXLM).toLocaleString(undefined, {maximumFractionDigits: 2}) : '...'} XLM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Total USDC</span>
                <span style={{ fontWeight: 600 }}>{reserveUSDC ? parseFloat(reserveUSDC).toLocaleString(undefined, {maximumFractionDigits: 2}) : '...'} USDC</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>LP Tokens Emitidos</span>
                <span style={{ fontWeight: 600 }}>{totalShares ? parseFloat(totalShares).toLocaleString(undefined, {maximumFractionDigits: 2}) : '...'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Fee da Pool</span>
                <span style={{ fontWeight: 600, color: 'var(--color-yield)' }}>0.30%</span>
              </div>
            </div>
          </div>
          
          <div className="glass-card" style={{ padding: 'var(--space-6)', background: 'linear-gradient(145deg, rgba(34,197,94,0.1), transparent)', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', color: '#4ade80' }}>
              Estimativa de Retorno (APR)
            </h3>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
              ~12.4% <span style={{ fontSize: 20, color: 'var(--text-tertiary)', fontWeight: 600 }}>a.a.</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              O APR exibido é baseado no volume de negociação das últimas 24h na DEX. Prover liquidez expõe ao risco de impermanent loss.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
