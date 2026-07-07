/**
 * WalletNow Developer Portal â€” Testnet Infrastructure Kit
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
import { Keypair, TransactionBuilder, Asset, Operation, LiquidityPoolAsset, Transaction, Networks } from '@stellar/stellar-sdk';

// Configurações do Faucet e Emissores
const NETWORKS = {
  TESTNET: 'Test SDF Network ; September 2015'
};

// Helper para instanciar LiquidityPoolAsset garantindo ordenação lexicográfica
function createLpAsset(assetA: Asset, assetB: Asset): LiquidityPoolAsset {
  if (assetA.isNative()) return new LiquidityPoolAsset(assetA, assetB, 30);
  if (assetB.isNative()) return new LiquidityPoolAsset(assetB, assetA, 30);

  const codeA = assetA.getCode();
  const codeB = assetB.getCode();

  if (codeA < codeB) return new LiquidityPoolAsset(assetA, assetB, 30);
  if (codeA > codeB) return new LiquidityPoolAsset(assetB, assetA, 30);

  const issuerA = assetA.getIssuer();
  const issuerB = assetB.getIssuer();
  return issuerA < issuerB 
    ? new LiquidityPoolAsset(assetA, assetB, 30) 
    : new LiquidityPoolAsset(assetB, assetA, 30);
}

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
  const [faucetSuccess, setFaucetSuccess] = useState<{hash: string, asset: string, amount: string} | null>(null);
  const [faucetError, setFaucetError] = useState<string | null>(null);

  // Estado do Explorer
  const [searchAddress, setSearchAddress] = useState('');
  const [accountData, setAccountData] = useState<any | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);

  // Estado das Pools de Liquidez Reais
  const [pools, setPools] = useState<any[]>([
    {
      name: 'XLM / USDW',
      assetA: Asset.native(),
      assetB: new Asset('USDW', USDW_ISSUER),
      id: '',
      reservesA: '0',
      reservesB: '0',
      shares: '0',
      loaded: false
    },
    {
      name: 'XLM / BRW',
      assetA: Asset.native(),
      assetB: new Asset('BRW', BRW_ISSUER),
      id: '',
      reservesA: '0',
      reservesB: '0',
      shares: '0',
      loaded: false
    },
    {
      name: 'USDW / BRW',
      assetA: new Asset('USDW', USDW_ISSUER),
      assetB: new Asset('BRW', BRW_ISSUER),
      id: '',
      reservesA: '0',
      reservesB: '0',
      shares: '0',
      loaded: false
    }
  ]);
  const [poolInputs, setPoolInputs] = useState<Record<number, { amountA: string; amountB: string; withdrawShares: string }>>({
    0: { amountA: '1000', amountB: '1000', withdrawShares: '100' },
    1: { amountA: '1000', amountB: '5000', withdrawShares: '100' },
    2: { amountA: '1000', amountB: '1000', withdrawShares: '100' }
  });
  const [poolsLoading, setPoolsLoading] = useState<Record<number, boolean>>({});

  // Estado do Health Check
  const [healthStatus, setHealthStatus] = useState<any>({
    horizon: 'checking',
    friendbot: 'checking',
    faucet: 'operational',
    rpc: 'operational',
    confidentialVerifier: 'soon'
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
    setFaucetSuccess(null);
    setFaucetError(null);
    addLog(`Processing Faucet request for ${faucetAsset}...`, 'info');

    try {
      if (faucetAsset === 'XLM') {
        const res = await fetch(`https://friendbot.stellar.org/?addr=${faucetAddress}`);
        if (!res.ok) throw new Error('Friendbot failed to distribute XLM.');
        const data = await res.json();
        addLog(`Successfully funded 10,000 XLM. Tx Hash: ${data.hash.slice(0, 12)}...`, 'success');
        setFaucetSuccess({ hash: data.hash, asset: 'XLM', amount: '10,000' });
      } else {
        const isBRW = faucetAsset === 'BRW';
        const issuerKeypair = isBRW ? BRW_KEYPAIR : USDW_KEYPAIR;
        const issuerPub = issuerKeypair.publicKey();
        const assetCode = faucetAsset;

        const issuerAccount = await server.loadAccount(issuerPub);
        const assetObj = new Asset(assetCode, issuerPub);

        // Transferência Pública Clássica
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
        setFaucetSuccess({ hash: result.hash, asset: assetCode, amount: '10,000' });
      }
    } catch (err: any) {
      addLog(`Faucet transaction failed: ${err.message}. Make sure the trustline is set up!`, 'error');
      setFaucetError(err.message);
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

  // Busca os dados das pools on-chain em tempo real
  const fetchPoolsData = async () => {
    try {
      const updated = await Promise.all(pools.map(async (pool) => {
        const lp = createLpAsset(pool.assetA, pool.assetB);
        const poolId = lp.toString().split(':')[1];
        
        try {
          const res = await fetch(`https://horizon-testnet.stellar.org/liquidity_pools/${poolId}`);
          if (res.ok) {
            const data = await res.json();
            const resA = data.reserves.find((r: any) => r.asset === (pool.assetA.isNative() ? 'native' : `${pool.assetA.getCode()}:${pool.assetA.getIssuer()}`))?.amount ?? '0';
            const resB = data.reserves.find((r: any) => r.asset === (pool.assetB.isNative() ? 'native' : `${pool.assetB.getCode()}:${pool.assetB.getIssuer()}`))?.amount ?? '0';
            return {
              ...pool,
              id: poolId,
              reservesA: resA,
              reservesB: resB,
              shares: data.total_shares,
              loaded: true
            };
          }
        } catch (e) {
          // A pool não existe on-chain ainda
        }
        return {
          ...pool,
          id: poolId,
          reservesA: '0',
          reservesB: '0',
          shares: '0',
          loaded: true
        };
      }));
      setPools(updated);
    } catch (err) {
      console.error('Failed to fetch pools state:', err);
    }
  };

  // Inicialização das pools com IDs determinísticos na montagem
  useEffect(() => {
    setPools(prev => prev.map(p => {
      try {
        const lp = createLpAsset(p.assetA, p.assetB);
        return {
          ...p,
          id: lp.toString().split(':')[1]
        };
      } catch (err) {
        return p;
      }
    }));
  }, []);

  // Recarregar os dados das pools ao alternar para a aba 'pools'
  useEffect(() => {
    if (activeTab === 'pools') {
      fetchPoolsData();
    }
  }, [activeTab]);

  // Ação de Depósito de Liquidez / Seed Pool
  const handleDepositLiquidity = async (poolIndex: number, isQuickSeed = false) => {
    if (!envResult) {
      addLog('Error: Please initialize your 1-Click Test Environment first to have active keys and funds.', 'error');
      alert('Por favor, crie seu ambiente de testes de 1-Clique na primeira aba para ter chaves e saldo!');
      return;
    }

    const pool = pools[poolIndex];
    const inputs = poolInputs[poolIndex] || { amountA: '1000', amountB: '1000', withdrawShares: '100' };
    const depA = isQuickSeed ? '5000' : inputs.amountA;
    const depB = isQuickSeed ? '5000' : inputs.amountB;

    setPoolsLoading(prev => ({ ...prev, [poolIndex]: true }));
    addLog(`Preparing liquidity deposit for ${pool.name} on-chain...`, 'info');

    try {
      const userKeypair = Keypair.fromSecret(envResult.secretKey);
      const userAddress = userKeypair.publicKey();

      // Carrega conta do usuário
      const account = await server.loadAccount(userAddress);
      const lpAsset = createLpAsset(pool.assetA, pool.assetB);
      const poolId = lpAsset.toString().split(':')[1];

      // Determina a correspondência correta das quantias com os ativos ordenados lexicograficamente
      const isOrdered = pool.assetA.isNative() || (!pool.assetB.isNative() && pool.assetA.getCode() < pool.assetB.getCode());
      const finalDepA = isOrdered ? depA : depB;
      const finalDepB = isOrdered ? depB : depA;
      
      let txBuilder = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: NETWORKS.TESTNET
      });

      // Adiciona trustline do Liquidity Pool Share (LPS) se necessário
      const hasLpTrust = account.balances.some((b: any) => 
        b.asset_type === 'liquidity_pool_shares' && b.liquidity_pool_id === poolId
      );

      if (!hasLpTrust) {
        addLog(`Adding ChangeTrust operation for Liquidity Pool Shares (LPS)...`, 'info');
        txBuilder = txBuilder.addOperation(Operation.changeTrust({ asset: lpAsset, limit: '1000000000' }));
      }

      // Adiciona operação de depósito
      addLog(`Adding LiquidityPoolDeposit operation (A: ${finalDepA}, B: ${finalDepB})...`, 'info');
      txBuilder = txBuilder.addOperation(Operation.liquidityPoolDeposit({
        liquidityPoolId: poolId,
        maxAmountA: finalDepA,
        maxAmountB: finalDepB,
        minPrice: '0.0001',
        maxPrice: '10000.0'
      }));

      const tx = txBuilder.setTimeout(30).build();
      tx.sign(userKeypair);

      addLog(`Submitting transaction to Stellar Horizon...`, 'info');
      const res = await server.submitTransaction(tx);
      addLog(`Successfully deposited liquidity into ${pool.name}! Tx Hash: ${res.hash.slice(0, 12)}...`, 'success');
      
      // Atualiza dados
      await fetchPoolsData();
    } catch (err: any) {
      console.error('[Pool Deposit Error]', err);
      let detail = err.message;
      if (err.response?.data?.extras?.result_codes) {
        const codes = err.response.data.extras.result_codes;
        const opCodes = codes.operations ? ` operations=${codes.operations.join(', ')}` : '';
        detail += ` (Codes: transaction=${codes.transaction}${opCodes})`;
      }
      addLog(`Failed to deposit liquidity: ${detail}`, 'error');
    } finally {
      setPoolsLoading(prev => ({ ...prev, [poolIndex]: false }));
    }
  };

  // Ação de Retirada de Liquidez
  const handleWithdrawLiquidity = async (poolIndex: number) => {
    if (!envResult) {
      addLog('Error: Please initialize your 1-Click Test Environment first to have active keys and funds.', 'error');
      alert('Por favor, crie seu ambiente de testes de 1-Clique na primeira aba para ter chaves e saldo!');
      return;
    }

    const pool = pools[poolIndex];
    const inputs = poolInputs[poolIndex] || { amountA: '1000', amountB: '1000', withdrawShares: '100' };
    const sharesToBurn = inputs.withdrawShares;

    setPoolsLoading(prev => ({ ...prev, [poolIndex]: true }));
    addLog(`Preparing liquidity withdrawal from ${pool.name} on-chain...`, 'info');

    try {
      const userKeypair = Keypair.fromSecret(envResult.secretKey);
      const userAddress = userKeypair.publicKey();

      // Carrega conta do usuário
      const account = await server.loadAccount(userAddress);
      const lpAsset = createLpAsset(pool.assetA, pool.assetB);
      const poolId = lpAsset.toString().split(':')[1];
      
      let txBuilder = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: NETWORKS.TESTNET
      });

      // Adiciona operação de saque
      addLog(`Adding LiquidityPoolWithdraw operation (Shares: ${sharesToBurn})...`, 'info');
      txBuilder = txBuilder.addOperation(Operation.liquidityPoolWithdraw({
        liquidityPoolId: poolId,
        amount: sharesToBurn,
        minAmountA: '0.0001',
        minAmountB: '0.0001'
      }));

      const tx = txBuilder.setTimeout(30).build();
      tx.sign(userKeypair);

      addLog(`Submitting transaction to Stellar Horizon...`, 'info');
      const res = await server.submitTransaction(tx);
      addLog(`Successfully withdrew ${sharesToBurn} shares from ${pool.name}! Tx Hash: ${res.hash.slice(0, 12)}...`, 'success');
      
      // Atualiza dados
      await fetchPoolsData();
    } catch (err: any) {
      console.error('[Pool Withdraw Error]', err);
      let detail = err.message;
      if (err.response?.data?.extras?.result_codes) {
        const codes = err.response.data.extras.result_codes;
        const opCodes = codes.operations ? ` operations=${codes.operations.join(', ')}` : '';
        detail += ` (Codes: transaction=${codes.transaction}${opCodes})`;
      }
      addLog(`Failed to withdraw liquidity: ${detail}`, 'error');
    } finally {
      setPoolsLoading(prev => ({ ...prev, [poolIndex]: false }));
    }
  };

  // Ação de Swap na Pool
  const handleSwapLiquidity = async (poolIndex: number) => {
    if (!envResult) {
      addLog('Error: Please initialize your 1-Click Test Environment first to have active keys and funds.', 'error');
      alert('Por favor, crie seu ambiente de testes de 1-Clique na primeira aba para ter chaves e saldo!');
      return;
    }

    const pool = pools[poolIndex];
    const inputs = poolInputs[poolIndex] || {};
    const amountIn = inputs.swapAmount || '10';
    const direction = inputs.swapDirection || 'AtoB';

    if (parseFloat(amountIn) <= 0) return;

    setPoolsLoading(prev => ({ ...prev, [poolIndex]: true }));
    addLog(`Preparing swap for ${pool.name} on-chain...`, 'info');

    try {
      const userKeypair = Keypair.fromSecret(envResult.secretKey);
      const userAddress = userKeypair.publicKey();

      const account = await server.loadAccount(userAddress);
      
      const assetIn = direction === 'AtoB' ? pool.assetA : pool.assetB;
      const assetOut = direction === 'AtoB' ? pool.assetB : pool.assetA;
      // Cálculo do AMM
      const amountInNum = parseFloat(amountIn);
      const isAtoB = direction === 'AtoB';
      const reserveIn = isAtoB ? parseFloat(pool.reservesA) : parseFloat(pool.reservesB);
      const reserveOut = isAtoB ? parseFloat(pool.reservesB) : parseFloat(pool.reservesA);
      
      const amountInWithFee = amountInNum * 0.997;
      const expectedOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
      const destMin = (expectedOut * 0.99).toFixed(7); // 1% slippage max

      let txBuilder = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: NETWORKS.TESTNET
      });

      // Se o asset de saída não for nativo, verificar trustline
      if (!assetOut.isNative()) {
        const outCode = assetOut.getCode();
        const hasOutTrust = account.balances.some((b: any) => 
          b.asset_code === outCode && b.asset_issuer === assetOut.getIssuer()
        );
        if (!hasOutTrust) {
          addLog(`Adding ChangeTrust operation for ${outCode}...`, 'info');
          txBuilder = txBuilder.addOperation(Operation.changeTrust({ asset: assetOut, limit: '1000000000' }));
        }
      }

      addLog(`Adding PathPaymentStrictSend (Send ${amountIn} ${assetIn.isNative() ? 'XLM' : assetIn.getCode()} -> receive min ${destMin} ${assetOut.isNative() ? 'XLM' : assetOut.getCode()})...`, 'info');
      txBuilder = txBuilder.addOperation(Operation.pathPaymentStrictSend({
        sendAsset: assetIn,
        sendAmount: amountIn,
        destAsset: assetOut,
        destMin: destMin,
        path: [],
        destination: userAddress
      }));

      const tx = txBuilder.setTimeout(30).build();
      tx.sign(userKeypair);

      addLog(`Submitting transaction to Stellar Horizon...`, 'info');
      const res = await server.submitTransaction(tx);
      addLog(`Successfully swapped! Tx Hash: ${res.hash.slice(0, 12)}...`, 'success');
      
      // Atualiza dados
      await fetchPoolsData();
    } catch (err: any) {
      console.error('[Pool Swap Error]', err);
      let detail = err.message;
      if (err.response?.data?.extras?.result_codes) {
        const codes = err.response.data.extras.result_codes;
        const opCodes = codes.operations ? ` operations=${codes.operations.join(', ')}` : '';
        detail += ` (Codes: transaction=${codes.transaction}${opCodes})`;
      }
      addLog(`Failed to swap: ${detail}`, 'error');
    } finally {
      setPoolsLoading(prev => ({ ...prev, [poolIndex]: false }));
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
                      <code className="tk-mono-text">{showSecret ? envResult.secretKey : 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢'}</code>
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
              
              {/* Resultado do Faucet */}
              {faucetError && (
                <div className="tk-badge mt-6" style={{ borderColor: 'rgba(255,50,50,0.5)', color: '#ff6666', background: 'rgba(255,50,50,0.1)' }}>
                  Error: {faucetError}
                  <div className="text-[10px] text-gray-400 mt-2">Dica: Verifique se você não esqueceu de criar a Trustline na aba One-Click Env (op_no_trust) ou certifique-se de que o endereço é válido e existe na rede!</div>
                </div>
              )}
              {faucetSuccess && (
                <div className="mt-6" style={{ background: 'rgba(0,255,153,0.05)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                  <div className="flex items-center gap-2 mb-3 text-[var(--accent)]">
                    <Check size={18} />
                    <h3 className="m-0 font-bold" style={{ color: 'var(--accent)', fontSize: '14px' }}>
                      Airdrop Success
                    </h3>
                  </div>
                  <div className="text-sm text-gray-300 mb-4">
                    Successfully requested <strong>{faucetSuccess.amount} {faucetSuccess.asset}</strong>.
                  </div>
                  <a href={`https://stellar.expert/explorer/testnet/tx/${faucetSuccess.hash}`} target="_blank" rel="noopener noreferrer" className="tk-primary-btn sm w-full justify-center" style={{ textDecoration: 'none', color: '#000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    View on Explorer <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LIQUIDITY POOLS */}
        {activeTab === 'pools' && (
          <div className="tk-main-card">
            <h3>Liquidity Pools de Teste (AMM)</h3>
            <p className="tk-card-desc">
              Pools de liquidez nativas da Stellar para testes de Swap sem slippage. Essas pools rodam on-chain e você pode interagir com elas depositando e retirando liquidez.
            </p>

            <div className="tk-pools-list">
              {pools.map((pool, index) => {
                const inputs = poolInputs[index] || { amountA: '1000', amountB: '1000', withdrawShares: '100' };
                const isLoading = poolsLoading[index] === true;

                // Cálculo em tempo real do Swap
                const amountInNum = parseFloat(inputs.swapAmount || '0');
                let expectedOut = 0;
                let executionPrice = 0;
                let impact = 0;
                
                if (amountInNum > 0 && parseFloat(pool.reservesA) > 0 && parseFloat(pool.reservesB) > 0) {
                  const isAtoB = (inputs.swapDirection || 'AtoB') === 'AtoB';
                  const reserveIn = isAtoB ? parseFloat(pool.reservesA) : parseFloat(pool.reservesB);
                  const reserveOut = isAtoB ? parseFloat(pool.reservesB) : parseFloat(pool.reservesA);
                  const amountInWithFee = amountInNum * 0.997;
                  expectedOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
                  
                  const spotPrice = reserveOut / reserveIn;
                  executionPrice = expectedOut / amountInNum;
                  impact = (1 - (executionPrice / spotPrice)) * 100;
                }

                return (
                  <div key={pool.name} className="tk-pool-item-rich">
                    <div className="tk-pool-header-rich">
                      <div className="tk-pool-name-rich">{pool.name}</div>
                      <div className="tk-pool-actions-quick">
                        <button
                          className={`tk-primary-btn sm ${isLoading ? 'loading' : ''}`}
                          onClick={() => handleDepositLiquidity(index, true)}
                          disabled={isLoading}
                          title="Deposita 5.000 unidades de cada ativo para inicializar/reabastecer a pool na hora!"
                        >
                          {isLoading ? <span className="tk-spinner" /> : <Zap size={12} />} Quick Seed (5,000 / 5,000)
                        </button>
                      </div>
                    </div>

                    {/* Liquidity Pool ID */}
                    <div className="tk-pool-id-box">
                      <span className="tk-result-lbl text-xs">Liquidity Pool ID (Hex)</span>
                      <div className="tk-copyable-value sm">
                        <code className="tk-mono-text text-xs break-all">{pool.id || 'Carregando ID determinístico...'}</code>
                        <button className="tk-icon-btn" onClick={() => copyToClipboard(pool.id, `${pool.name} Pool ID`)} title="Copy Pool ID">
                          {copiedText === `${pool.name} Pool ID` ? <Check size={12} color="#00ff99" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Reserves & Shares */}
                    <div className="tk-pool-reserves">
                      <div className="tk-reserve-card">
                        <span className="tk-pm-label">Reserva Ativo A</span>
                        <span className="tk-pm-value">{parseFloat(pool.reservesA).toLocaleString()} {pool.name.split(' / ')[0]}</span>
                      </div>
                      <div className="tk-reserve-card">
                        <span className="tk-pm-label">Reserva Ativo B</span>
                        <span className="tk-pm-value">{parseFloat(pool.reservesB).toLocaleString()} {pool.name.split(' / ')[1]}</span>
                      </div>
                      <div className="tk-reserve-card">
                        <span className="tk-pm-label">Total Pool Shares</span>
                        <span className="tk-pm-value">{parseFloat(pool.shares).toLocaleString()} LPS</span>
                      </div>
                    </div>

                    {/* Link Explorer */}
                    {pool.id && (
                      <div className="mb-4">
                        <a
                          href={`https://stellar.expert/explorer/testnet/liquidity-pool/${pool.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tk-exp-link text-xs inline-flex items-center gap-1 font-semibold"
                        >
                          View Pool on Stellar.Expert <ExternalLink size={10} />
                        </a>
                      </div>
                    )}

                    {/* Interactive Operations Panel */}
                    <div className="tk-pool-interactive-panel">
                      {/* Deposit Form */}
                      <div className="tk-pool-action-section">
                        <h5>Depositar Liquidez</h5>
                        <div className="tk-input-row">
                          <div className="tk-input-col">
                            <label className="text-xs text-gray-400">Qtd. {pool.name.split(' / ')[0]}</label>
                            <input
                              type="number"
                              className="tk-input-text sm"
                              value={inputs.amountA}
                              onChange={e => setPoolInputs(prev => ({
                                ...prev,
                                [index]: { ...inputs, amountA: e.target.value }
                              }))}
                              disabled={isLoading}
                            />
                          </div>
                          <div className="tk-input-col">
                            <label className="text-xs text-gray-400">Qtd. {pool.name.split(' / ')[1]}</label>
                            <input
                              type="number"
                              className="tk-input-text sm"
                              value={inputs.amountB}
                              onChange={e => setPoolInputs(prev => ({
                                ...prev,
                                [index]: { ...inputs, amountB: e.target.value }
                              }))}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        <button
                          className={`tk-sec-btn sm w-full mt-2 ${isLoading ? 'loading' : ''}`}
                          onClick={() => handleDepositLiquidity(index, false)}
                          disabled={isLoading}
                        >
                          {isLoading ? <span className="tk-spinner" /> : 'Deposit Liquidity'}
                        </button>
                      </div>

                      {/* Withdraw Form */}
                      <div className="tk-pool-action-section">
                        <h5>Retirar Liquidez</h5>
                        <div className="tk-input-col">
                          <label className="text-xs text-gray-400">Qtd. Shares a Queimar (LPS)</label>
                          <input
                            type="number"
                            className="tk-input-text sm font-mono"
                            value={inputs.withdrawShares}
                            onChange={e => setPoolInputs(prev => ({
                              ...prev,
                              [index]: { ...inputs, withdrawShares: e.target.value }
                            }))}
                            disabled={isLoading}
                          />
                        </div>
                        <button
                          className={`tk-sec-btn sm w-full mt-2 danger ${isLoading ? 'loading' : ''}`}
                          onClick={() => handleWithdrawLiquidity(index)}
                          disabled={isLoading}
                        >
                          {isLoading ? <span className="tk-spinner" /> : 'Withdraw Liquidity'}
                        </button>
                      </div>

                      {/* Swap Form */}
                      <div className="tk-pool-action-section" style={{ borderColor: 'rgba(0,255,153,0.3)', background: 'rgba(0,255,153,0.02)' }}>
                        <h5 style={{ color: 'var(--accent)' }}>Swap Nativo</h5>
                        <div className="tk-input-row" style={{ flexDirection: 'column', gap: '8px' }}>
                          <select 
                            className="tk-input-text sm" 
                            style={{ padding: '6px', cursor: 'pointer', background: 'rgba(0,0,0,0.4)', color: 'var(--accent)' }}
                            value={inputs.swapDirection || 'AtoB'}
                            onChange={e => setPoolInputs(prev => ({
                              ...prev,
                              [index]: { ...inputs, swapDirection: e.target.value }
                            }))}
                            disabled={isLoading}
                          >
                            <option value="AtoB">{pool.name.split(' / ')[0]} âž” {pool.name.split(' / ')[1]}</option>
                            <option value="BtoA">{pool.name.split(' / ')[1]} âž” {pool.name.split(' / ')[0]}</option>
                          </select>
                          <input
                            type="number"
                            className="tk-input-text sm font-mono"
                            placeholder={`You send: Qtd de ${inputs.swapDirection === 'BtoA' ? pool.name.split(' / ')[1] : pool.name.split(' / ')[0]}`}
                            value={inputs.swapAmount || ''}
                            onChange={e => setPoolInputs(prev => ({
                              ...prev,
                              [index]: { ...inputs, swapAmount: e.target.value }
                            }))}
                            disabled={isLoading}
                          />
                          <div className="text-[11px] bg-[rgba(0,0,0,0.2)] p-2 rounded border border-gray-800">
                            {amountInNum > 0 && expectedOut > 0 ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-gray-300">
                                  <span>Receive (~):</span>
                                  <strong className="text-[var(--accent)]">{expectedOut.toFixed(4)} {inputs.swapDirection === 'BtoA' ? pool.name.split(' / ')[0] : pool.name.split(' / ')[1]}</strong>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                  <span>Price Impact:</span>
                                  <span style={{ color: impact > 2 ? '#ff6666' : impact > 0.5 ? '#ffcc00' : 'inherit' }}>
                                    {impact.toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                  <span>Slippage Tol.:</span>
                                  <span>1.00%</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-500 text-center">Informe o valor para ver a estimativa da Pool.</div>
                            )}
                          </div>
                        </div>
                        <button
                          className={`tk-sec-btn sm w-full mt-2 ${isLoading ? 'loading' : ''}`}
                          onClick={() => handleSwapLiquidity(index)}
                          disabled={isLoading}
                          style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                        >
                          {isLoading ? <span className="tk-spinner" /> : 'Executar Swap'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                <div className={`tk-status-badge ${healthStatus.confidentialVerifier === 'soon' ? 'yellow' : 'green'}`}>
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
        .tk-pool-item-rich {
          background: rgba(255,255,255,0.02);
          border: 2px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          border-radius: var(--radius-lg);
          padding: 24px;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .tk-pool-header-rich {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 12px;
        }
        .tk-pool-name-rich {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .tk-pool-id-box {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: var(--radius-md);
          padding: 10px 14px;
        }
        .tk-pool-reserves {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .tk-reserve-card {
          background: rgba(255,255,255,0.01);
          border: 1px solid var(--border-subtle);
          padding: 12px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
        }
        .tk-pool-interactive-panel {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          border-top: 1px solid var(--border-subtle);
          padding-top: 16px;
          margin-top: 8px;
        }
        .tk-pool-action-section {
          background: rgba(0,0,0,0.15);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tk-pool-action-section h5 {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tk-input-row {
          display: flex;
          gap: 10px;
        }
        .tk-input-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .tk-input-text.sm {
          padding: 6px 10px;
          font-size: 12px;
        }
        .tk-sec-btn.sm.w-full {
          justify-content: center;
        }
        .tk-sec-btn.sm.danger {
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        .tk-sec-btn.sm.danger:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: #ef4444;
        }
        .tk-pool-actions-quick { display: flex; gap: 8px; }

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
