import { ArrowDownLeft, ArrowUpRight, History, Settings as SettingsIcon, Wallet, ShieldCheck, Award, Loader2, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DepositModal from '../components/modals/DepositModal';
import SendModal from '../components/modals/SendModal';
import SacarModal from '../components/modals/SacarModal';
import WithdrawModal from '../components/modals/WithdrawModal';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { WalletFactory } from '../services/walletFactory';
import { logger } from '../utils/logger';
import { DemoConfig } from '../config/demoMode';
import { EtherfuseActivityService, EfV2Activity } from '../services/providers/etherfuseV2/etherfuseActivityService';
import AccountSwitcher from '../components/wallet/AccountSwitcher';

/**
 * Dashboard Principal — The Money Layer
 *
 * Tela central do aplicativo. Exibe o saldo on-chain da conta ativa (XLM nativo como principal),
 * histórico de transações Stellar, seção de Tokenized Treasury (Etherfuse BRT),
 * e botões de ação para depósito PIX, saque e off-ramp via Anchor.
 *
 * A UI usa XLM como ativo de saldo primário e exibe USDC/BRW como ativos secundários,
 * escondendo a complexidade da rede Stellar do usuário final.
 *
 * GUARDS DE RUNTIME:
 * - Aguarda walletLoading=false antes de abortar (evita race condition de provisionamento).
 * - activeAccount vem do WalletContext (suporta conta legada, importada e gerada).
 */
export default function Dashboard() {
  const navigate = useNavigate();
  // Consumindo dados do Usuário Logado e seu Profile (que contem o endereco Stellar e Dados de KYC)
  const { user, profile } = useAuth();
  const { activeAccount, loading: walletLoading } = useWallet();

  // Prioriza o nome validado no KYC, fazendo fallback para o email ou 'Usuário' genérico
  const userFirstName = profile?.full_name
    ? profile.full_name.split(' ')[0]
    : (user?.email ? user.email.split('@')[0] : 'Usuário');

  // Estados (State) para controlar se os modais (janelas sobrepostas) estão abertos ou fechados.
  // 'false' significa que começam fechados.
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isSacarOpen, setIsSacarOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Estados de Saldo (Extraídos do Blockchain via Stellar Horizon)
  const [totalBalance, setTotalBalance] = useState<string>('0.00');
  const [assetDetails, setAssetDetails] = useState<{ brz: string, brw: string, usdc: string, tesouro: string, cetes: string, ustb: string, xlm: string }>({ brz: '0.00', brw: '0.00', usdc: '0.00', tesouro: '0.00', cetes: '0.00', ustb: '0.00', xlm: '0.00' });
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isAccountActive, setIsAccountActive] = useState<boolean | null>(null); // null = checking, false = 404
  const [isActivating, setIsActivating] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [ef2Activities, setEf2Activities] = useState<EfV2Activity[]>([]);

  const fetchOnChainBalance = async () => {
    console.log('[Dashboard] fetchOnChainBalance: START. activeAccount:', activeAccount?.stellar_public_key);
    if (!activeAccount?.stellar_public_key) {
      console.log('[Dashboard] fetchOnChainBalance: ABORTED (no activeAccount public key)');
      if (!walletLoading) {
        setIsLoadingBalance(false);
      }
      return;
    }
    setIsLoadingBalance(true);

    try {
      logger.info('[WalletNow][UI]', 'Fetching On-Chain balance and history', { address: activeAccount.stellar_public_key });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), DemoConfig.hardTimeoutMs)
      );

      // Busca Blockchain (Saldo BRZ & Histórico) com Hard Timeout
      const [balances, history] = await Promise.race([
        Promise.all([
          WalletFactory.getBalances(activeAccount.stellar_public_key),
          WalletFactory.getHistory(activeAccount.stellar_public_key)
        ]),
        timeoutPromise
      ]) as any;

      if (balances) {
        setIsAccountActive(true);
        setAssetDetails({ brz: balances.brz, brw: balances.brw, usdc: balances.usdc || '0.00', tesouro: balances.tesouro, cetes: balances.cetes, ustb: balances.ustb, xlm: balances.xlm || '0.00' });
        // XLM Nativo é o ativo principal agora.
        const totalXlm = parseFloat(balances.xlm || '0');
        setTotalBalance(totalXlm.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 7 }));
        console.log('[Dashboard] fetchOnChainBalance: SUCCESS (balances loaded)');
      } else {
        console.log('[Dashboard] fetchOnChainBalance: WARNING (balances null, trying emergency activation)');
        // Se balances for null (404), tentamos ativar
        setIsAccountActive(false);
        handleEmergencyActivation();
      }
      if (history) {
        console.log('[Dashboard] fetchOnChainBalance: SUCCESS (history loaded, length:', history.length, ')');
        setTransactions(history);
      }
      setEf2Activities(EtherfuseActivityService.getActivities(activeAccount.stellar_public_key));
    } catch (e: any) {
      if (e.message === 'TIMEOUT') {
        logger.error('[WalletNow][System]', 'Dashboard timeout on fetch balance');
      } else {
        logger.error('[WalletNow][UI]', 'Error fetching balance', e);
      }

      if (e.message?.includes('404')) {
        setIsAccountActive(false);
      }
    } finally {
      setIsLoadingBalance(false);
    }
  };

  /**
   * Ativação de Emergência via Sponsor
   */
  const handleEmergencyActivation = async () => {
    if (!activeAccount?.stellar_public_key || isActivating || isAccountActive) return;

    setIsActivating(true);
    try {
      logger.info('[WalletNow][Blockchain]', 'Iniciando ativação automática (emergency)');
      const success = await WalletFactory.activateAccount(activeAccount.stellar_public_key);
      if (success) {
        logger.info('[WalletNow][Blockchain]', 'Ativação automática concluída');
        setIsAccountActive(true);
        // Pequeno delay para o Horizon indexar antes de atualizar saldos
        setTimeout(fetchOnChainBalance, 2000);
      }
    } catch (err: any) {
      logger.error('[WalletNow][Blockchain]', 'Erro na ativação automática', err);
    } finally {
      setIsActivating(false);
    }
  };

  // Efeito Executado na montagem da tela ou quando a conta ativa muda
  useEffect(() => {
    fetchOnChainBalance();
  }, [activeAccount?.stellar_public_key, walletLoading]);

  // Transações On-Chain alimentam o State `transactions`

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] animate-in fade-in duration-500">

      {/* Cabeçalho (Header) */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center relative z-50">
        <div className="flex items-center gap-3">
          {/* Account Switcher substitui o Ícone da Carteira Simples */}
          <AccountSwitcher />
        </div>

        <div className="flex items-center gap-3">
          {/* Saudação ao Usuário */}
          <div className="hidden sm:block text-right mr-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">WalletNow</p>
            <p className="text-sm text-white font-semibold capitalize">Olá, {userFirstName}</p>
          </div>

          {/* Botão de Configurações (Leva para a tela de KYC/Settings) */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2.5 bg-[#161616] rounded-full text-gray-400 hover:text-white border border-white/5 transition-colors shadow-lg"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Card Principal de Saldo */}
      <div className="px-6 py-4">
        <div className="bg-gradient-to-br from-[#161616] to-[#0A0A0A] rounded-[32px] p-8 border border-white/5 shadow-2xl relative overflow-hidden">

          {/* Efeito visual de brilho (Glow) no canto superior direito do card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E676]/10 rounded-full blur-3xl"></div>

          <p className="text-sm text-gray-400 font-medium mb-2">Saldo Disponível</p>

          {/* Exibição do Saldo (Sempre formatado em R$) */}
          <div className="flex flex-col mb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl text-gray-500 font-semibold">XLM</span>
              {isLoadingBalance ? (
                <div className="flex items-center text-gray-600 gap-2 h-12">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col">
                  <h2 className="text-5xl font-bold text-white tracking-tight">{totalBalance}</h2>
                  <div className="flex gap-3 mt-2">
                    {parseFloat(assetDetails.usdc) > 0 && (
                      <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/20">
                        USDC: {parseFloat(assetDetails.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    {parseFloat(assetDetails.brw) > 0 && (
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                        BRW: {parseFloat(assetDetails.brw).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    {parseFloat(assetDetails.brz) > 0 && (
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                        BRZ: {parseFloat(assetDetails.brz).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação Principais */}
          <div className="flex gap-4">
            {/* Botão Depositar: Abre o modal de PIX */}
            <button
              onClick={() => setIsDepositOpen(true)}
              disabled={isLoadingBalance || isAccountActive === false || isActivating}
              className="flex-1 flex items-center justify-center gap-2 bg-[#00E676] hover:bg-[#00E676]/90 text-black py-3.5 rounded-2xl font-bold transition-colors shadow-[0_0_15px_rgba(0,230,118,0.2)] disabled:opacity-50 disabled:grayscale transition-all"
            >
              {isActivating || (isAccountActive === false && isLoadingBalance) ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowDownLeft className="w-5 h-5" />
              )}
              {isActivating ? 'Ativando...' : (isAccountActive === false ? 'Configurando...' : 'Depositar')}
            </button>

            <button
              onClick={() => setIsSacarOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white py-3.5 rounded-2xl font-semibold transition-colors border border-white/5"
            >
              <ArrowUpRight className="w-5 h-5" />
              Sacar BRW
            </button>

            {/* Botão Off-Ramp: Saque de XLM via Anchor SEP-24 */}
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-3.5 rounded-2xl font-semibold transition-colors border border-blue-500/20"
            >
              <ArrowUpRight className="w-5 h-5" />
              Off-Ramp XLM
            </button>
          </div>
        </div>
      </div>



      {/* Seção Treasury Assets (Etherfuse RWA) */}
      <div className="px-6 py-2">
        <div className="bg-gradient-to-br from-[#0F172A] to-[#020617] rounded-3xl p-6 border border-slate-800 shadow-[0_10px_40px_-15px_rgba(15,23,42,0.8)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-all duration-700"></div>

          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-700 shadow-inner">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-blue-400 font-mono tracking-widest uppercase">Tokenized Treasury</p>
                <h3 className="text-white font-bold tracking-tight">Brazilian Real Treasury</h3>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">BRT</span>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Treasury Balance</p>
              {isLoadingBalance ? (
                <div className="h-8 flex items-center">
                  <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg text-slate-500 font-semibold">R$</span>
                  <span className="text-3xl font-bold text-white tracking-tight">{(parseFloat(assetDetails.tesouro || '0') || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold mb-1">Est. APY</p>
              <span className="text-sm font-bold text-blue-300">~ 10.4%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de On/Off Ramp Activity (Etherfuse V2) */}
      <div className="px-6 py-4">
        <h3 className="text-lg font-semibold text-white mb-4">On/Off Ramp Activity</h3>
        <div className="bg-[#161616] rounded-2xl p-4 border border-white/5 shadow-lg">
          <div className="space-y-4">
            {ef2Activities.length > 0 ? (
              ef2Activities.map((act, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      {act.type === 'BUY TESOURO' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{act.type}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        Status: <span className="text-emerald-400 capitalize">{act.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{parseFloat(act.amountToken).toFixed(6)} {act.asset}</p>
                    <p className="text-[10px] text-slate-400">R$ {parseFloat(act.amountBRL).toFixed(2)}</p>
                    {act.txHash !== 'Pendente' ? (
                      <a href={`https://stellar.expert/explorer/testnet/tx/${act.txHash}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-500 hover:text-white transition-colors mt-1 inline-block">
                        Explorer ↗
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-600 mt-1 inline-block">Hash Pendente</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">Nenhuma atividade de On/Off Ramp recente.</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Histórico de Transações */}
      <div className="flex-1 px-6 pt-6 pb-24 bg-[#0A0A0A]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Histórico Recente</h3>
          <button className="text-sm text-[#00E676] hover:text-[#00E676]/80 font-medium flex items-center gap-1">
            <History className="w-4 h-4" />
            Ver tudo
          </button>
        </div>

        {/* Lista de Transações (Renderizando o array 'transactions' On-Chain) */}
        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <a
                key={tx.id}
                href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-[#161616] rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${tx.type === 'deposit' ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-white/5 text-white'}`}>
                    {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-white font-medium flex items-center gap-2">
                      {tx.title}
                      <span className="text-[9px] px-1.5 py-0.5 bg-white/10 rounded text-gray-400 font-bold uppercase">{tx.assetCode}</span>
                    </p>
                    <p className="text-xs text-gray-500 flex flex-col">
                      <span>{tx.date}</span>
                      {tx.correlationID && (
                        <span className="text-[10px] text-[#00E676]/60 font-mono mt-0.5">X402: {tx.correlationID}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.type === 'deposit' ? 'text-[#00E676]' : 'text-white'}`}>
                    {tx.amount}
                  </p>
                  <p className="text-[10px] text-gray-600 font-medium group-hover:text-[#00E676] transition-colors">Ver On-Chain ↗</p>
                </div>
              </a>
            ))
          ) : (
            <div className="text-center py-8">
              {isLoadingBalance ? (
                <Loader2 className="w-5 h-5 text-gray-500 animate-spin mx-auto" />
              ) : (
                <p className="text-sm text-gray-500">Nenhuma transação encontrada na sua carteira.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Painel QA / Debug Mode */}
      <div className="px-6 py-2">
        <div className="bg-[#111] rounded-2xl p-4 border border-dashed border-[#333] font-mono text-xs text-gray-400">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#222]">
            <span className="text-[#00E676] font-bold">QA / Debug Mode</span>
            <span className="text-gray-500">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="space-y-1">
            <p><strong>Conta Ativa:</strong> {activeAccount?.label || 'N/A'} ({activeAccount?.account_type || '?'})</p>
            <p><strong>Public Key:</strong> {activeAccount?.stellar_public_key ? `${activeAccount.stellar_public_key.slice(0, 8)}...${activeAccount.stellar_public_key.slice(-4)}` : 'N/A'}</p>
            <p><strong>Horizon:</strong> {isAccountActive ? '✅ Conta Ativa' : 'Verificando...'}</p>
            <p><strong>XLM:</strong> {assetDetails.xlm} | <strong>USDC:</strong> {assetDetails.usdc} | <strong>BRW:</strong> {assetDetails.brw}</p>
          </div>
        </div>
      </div>

      {/* Seção de NFTs / Identidade ZK */}
      {profile?.kyc_verified && (
        <div className="px-6 pb-24 bg-[#0A0A0A]">
          <h3 className="text-lg font-semibold text-white mb-6">Ativos Digitais (NFTs)</h3>

          {/* Card Interativo: Leva para o Explorer da Transação na Blockchain */}
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${profile.kyczk_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-[#161616] to-[#0A0A0A] p-5 rounded-2xl border border-[#00E676]/20 relative overflow-hidden flex items-center gap-4 group hover:border-[#00E676]/40 text-left transition-colors cursor-pointer shadow-lg shadow-[#00E676]/5 block"
          >
            {/* Efeito visual de brilho no card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E676]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#00E676]/20 transition-all"></div>

            <div className="w-14 h-14 rounded-xl bg-[#00E676]/10 flex flex-shrink-0 items-center justify-center border border-[#00E676]/30">
              <ShieldCheck className="w-7 h-7 text-[#00E676]" />
            </div>

            <div className="flex-1 w-full overflow-hidden">
              <p className="text-xs text-[#00E676] font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
                KYCZK Token <Award className="w-3.5 h-3.5" />
              </p>
              <p className="text-white font-medium text-sm">Selo de Identidade ZK-STARK</p>
              {profile.kyczk_hash && (
                <p className="text-xs text-gray-500 mt-1 truncate" title={`Ver no Explorer: ${profile.kyczk_hash}`}>
                  Hash: {profile.kyczk_hash}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 text-gray-600 group-hover:text-[#00E676] transition-colors">
              <ArrowUpRight className="w-5 h-5 opacity-50 group-hover:opacity-100" />
            </div>
          </a>
        </div>
      )}

      {/* Renderização dos Modais 
          Eles ficam "escondidos" no código e só aparecem quando os estados 
          isDepositOpen ou isSendOpen se tornam 'true'.
          Passamos a função onClose para que o modal saiba como se fechar.
      */}
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} onSuccess={fetchOnChainBalance} />
      <SacarModal
        isOpen={isSacarOpen}
        onClose={() => setIsSacarOpen(false)}
        onSuccess={fetchOnChainBalance}
        brwBalance={parseFloat(assetDetails.brw).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} onSuccess={fetchOnChainBalance} />
      <SendModal isOpen={isSendOpen} onClose={() => setIsSendOpen(false)} onSuccess={fetchOnChainBalance} />

    </div>
  );
}
