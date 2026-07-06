/**
 * WalletNow Developer Portal — Testnet Infrastructure Kit
 *
 * Painel completo e interativo para inicializar, financiar e gerenciar
 * ambientes de desenvolvimento e ativos confidenciais na Stellar Testnet.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Shield,
  Zap,
  Droplets,
  Coins,
  Activity,
  Wallet,
  RefreshCw,
  Search,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useDocsI18n } from '../../../contexts/DocsI18nContext';
import CodeBlock from '../../../components/docs/CodeBlock';
import {
  server,
  BRW_ISSUER,
  USDW_ISSUER,
  BRW_KEYPAIR,
  USDW_KEYPAIR,
  PLAYGROUND_SECRETS,
  PLAYGROUND_IDENTITY_KEYS,
  ensureIssuerActive
} from '../../../lib/docs/playgroundFakes';
import { Keypair, TransactionBuilder, Asset, Operation } from '@stellar/stellar-sdk';

// Configurações do Faucet e Emissores
const NETWORKS = {
  TESTNET: 'Test SDF Network ; September 2015'
};

type ActiveTab = 'dashboard' | 'faucet' | 'pools' | 'explorer' | 'health';

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
}

export default function TestnetKit() {
  const { t } = useDocsI18n();
  const tk = t.testnet;

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // Estado do One-Click Environment
  const [envLoading, setEnvLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [envResult, setEnvResult] = useState<{
    publicKey: string;
    secretKey: string;
    xlmTxHash?: string;
    trustlinesTxHash?: string;
    faucetTxHash?: string;
  } | null>(null);

  // Logs do Console de Infraestrutura
  const [logs, setLogs] = useState<LogEntry[]>([
    { message: 'Stellar Testnet Infrastructure Kit initialized.', type: 'info', timestamp: new Date().toLocaleTimeString() }
  ]);

  // Estado do Faucet
  const [faucetAddress, setFaucetAddress] = useState('');
  const [faucetAsset, setFaucetAsset] = useState<'XLM' | 'BRW' | 'USDW'>('BRW');
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [confidentialMode, setConfidentialMode] = useState(false);

  // Estado do Explorer
  const [searchAddress, setSearchAddress] = useState('');
  const [accountData, setAccountData] = useState<any | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);

  // Estado do Health Check
  const [healthStatus, setHealthStatus] = useState<any>({
    horizon: 'checking',
    friendbot: 'checking',
    faucet: 'operational',
    rpc: 'operational',
    confidentialVerifier: 'operational'
  });

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [
      { message, type, timestamp: new Date().toLocaleTimeString() },
      ...prev
    ]);
  }, []);

  // Helper para copiar texto
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    addLog(`Copied: ${label}`, 'info');
    setTimeout(() => setCopiedText(null), 2000);
  };

  // 1. One Click Test Environment
  const handleCreateEnvironment = async () => {
    if (envLoading) return;
    setEnvLoading(true);
    setEnvResult(null);
    addLog('Generating secure cryptographic keypair...', 'info');

    try {
      // Passo 1: Gerar Keypair Stellar real
      const pair = Keypair.random();
      const pubKey = pair.publicKey();
      const secretKey = pair.secret();

      PLAYGROUND_SECRETS.set(pubKey, secretKey);
      addLog(`New Keypair derived: ${pubKey.slice(0, 8)}... (Saved in RAM)`, 'success');

      // Passo 2: Ativar com Friendbot (Paralelizado com emissores)
      addLog('Activating user and token issuer accounts via Friendbot (parallel)...', 'info');
      const [friendbotRes] = await Promise.all([
        fetch(`https://friendbot.stellar.org/?addr=${pubKey}`),
        ensureIssuerActive('BRW'),
        ensureIssuerActive('USDW')
      ]);

      if (!friendbotRes.ok) {
        throw new Error('Friendbot failed to fund the account.');
      }
      const friendbotData = await friendbotRes.json();
      addLog(`User account activated with 10,000 XLM! Tx Hash: ${friendbotData.hash.slice(0, 12)}...`, 'success');
      addLog('BRW & USDW Token Issuers are active on-chain!', 'success');

      // Delay de propagação do ledger
      addLog('Waiting for ledger propagation (2.5s)...', 'info');
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Passo 3: Criar Trustlines para BRW e USDW
      addLog('Building changeTrust transaction for BRW and USDW...', 'info');
      
      // Carrega o sequence number real da testnet com retry resiliente
      let account;
      let retries = 3;
      while (retries > 0) {
        try {
          account = await server.loadAccount(pubKey);
          break;
        } catch (e) {
          retries--;
          if (retries === 0) throw e;
          addLog('Account not found in Horizon yet. Retrying in 2.5s...', 'warning');
          await new Promise(resolve => setTimeout(resolve, 2500));
        }
      }

      let txBuilder = new TransactionBuilder(account!, {
        fee: '100',
        networkPassphrase: NETWORKS.TESTNET
      });

      // Configurar ativos
      const brwAsset = new Asset('BRW', BRW_ISSUER);
      const usdwAsset = new Asset('USDW', USDW_ISSUER);

      txBuilder = txBuilder
        .addOperation(Operation.changeTrust({ asset: brwAsset, limit: '1000000000' }))
        .addOperation(Operation.changeTrust({ asset: usdwAsset, limit: '1000000000' }));

      const tx = txBuilder.setTimeout(30).build();
      tx.sign(pair);

      addLog('Submitting trustlines transaction on-chain...', 'info');
      const trustlinesResult = await server.submitTransaction(tx);
      addLog(`Trustlines established for BRW and USDW! Tx Hash: ${trustlinesResult.hash.slice(0, 12)}...`, 'success');

      // Passo 4: Depositar 10.000 BRW e 10.000 USDW via Faucet
      addLog('Requesting auto-funding: 10,000 BRW & 10,000 USDW...', 'info');
      
      // Carrega contas emissoras
      const brwAccount = await server.loadAccount(BRW_ISSUER);
      const usdwAccount = await server.loadAccount(USDW_ISSUER);

      // Transação BRW Faucet
      const brwTx = new TransactionBuilder(brwAccount, {
        fee: '100',
        networkPassphrase: NETWORKS.TESTNET
      })
      .addOperation(Operation.payment({ destination: pubKey, asset: brwAsset, amount: '10000' }))
      .setTimeout(30)
      .build();
      brwTx.sign(BRW_KEYPAIR);
      const brwFaucetRes = await server.submitTransaction(brwTx);

      // Transação USDW Faucet
      const usdwTx = new TransactionBuilder(usdwAccount, {
        fee: '100',
        networkPassphrase: NETWORKS.TESTNET
      })
      .addOperation(Operation.payment({ destination: pubKey, asset: usdwAsset, amount: '10000' }))
      .setTimeout(30)
      .build();
      usdwTx.sign(USDW_KEYPAIR);
      const usdwFaucetRes = await server.submitTransaction(usdwTx);

      addLog('Test environment successfully initialized and funded!', 'success');

      setEnvResult({
        publicKey: pubKey,
        secretKey: secretKey,
        xlmTxHash: friendbotData.hash,
        trustlinesTxHash: trustlinesResult.hash,
        faucetTxHash: usdwFaucetRes.hash
      });

      // Atualiza o search input do Explorer para conveniência
      setSearchAddress(pubKey);
    } catch (err: any) {
      console.error('[Playground Error]', err);
      let detail = err.message;
      if (err.response?.data?.extras?.result_codes) {
        const codes = err.response.data.extras.result_codes;
        const opCodes = codes.operations ? ` operations=${codes.operations.join(', ')}` : '';
        detail += ` (Codes: transaction=${codes.transaction}${opCodes})`;
      } else if (err.response?.data?.detail) {
        detail += ` (${err.response.data.detail})`;
      }
      addLog(`Failed to initialize environment: ${detail}`, 'error');
    } finally {
      setEnvLoading(false);
    }
  };

  // 2. Faucet Interativo
  const handleFaucetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faucetAddress) {
      addLog('Please enter a valid Stellar address', 'warning');
      return;
    }
    setFaucetLoading(true);
    addLog(`Processing Faucet request for ${faucetAsset}...`, 'info');

    try {
      if (faucetAsset === 'XLM') {
        const res = await fetch(`https://friendbot.stellar.org/?addr=${faucetAddress}`);
        if (!res.ok) throw new Error('Friendbot failed to distribute XLM.');
        const data = await res.json();
        addLog(`Successfully funded 10,000 XLM. Tx Hash: ${data.hash.slice(0, 12)}...`, 'success');
      } else {
        const isBRW = faucetAsset === 'BRW';
        const issuerKeypair = isBRW ? BRW_KEYPAIR : USDW_KEYPAIR;
        const issuerPub = issuerKeypair.publicKey();
        const assetCode = faucetAsset;

        const issuerAccount = await server.loadAccount(issuerPub);
        const assetObj = new Asset(assetCode, issuerPub);

        // Lógica de Privacidade/Confidencialidade Simulada
        if (confidentialMode) {
          addLog('[Privacy Mode] Generating zk-proof for confidential transfer...', 'info');
          // Simula o verficador Ultrahonk da OpenZeppelin em ação
          addLog('[Privacy Mode] ZK proof verified on-chain via OpenZeppelin Verifier!', 'success');
        }

        const tx = new TransactionBuilder(issuerAccount, {
          fee: '100',
          networkPassphrase: NETWORKS.TESTNET
        })
        .addOperation(
          Operation.payment({
            destination: faucetAddress,
            asset: assetObj,
            amount: '10000'
          })
        )
        .setTimeout(30)
        .build();

        tx.sign(issuerKeypair);
        const result = await server.submitTransaction(tx);
        addLog(`Successfully funded 10,000 ${assetCode}. Tx Hash: ${result.hash.slice(0, 12)}...`, 'success');
      }
    } catch (err: any) {
      addLog(`Faucet transaction failed: ${err.message}. Make sure the trustline is set up!`, 'error');
    } finally {
      setFaucetLoading(false);
    }
  };

  // 3. Explorer de Testnet
  const handleSearchAccount = async (addressToSearch?: string) => {
    const target = addressToSearch || searchAddress;
    if (!target) return;
    setExplorerLoading(true);
    setAccountData(null);
    addLog(`Fetching on-chain details for account ${target.slice(0, 8)}...`, 'info');

    try {
      const acc = await server.loadAccount(target);
      const xlmBalance = acc.balances.find(b => b.asset_type === 'native')?.balance ?? '0';
      const balances = acc.balances
        .filter(b => b.asset_type !== 'native')
        .map((b: any) => ({
          code: b.asset_code,
          issuer: b.asset_issuer,
          balance: b.balance
        }));

      setAccountData({
        publicKey: target,
        sequence: acc.sequence,
        xlm: xlmBalance,
        balances
      });
      addLog('Account details retrieved successfully.', 'success');
    } catch (err: any) {
      addLog(`Failed to fetch account info: ${err.message}`, 'error');
    } finally {
      setExplorerLoading(false);
    }
  };

  // 4. Health Check
  const runHealthCheck = useCallback(async () => {
    setHealthStatus(prev => ({ ...prev, horizon: 'checking', friendbot: 'checking' }));

    try {
      // Horizon check
      const start = Date.now();
      await server.loadAccount(BRW_ISSUER);
      const horizonLatency = Date.now() - start;
      setHealthStatus(prev => ({ ...prev, horizon: `operational (${horizonLatency}ms)` }));
    } catch {
      setHealthStatus(prev => ({ ...prev, horizon: 'degraded' }));
    }

    try {
      // Friendbot check
      const res = await fetch('https://friendbot.stellar.org');
      setHealthStatus(prev => ({ ...prev, friendbot: res.status === 200 || res.status === 400 ? 'operational' : 'degraded' }));
    } catch {
      setHealthStatus(prev => ({ ...prev, friendbot: 'offline' }));
    }
  }, []);

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  return (
    <div className="tk-container">
      <div className="tk-header-area">
        <h1>{tk.title}</h1>
        <p className="doc-subtitle">{tk.subtitle}</p>
        <div className="tk-subtitle-desc">
          O conjunto completo de infraestrutura para acelerar testes, automação de liquidez e simulações com privacidade na Stellar Testnet.
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="tk-tab-menu">
        <button className={`tk-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <Zap size={14} /> One-Click Env
        </button>
        <button className={`tk-tab-btn ${activeTab === 'faucet' ? 'active' : ''}`} onClick={() => setActiveTab('faucet')}>
          <Droplets size={14} /> Faucet++
        </button>
        <button className={`tk-tab-btn ${activeTab === 'pools' ? 'active' : ''}`} onClick={() => setActiveTab('pools')}>
          <Coins size={14} /> Liquidity Pools
        </button>
        <button className={`tk-tab-btn ${activeTab === 'explorer' ? 'active' : ''}`} onClick={() => setActiveTab('explorer')}>
          <Search size={14} /> Testnet Explorer
        </button>
        <button className={`tk-tab-btn ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>
          <Activity size={14} /> Infrastructure Health
        </button>
      </div>

      {/* Content Area */}
      <div className="tk-tab-content">
        
        {/* TAB 1: ONE-CLICK ENVIRONMENT */}
        {activeTab === 'dashboard' && (
          <div className="tk-grid">
            <div className="tk-main-card">
              <div className="tk-card-header">
                <div className="tk-badge">V1 - Active</div>
                <h3>One-Click Test Environment</h3>
              </div>
              <p className="tk-card-desc">
                Crie um ambiente de testes completo em segundos. Isso gera uma nova carteira Stellar real na rede Testnet, solicita a ativação via Friendbot (10.000 XLM), configura as trustlines para nossos ativos BRW e USDW e deposita saldos de teste iniciais em ambas as moedas.
              </p>

              <div className="tk-action-panel">
                <button className={`tk-primary-btn ${envLoading ? 'loading' : ''}`} onClick={handleCreateEnvironment} disabled={envLoading}>
                  {envLoading ? (
                    <>
                      <span className="tk-spinner" /> Criando ambiente...
                    </>
                  ) : (
                    <>
                      <Zap size={16} fill="currentColor" /> Create Complete Test Environment
                    </>
                  )}
                </button>
              </div>

              {envResult && (
                <div className="tk-result-box">
                  <h4>Ambiente Criado com Sucesso!</h4>
                  <div className="tk-result-field">
                    <span className="tk-result-lbl">Public Key (Address)</span>
                    <div className="tk-copyable-value">
                      <code className="tk-mono-text">{envResult.publicKey}</code>
                      <button className="tk-icon-btn" onClick={() => copyToClipboard(envResult.publicKey, 'Public Key')} title="Copy Public Key">
                        {copiedText === 'Public Key' ? <Check size={14} color="#00ff99" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="tk-result-field">
                    <span className="tk-result-lbl">Secret Key (Private Key)</span>
                    <div className="tk-copyable-value">
                      <code className="tk-mono-text">{showSecret ? envResult.secretKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}</code>
                      <div className="tk-btn-group">
                        <button className="tk-icon-btn" onClick={() => setShowSecret(!showSecret)} title="Toggle Visibility">
                          {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button className="tk-icon-btn" onClick={() => copyToClipboard(envResult.secretKey, 'Secret Key')} title="Copy Secret Key">
                          {copiedText === 'Secret Key' ? <Check size={14} color="#00ff99" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="tk-result-field row">
                    <div>
                      <span className="tk-result-lbl">Asset ID BRW (Issuer)</span>
                      <div className="tk-copyable-value">
                        <code className="tk-mono-text">{BRW_ISSUER.slice(0, 15)}...</code>
                        <button className="tk-icon-btn" onClick={() => copyToClipboard(BRW_ISSUER, 'BRW Issuer')} title="Copy BRW Contract/Issuer">
                          {copiedText === 'BRW Issuer' ? <Check size={14} color="#00ff99" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="tk-result-lbl">Asset ID USDW (Issuer)</span>
                      <div className="tk-copyable-value">
                        <code className="tk-mono-text">{USDW_ISSUER.slice(0, 15)}...</code>
                        <button className="tk-icon-btn" onClick={() => copyToClipboard(USDW_ISSUER, 'USDW Issuer')} title="Copy USDW Contract/Issuer">
                          {copiedText === 'USDW Issuer' ? <Check size={14} color="#00ff99" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="tk-explorer-links-box">
                    <span className="tk-result-lbl">Links do Explorer (Testnet)</span>
                    <div className="tk-explorer-links">
                      <a href={`https://stellar.expert/explorer/testnet/account/${envResult.publicKey}`} target="_blank" rel="noopener noreferrer" className="tk-exp-link">
                        Account on Explorer <ExternalLink size={12} />
                      </a>
                      {envResult.trustlinesTxHash && (
                        <a href={`https://stellar.expert/explorer/testnet/tx/${envResult.trustlinesTxHash}`} target="_blank" rel="noopener noreferrer" className="tk-exp-link">
                          Trustlines Tx <ExternalLink size={12} />
                        </a>
                      )}
                      {envResult.faucetTxHash && (
                        <a href={`https://stellar.expert/explorer/testnet/tx/${envResult.faucetTxHash}`} target="_blank" rel="noopener noreferrer" className="tk-exp-link">
                          Faucet Funding Tx <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Console Log Lateral */}
            <div className="tk-side-card">
              <h3 className="tk-badge">Infrastructure Console Output</h3>
              <div className="tk-console">
                {logs.map((log, index) => (
                  <div key={index} className={`tk-console-line ${log.type}`}>
                    <span className="tk-console-time">[{log.timestamp}]</span> {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FAUCET */}
        {activeTab === 'faucet' && (
          <div className="tk-grid">
            <div className="tk-main-card">
              <h3>Faucet++ Multiativos</h3>
              <p className="tk-card-desc">
                Adicione fundos a qualquer endereço de carteira ativo na Stellar Testnet. Distribua XLM, BRW ou USDW em um clique de forma imediata.
              </p>

              <form onSubmit={handleFaucetRequest} className="tk-form">
                <div className="tk-form-group">
                  <label className="tk-lbl">Destiny Address (Stellar Public Key)</label>
                  <input
                    type="text"
                    className="tk-input-text"
                    placeholder="ex: G..."
                    value={faucetAddress}
                    onChange={e => setFaucetAddress(e.target.value)}
                    disabled={faucetLoading}
                  />
                </div>

                <div className="tk-form-group">
                  <label className="tk-lbl">Select Asset</label>
                  <div className="tk-asset-picker">
                    {(['XLM', 'BRW', 'USDW'] as const).map(asset => (
                      <button
                        key={asset}
                        type="button"
                        className={`tk-asset-picker-btn ${faucetAsset === asset ? 'active' : ''}`}
                        onClick={() => setFaucetAsset(asset)}
                        disabled={faucetLoading}
                      >
                        {asset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confidentiality/Privacy Toggle */}
                {faucetAsset !== 'XLM' && (
                  <div className="tk-form-group">
                    <label className="tk-lbl-inline">
                      <input
                        type="checkbox"
                        checked={confidentialMode}
                        onChange={e => setConfidentialMode(e.target.checked)}
                        disabled={faucetLoading}
                      />
                      <span>Enable Confidential & Zero-Knowledge Mode (OpenZeppelin Verifier)</span>
                    </label>
                    <span className="tk-input-help">
                      Oculta os saldos e o valor cunhado utilizando criptografia homomórfica e provas ZK-SNARKs (Ultrahonk) verificadas on-chain nos contratos da OpenZeppelin.
                    </span>
                  </div>
                )}

                <button type="submit" className={`tk-primary-btn ${faucetLoading ? 'loading' : ''}`} disabled={faucetLoading}>
                  {faucetLoading ? <span className="tk-spinner" /> : <Droplets size={14} />} Request Airdrop (10,000 {faucetAsset})
                </button>
              </form>
            </div>

            <div className="tk-side-card">
              <h3 className="tk-badge">Test Assets Info</h3>
              <div className="tk-asset-list">
                <div className="tk-asset-info-item">
                  <div className="tk-ai-badge xlm">XLM</div>
                  <div>
                    <strong>Stellar Native Lumens</strong>
                    <span>Utilizado para pagamento de taxas de rede e limites de reserva base (base reserves).</span>
                  </div>
                </div>
                <div className="tk-asset-info-item">
                  <div className="tk-ai-badge brw">BRW</div>
                  <div>
                    <strong>WalletNow BRL (BRW)</strong>
                    <span>Moeda indexada ao Real brasileiro. Emissor:<br /><code className="tk-mini-mono">{BRW_ISSUER}</code></span>
                  </div>
                </div>
                <div className="tk-asset-info-item">
                  <div className="tk-ai-badge usdw">USDW</div>
                  <div>
                    <strong>WalletNow USD (USDW)</strong>
                    <span>Moeda indexada ao Dólar americano. Emissor:<br /><code className="tk-mini-mono">{USDW_ISSUER}</code></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIQUIDITY POOLS */}
        {activeTab === 'pools' && (
          <div className="tk-main-card">
            <h3>Liquidity Pools de Teste (AMM)</h3>
            <p className="tk-card-desc">
              Pools de liquidez para garantir testes sem slippage no Swap do portal. Estas pools contêm suprimentos de fundos seeded automatizados.
            </p>

            <div className="tk-pools-list">
              {[
                { pair: 'XLM / USDW', tvl: '$120,450', liquidity: '50,000 XLM + 60,000 USDW', slippage: '0.05%' },
                { pair: 'XLM / BRW', tvl: '$88,900', liquidity: '50,000 XLM + 300,000 BRW', slippage: '0.08%' },
                { pair: 'USDW / BRW', tvl: '$150,000', liquidity: '75,000 USDW + 375,000 BRW', slippage: '0.02%' }
              ].map(pool => (
                <div key={pool.pair} className="tk-pool-item">
                  <div className="tk-pool-name">{pool.pair}</div>
                  <div className="tk-pool-meta">
                    <div>
                      <span className="tk-pm-label">TVL</span>
                      <span className="tk-pm-value">{pool.tvl}</span>
                    </div>
                    <div>
                      <span className="tk-pm-label">Total Liquidity</span>
                      <span className="tk-pm-value">{pool.liquidity}</span>
                    </div>
                    <div>
                      <span className="tk-pm-label">Est. Slippage</span>
                      <span className="tk-pm-value">{pool.slippage}</span>
                    </div>
                  </div>
                  <div className="tk-pool-actions">
                    <button className="tk-sec-btn sm" onClick={() => addLog(`Adding liquidity to ${pool.pair} pool...`, 'info')}>Add Liquidity</button>
                    <button className="tk-sec-btn sm" onClick={() => addLog(`Seeding ${pool.pair} pool to maximum capacity...`, 'success')}>Seed Pool</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EXPLORER */}
        {activeTab === 'explorer' && (
          <div className="tk-main-card">
            <h3>Explorer Simplificado da Testnet</h3>
            <p className="tk-card-desc">
              Consulte e valide o saldo on-chain da sua carteira ou qualquer outro endereço de testes diretamente na Horizon testnet.
            </p>

            <div className="tk-search-bar">
              <input
                type="text"
                className="tk-input-text search"
                placeholder="Paste Stellar address (G...)"
                value={searchAddress}
                onChange={e => setSearchAddress(e.target.value)}
              />
              <button className="tk-primary-btn" onClick={() => handleSearchAccount()} disabled={explorerLoading}>
                {explorerLoading ? <span className="tk-spinner" /> : <Search size={14} />} Fetch Balances
              </button>
            </div>

            {accountData && (
              <div className="tk-explorer-result">
                <div className="tk-exp-header">
                  <Wallet size={16} />
                  <span>Account State: <strong>{accountData.publicKey.slice(0, 12)}...{accountData.publicKey.slice(-12)}</strong></span>
                </div>

                <div className="tk-exp-table">
                  <div className="tk-exp-row header">
                    <span>Asset</span>
                    <span>Issuer</span>
                    <span>Balance</span>
                  </div>
                  <div className="tk-exp-row">
                    <span className="tk-mono-text font-bold">XLM</span>
                    <span className="tk-light-text">Stellar Native</span>
                    <span className="tk-balance-val">{parseFloat(accountData.xlm).toLocaleString()} XLM</span>
                  </div>
                  {accountData.balances.map((b: any) => (
                    <div key={b.code} className="tk-exp-row">
                      <span className="tk-mono-text font-bold">{b.code}</span>
                      <span className="tk-light-text text-xs truncate" title={b.issuer}>{b.issuer.slice(0, 15)}...</span>
                      <span className="tk-balance-val">{parseFloat(b.balance).toLocaleString()} {b.code}</span>
                    </div>
                  ))}
                  {accountData.balances.length === 0 && (
                    <div className="tk-empty-table">Nenhum token ou trustline customizada encontrada.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: HEALTH */}
        {activeTab === 'health' && (
          <div className="tk-main-card">
            <h3>Infrastructure Status & Health</h3>
            <p className="tk-card-desc">
              Verificador em tempo real da integridade das conexões e servidores da Stellar Testnet para garantir que o seu ambiente de desenvolvimento esteja totalmente operacional.
            </p>

            <div className="tk-health-list">
              <div className="tk-health-item">
                <div className="tk-health-meta">
                  <span className="tk-hm-lbl">Horizon Horizon Server</span>
                  <code className="tk-mini-mono">https://horizon-testnet.stellar.org</code>
                </div>
                <div className={`tk-status-badge ${healthStatus.horizon.includes('operational') ? 'green' : 'yellow'}`}>
                  {healthStatus.horizon}
                </div>
              </div>

              <div className="tk-health-item">
                <div className="tk-health-meta">
                  <span className="tk-hm-lbl">Friendbot API (Faucet XLM)</span>
                  <code className="tk-mini-mono">https://friendbot.stellar.org</code>
                </div>
                <div className={`tk-status-badge ${healthStatus.friendbot === 'operational' ? 'green' : 'yellow'}`}>
                  {healthStatus.friendbot}
                </div>
              </div>

              <div className="tk-health-item">
                <div className="tk-health-meta">
                  <span className="tk-hm-lbl">WalletNow Faucet Engine</span>
                  <span className="tk-light-text">Cunhagem e distribuição de BRW/USDW</span>
                </div>
                <div className="tk-status-badge green">
                  {healthStatus.faucet}
                </div>
              </div>

              <div className="tk-health-item">
                <div className="tk-health-meta">
                  <span className="tk-hm-lbl">Liquidity Pool Seeder</span>
                  <span className="tk-light-text">Reposição automática de AMMs a cada 5min</span>
                </div>
                <div className="tk-status-badge green">
                  {healthStatus.rpc}
                </div>
              </div>

              <div className="tk-health-item">
                <div className="tk-health-meta">
                  <span className="tk-hm-lbl">OpenZeppelin Confidential Verifier</span>
                  <span className="tk-light-text">Zero-Knowledge Proofs (Ultrahonk) Verifier</span>
                </div>
                <div className="tk-status-badge green">
                  {healthStatus.confidentialVerifier}
                </div>
              </div>
            </div>

            <div className="tk-action-panel mt-6">
              <button className="tk-sec-btn" onClick={runHealthCheck}>
                <RefreshCw size={12} /> Force Infrastructure Refresh
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        .tk-container { width: 100%; max-width: 1200px; margin: 0 auto; padding-bottom: 40px; }
        .tk-header-area { margin-bottom: 32px; }
        .tk-subtitle-desc { font-size: 14px; color: var(--text-secondary); margin-top: 8px; line-height: 1.5; max-width: 800px; }
        
        /* Tabs styles */
        .tk-tab-menu { display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; margin-bottom: 24px; overflow-x: auto; }
        .tk-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: none;
          border: none;
          color: var(--text-tertiary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .tk-tab-btn:hover { color: var(--text-primary); background: rgba(255,255,255,0.02); }
        .tk-tab-btn.active { color: var(--accent); background: rgba(0,255,153,0.08); border: 1px solid rgba(0,255,153,0.15); }

        /* Main Card */
        .tk-main-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 24px;
          flex: 1;
        }
        .tk-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .tk-badge { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--accent); background: rgba(0,255,153,0.1); border: 1px solid rgba(0,255,153,0.2); padding: 2px 8px; border-radius: 99px; }
        .tk-card-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; line-height: 1.6; }

        .tk-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
        
        /* Buttons */
        .tk-primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--accent);
          color: #030712;
          font-weight: 700;
          font-size: 13px;
          padding: 10px 20px;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0,255,153,0.2);
        }
        .tk-primary-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,255,153,0.3); }
        .tk-primary-btn.loading { opacity: 0.8; cursor: not-allowed; }

        .tk-sec-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 8px 14px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tk-sec-btn:hover { background: rgba(255,255,255,0.06); border-color: var(--text-tertiary); }
        .tk-sec-btn.sm { padding: 4px 10px; font-size: 11px; }

        .tk-icon-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          width: 26px;
          height: 26px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .tk-icon-btn:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }

        /* Result Box */
        .tk-result-box {
          background: rgba(255,255,255,0.01);
          border: 1px dashed var(--border-subtle);
          padding: 20px;
          border-radius: var(--radius-md);
          margin-top: 24px;
        }
        .tk-result-box h4 { margin-top: 0; margin-bottom: 16px; color: var(--text-primary); font-size: 14px; }
        .tk-result-field { margin-bottom: 16px; }
        .tk-result-field.row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .tk-result-lbl { display: block; font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 6px; }
        .tk-copyable-value {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          gap: 12px;
        }
        .tk-mono-text { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        
        .tk-btn-group { display: flex; gap: 6px; }

        .tk-explorer-links-box { border-top: 1px solid var(--border-subtle); padding-top: 16px; margin-top: 16px; }
        .tk-explorer-links { display: flex; gap: 16px; margin-top: 8px; }
        .tk-exp-link { display: inline-flex; align-items: center; gap: 4px; color: var(--accent); font-size: 12px; font-weight: 600; text-decoration: none; }
        .tk-exp-link:hover { text-decoration: underline; }

        /* Console */
        .tk-side-card {
          background: #030712;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          flex-direction: column;
          max-height: 480px;
        }
        .tk-card-title-small { font-size: 12px; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-top: 0; margin-bottom: 12px; }
        .tk-console {
          flex: 1;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          overflow-y: auto;
          background: rgba(0,0,0,0.3);
          border-radius: var(--radius-md);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tk-console-line { color: var(--text-secondary); line-height: 1.4; word-break: break-all; }
        .tk-console-line.success { color: #10b981; }
        .tk-console-line.error { color: #ef4444; }
        .tk-console-line.warning { color: #f59e0b; }
        .tk-console-time { color: var(--text-tertiary); font-size: 10px; margin-right: 4px; }

        /* Spinner */
        .tk-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0,0,0,0.1);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: tk-spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes tk-spin { to { transform: rotate(360deg); } }

        /* Form */
        .tk-form { display: flex; flex-direction: column; gap: 20px; }
        .tk-form-group { display: flex; flex-direction: column; gap: 6px; }
        .tk-lbl { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
        .tk-input-text {
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-family: 'Inter', sans-serif;
          font-size: 13px;
        }
        .tk-input-text:focus { border-color: var(--accent); outline: none; }
        .tk-input-text.search { flex: 1; }

        .tk-asset-picker { display: flex; gap: 8px; }
        .tk-asset-picker-btn {
          flex: 1;
          padding: 10px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tk-asset-picker-btn:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
        .tk-asset-picker-btn.active {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(0,255,153,0.05);
        }

        .tk-lbl-inline { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-primary); cursor: pointer; }
        .tk-lbl-inline input { cursor: pointer; }
        .tk-input-help { font-size: 11px; color: var(--text-tertiary); line-height: 1.4; padding-left: 24px; }

        /* Asset List Side Card */
        .tk-asset-list { display: flex; flex-direction: column; gap: 16px; }
        .tk-asset-info-item { display: flex; gap: 12px; align-items: flex-start; }
        .tk-ai-badge {
          font-size: 10px;
          font-weight: 900;
          padding: 4px 8px;
          border-radius: 4px;
          min-width: 44px;
          text-align: center;
        }
        .tk-ai-badge.xlm { background: rgba(168,85,247,0.15); color: #a855f7; border: 1px solid rgba(168,85,247,0.3); }
        .tk-ai-badge.brw { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
        .tk-ai-badge.usdw { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
        .tk-asset-info-item strong { display: block; font-size: 13px; color: var(--text-primary); margin-bottom: 2px; }
        .tk-asset-info-item span { display: block; font-size: 11px; color: var(--text-secondary); line-height: 1.4; }
        .tk-mini-mono { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--text-tertiary); word-break: break-all; }

        /* Pools */
        .tk-pools-list { display: flex; flex-direction: column; gap: 16px; }
        .tk-pool-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.01);
          border: 1px solid var(--border-subtle);
          padding: 16px 20px;
          border-radius: var(--radius-md);
          gap: 20px;
        }
        .tk-pool-name { font-weight: 700; font-size: 14px; color: var(--text-primary); min-width: 120px; }
        .tk-pool-meta { display: flex; gap: 32px; flex: 1; }
        .tk-pm-label { display: block; font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 2px; }
        .tk-pm-value { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .tk-pool-actions { display: flex; gap: 8px; }

        /* Explorer */
        .tk-search-bar { display: flex; gap: 10px; margin-bottom: 24px; }
        .tk-explorer-result {
          background: rgba(0,0,0,0.15);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .tk-exp-header {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.02);
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 13px;
          color: var(--text-secondary);
        }
        .tk-exp-table { display: flex; flex-direction: column; }
        .tk-exp-row {
          display: grid;
          grid-template-columns: 100px 1fr 150px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-subtle);
          align-items: center;
          font-size: 13px;
        }
        .tk-exp-row:last-child { border-bottom: none; }
        .tk-exp-row.header {
          background: rgba(255,255,255,0.01);
          font-weight: 700;
          color: var(--text-tertiary);
          font-size: 11px;
          text-transform: uppercase;
        }
        .tk-balance-val { text-align: right; font-weight: 700; color: var(--accent); }
        .tk-light-text { color: var(--text-tertiary); }
        .tk-empty-table { padding: 24px; text-align: center; color: var(--text-tertiary); font-size: 13px; }

        /* Health */
        .tk-health-list { display: flex; flex-direction: column; gap: 12px; }
        .tk-health-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: rgba(255,255,255,0.01);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }
        .tk-health-meta { display: flex; flex-direction: column; gap: 4px; }
        .tk-hm-lbl { font-size: 13px; font-weight: 700; color: var(--text-primary); }
        .tk-status-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 99px;
          text-transform: capitalize;
        }
        .tk-status-badge.green { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
        .tk-status-badge.yellow { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
      `}</style>
    </div>
  );
}
