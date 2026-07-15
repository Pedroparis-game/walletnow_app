import React, { useState, useCallback } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Keypair, Transaction, Networks } from '@stellar/stellar-sdk';

const NETWORKS = {
  TESTNET: 'Test SDF Network ; September 2015'
};

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
}

export default function AIAgents() {
  const [sepSecretKey, setSepSecretKey] = useState('');
  const [sepAnchor, setSepAnchor] = useState('testanchor.stellar.org');
  const [sepAsset, setSepAsset] = useState('SRT');
  const [sepLoading, setSepLoading] = useState(false);
  const [sepResultUrl, setSepResultUrl] = useState<string | null>(null);
  const [sepLogs, setSepLogs] = useState<LogEntry[]>([
    { message: 'IA & SEP Integration Console initialized.', type: 'info', timestamp: new Date().toLocaleTimeString() }
  ]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const addSepLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setSepLogs(prev => [
      { message, type, timestamp: new Date().toLocaleTimeString() },
      ...prev
    ]);
  }, []);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleRunSepFlow = async () => {
    if (!sepSecretKey) {
      addSepLog('Erro: Chave Secreta do usuário é obrigatória.', 'error');
      return;
    }
    setSepLoading(true);
    setSepResultUrl(null);
    addSepLog(`Iniciando fluxo invisível com ${sepAnchor}...`, 'info');

    try {
      const userKeypair = Keypair.fromSecret(sepSecretKey);
      const userAddress = userKeypair.publicKey();

      // 1. SEP-10 Auth Challenge
      addSepLog(`[SEP-10] Solicitando desafio para conta: ${userAddress.slice(0, 8)}...`, 'info');
      const challengeUrl = `https://${sepAnchor}/auth?account=${userAddress}`;
      const challengeRes = await fetch(challengeUrl);
      if (!challengeRes.ok) {
        throw new Error(`Falha no GET /auth: HTTP ${challengeRes.status}`);
      }
      const challengeJson = await challengeRes.json();
      const transactionXDR = challengeJson.transaction;
      addSepLog(`[SEP-10] Desafio obtido. Assinando silenciosamente localmente...`, 'info');

      // Assinar transação
      const challengeTx = new Transaction(transactionXDR, NETWORKS.TESTNET);
      challengeTx.sign(userKeypair);
      const signedXDR = challengeTx.toEnvelope().toXDR('base64');
      addSepLog(`[SEP-10] Enviando desafio assinado para a âncora...`, 'info');

      // Enviar de volta
      const tokenRes = await fetch(`https://${sepAnchor}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: signedXDR })
      });
      if (!tokenRes.ok) {
        throw new Error(`Falha no POST /auth: HTTP ${tokenRes.status}`);
      }
      const tokenJson = await tokenRes.json();
      const jwtToken = tokenJson.token;
      addSepLog(`[SEP-10] Autenticação concluída! Token JWT recebido.`, 'success');

      // 2. SEP-24 Interactive Deposit
      addSepLog(`[SEP-24] Solicitando rampa interativa para o ativo ${sepAsset}...`, 'info');
      const depositUrl = `https://${sepAnchor}/sep24/transactions/deposit/interactive`;
      const formData = new FormData();
      formData.append('asset_code', sepAsset);
      formData.append('account', userAddress);

      const depositRes = await fetch(depositUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        },
        body: formData
      });

      if (!depositRes.ok) {
        const errText = await depositRes.text();
        throw new Error(`Falha no depósito SEP-24: HTTP ${depositRes.status} — ${errText}`);
      }

      const depositData = await depositRes.json();
      const interactiveUrl = depositData.url;
      addSepLog(`[SEP-24] Sucesso! Rampa fiduciária gerada em background.`, 'success');
      setSepResultUrl(interactiveUrl);
    } catch (err: any) {
      console.error('[SEP Flow Error]', err);
      addSepLog(`Falha no fluxo SEP: ${err.message}`, 'error');
    } finally {
      setSepLoading(false);
    }
  };

  return (
    <div className="ai-agents-wrapper">
      <h1 className="mb-4">IA & SEP Integration</h1>
      <p className="doc-subtitle">
        Veja o WalletNow SDK em ação. Copie prompts para IAs de codificação e teste fluxos de autenticação (SEP-10) e depósito fiduciário (SEP-24) de forma silenciosa para o usuário final.
      </p>

      <div className="doc-info-card" style={{ marginBottom: '32px' }}>
        <strong>🤖 Explorando IAs na Rede Stellar?</strong>
        <p style={{ marginTop: '8px', marginBottom: 0 }}>
          Se você está construindo agentes autônomos ou integrações de IA, a própria Stellar fornece ferramentas poderosas.
          Recomendamos fortemente a leitura da documentação oficial:{' '}
          <a 
            href="https://developers.stellar.org/docs/build/building-with-ai" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ fontWeight: 'bold', textDecoration: 'underline' }}
          >
            Building with AI on Stellar
          </a>.
        </p>
      </div>

      <div className="tk-grid">
        <div className="tk-main-card">
          <div className="tk-card-header">
            <div className="tk-badge">SEP-01 · SEP-10 · SEP-24</div>
            <h3>Simulador de Onboarding Invisível</h3>
          </div>

          <div className="tk-pool-action-section mb-6" style={{ borderColor: 'rgba(0,255,153,0.2)' }}>
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span style={{ color: 'var(--accent)' }}>🤖 Prompt de System para IAs (Cursor, Gemini, Copilot)</span>
            </h4>
            <p className="text-xs text-gray-400 mb-3">
              Copie e cole este prompt no chat da sua IA favorita para ensiná-la a integrar o WalletNow SDK corretamente.
            </p>
            <div className="tk-copyable-value" style={{ background: '#090d16', padding: '16px', alignItems: 'flex-start', flexDirection: 'column', gap: '8px' }}>
              <textarea
                readOnly
                className="w-full bg-transparent text-xs text-gray-300 font-mono focus:outline-none border-none resize-none"
                rows={8}
                value={`Você é um assistente de desenvolvimento especialista na blockchain Stellar e no WalletNow SDK.
Ao gerar códigos para integração de carteiras e onboarding:
1. Sempre use o WalletNowClient da biblioteca '@walletnow/sdk' para inicializar.
2. Abstraia a complexidade de transações. Use 'wn.onboarding.createUser({ externalId, authMethod })' para criar contas com biometria/Passkey de forma gasless patrocinada.
3. Para depósitos fiduciários e onboarding de ativos de forma invisível, utilize o 'StellarAnchorService.seamlessFund(anchorDomain, userAddress, userSecretKey, assetCode)'.
4. NUNCA exponha chaves privadas no frontend de produção.`}
              />
              <div className="w-full flex justify-end">
                <button
                  className="tk-sec-btn sm"
                  onClick={() => copyToClipboard(`Você é um assistente de desenvolvimento especialista na blockchain Stellar e no WalletNow SDK.
Ao gerar códigos para integração de carteiras e onboarding:
1. Sempre use o WalletNowClient da biblioteca '@walletnow/sdk' para inicializar.
2. Abstraia a complexidade de transações. Use 'wn.onboarding.createUser({ externalId, authMethod })' para criar contas com biometria/Passkey de forma gasless patrocinada.
3. Para depósitos fiduciários e onboarding de ativos de forma invisível, utilize o 'StellarAnchorService.seamlessFund(anchorDomain, userAddress, userSecretKey, assetCode)'.
4. NUNCA exponha chaves privadas no frontend de produção.`, 'AI Prompt')}
                >
                  {copiedText === 'AI Prompt' ? <Check size={12} color="#00ff99" /> : <Copy size={12} />} Copiar Prompt
                </button>
              </div>
            </div>
          </div>

          <div className="tk-pool-action-section">
            <h4 className="text-sm font-bold text-white mb-2">⚡ Live Demo: Onboarding Silencioso de Âncora</h4>
            <p className="text-xs text-gray-400 mb-4">
              Simule o fluxo criptográfico em segundo plano.
            </p>

            <div className="tk-form">
              <div className="tk-form-group">
                <label className="tk-lbl">Chave Privada de Teste (S...)</label>
                <input
                  type="password"
                  className="tk-input-text font-mono"
                  placeholder="Insira a Secret Key do usuário"
                  value={sepSecretKey}
                  onChange={e => setSepSecretKey(e.target.value)}
                />
              </div>

              <div className="tk-input-row">
                <div className="tk-input-col">
                  <label className="tk-lbl">Âncora de Destino</label>
                  <input
                    type="text"
                    className="tk-input-text"
                    value={sepAnchor}
                    onChange={e => setSepAnchor(e.target.value)}
                  />
                </div>
                <div className="tk-input-col">
                  <label className="tk-lbl">Código do Ativo</label>
                  <input
                    type="text"
                    className="tk-input-text font-mono"
                    value={sepAsset}
                    onChange={e => setSepAsset(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  className={`tk-primary-btn flex-1 ${sepLoading ? 'loading' : ''}`}
                  onClick={handleRunSepFlow}
                  disabled={sepLoading}
                >
                  {sepLoading ? <span className="tk-spinner" /> : 'Executar Fluxo Invisível'}
                </button>
              </div>
            </div>

            {sepResultUrl && (
              <div className="tk-result-box" style={{ borderColor: 'var(--accent)', marginTop: '24px' }}>
                <h5 style={{ color: 'var(--accent)' }}>Rampa Fiduciária Criada!</h5>
                <p className="text-xs text-gray-300 mb-3">
                  Clique no botão abaixo para abrir a interface hospedada da âncora:
                </p>
                <a
                  href={sepResultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tk-primary-btn w-full text-center"
                  style={{ textDecoration: 'none' }}
                >
                  Abrir Rampa Interativa SEP-24 <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="ai-agents-sidebar" style={{ flex: '0 0 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="tk-side-card">
            <h4 className="tk-card-title-small">📄 SEP-01: stellar.toml do Emissor</h4>
            <div className="text-xs text-gray-400 mb-3">
              Metadados descobertos publicamente no nosso domínio de testes.
            </div>
            <div className="tk-console" style={{ background: '#090d16', maxHeight: '320px' }}>
              <pre className="text-gray-300 text-xs overflow-x-auto whitespace-pre font-mono">
{`# stellar.toml
ACCOUNTS = [
  "GDGD77A34F5T3TLSOOHWRE4KXZ5TMLWZ5EBYUQSCE2AXGWWPL2RXYWRX",
  "GBCLQJID2ESAVTYM5GGPX7GQNW42WBAELU5RVITBGFS5PM6XCG4IVDP42"
]
VERSION = "2.1.0"
NETWORK_PASSPHRASE = "Test Network"

[[CURRENCIES]]
code = "BRW"
name = "WalletNow BRL"
status = "live"

[[CURRENCIES]]
code = "USDW"
name = "WalletNow USD"
status = "live"`}
              </pre>
            </div>
          </div>

          <div className="tk-side-card">
            <h4 className="tk-card-title-small">🔍 Logs do Console de Abstração</h4>
            <div className="tk-console" style={{ minHeight: '120px' }}>
              {sepLogs.map((log, idx) => (
                <div key={idx} className={`tk-console-line ${log.type}`}>
                  <span className="tk-console-time">{log.timestamp}</span>
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ai-agents-wrapper { max-width: 1200px; margin: 0 auto; }
        .tk-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: flex-start; }
        @media (max-width: 900px) { .tk-grid { grid-template-columns: 1fr; } .ai-agents-sidebar { flex: unset !important; width: 100% !important; } }
        .tk-main-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 32px; min-width: 0; }
        @media (max-width: 600px) { .tk-main-card { padding: 16px; } }
        .tk-side-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 24px; position: sticky; top: 24px; }
        @media (max-width: 900px) { .tk-side-card { position: static; } }
        .tk-card-header { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
        .tk-badge { align-self: flex-start; background: rgba(0, 255, 153, 0.1); color: var(--accent); padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(0, 255, 153, 0.2); }
        .tk-card-header h3 { font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0; }
        .tk-pool-action-section { background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 20px; margin-top: 24px; }
        .tk-form { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }
        .tk-form-group { display: flex; flex-direction: column; gap: 6px; }
        .tk-input-row { display: flex; gap: 16px; flex-wrap: wrap; }
        .tk-input-col { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 140px; }
        .tk-lbl { font-size: 12px; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .tk-input-text { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 10px 12px; color: var(--text-primary); font-size: 14px; transition: all 0.2s; width: 100%; box-sizing: border-box; }
        .tk-input-text:focus { outline: none; border-color: var(--accent); background: rgba(0, 255, 153, 0.05); }
        .tk-primary-btn { background: var(--accent); color: #000; border: none; border-radius: 6px; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .tk-primary-btn:hover { background: #00cc7a; transform: translateY(-1px); }
        .tk-primary-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .tk-sec-btn { background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 12px 24px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .tk-sec-btn:hover { background: rgba(255,255,255,0.1); }
        .tk-sec-btn.sm { padding: 6px 12px; font-size: 12px; }
        .tk-console { background: #0d0d0f; border-radius: 6px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 11px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; border: 1px solid rgba(255,255,255,0.05); }
        .tk-console-line { color: var(--text-secondary); line-height: 1.4; word-break: break-all; }
        .tk-console-line.info { color: #a1a1aa; }
        .tk-console-line.success { color: var(--accent); }
        .tk-console-line.error { color: #ff4d4d; }
        .tk-console-time { color: rgba(255,255,255,0.3); margin-right: 8px; }
        .tk-result-box { background: rgba(0, 255, 153, 0.05); border: 1px dashed var(--border-subtle); border-radius: 8px; padding: 16px; margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
        .tk-copyable-value { display: flex; align-items: flex-start; gap: 8px; overflow: hidden; }
        textarea.bg-transparent { overflow-wrap: break-word; word-break: break-word; }
      `}</style>
    </div>
  );
}
