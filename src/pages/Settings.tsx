import { ArrowLeft, Camera, CheckCircle2, Copy, Loader2, ShieldAlert, ShieldCheck, UploadCloud, Mail, MessageCircle, ArrowDownLeft, ArrowUpRight, ArrowRight, RefreshCw, Coins, ExternalLink, Clock } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { supabase } from '../lib/supabase';
import { IdentityService } from '../services/identityService';
import { WalletFactory } from '../services/walletFactory';
import { OracleService } from '../services/oracleService';
import { StorageService } from '../services/storageService';
import ReceiveCryptoModal from '../components/modals/ReceiveCryptoModal';
import SwapModal from '../components/modals/SwapModal';
import OnChainSendModal from '../components/modals/OnChainSendModal';
import ImportWalletModal from '../components/modals/ImportWalletModal';

/**
 * Tela de Configurações e Identidade (The Trust Layer)
 * 
 * Esta tela foi aprimorada para demonstrar um fluxo de KYC (Know Your Customer) robusto.
 * O usuário preenche dados pessoais, verifica E-mail e WhatsApp, envia documentos e tira uma selfie.
 * Ao final, simulamos a geração de uma prova ZK-STARK (Zero-Knowledge Proof),
 * que garante a identidade do usuário na rede sem expor seus dados sensíveis.
 */
export default function Settings() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { activeAccount } = useWallet();

  // Máquina de estados para o status do KYC geral:
  // 'pending' = Aguardando preenchimento
  // 'processing' = Gerando a prova ZK-STARK (Spinner)
  // 'verified' = Concluído com sucesso
  const [kycStatus, setKycStatus] = useState<'pending' | 'processing' | 'verified'>('pending');
  // Guarda os dados de reprovação exatos (Vindo da IA Gemini)
  const [kycError, setKycError] = useState<string[] | null>(null);

  // Estados dos campos de texto básicos
  const [name, setName] = useState('João Silva');
  const [cpf, setCpf] = useState('123.456.789-00');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');

  // Estados para E-mail e WhatsApp e seus respectivos status de verificação
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'verified'>('idle');
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'sending' | 'verified'>('idle');

  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');

  // Estados dos módulos de documentação (Simulação de Upload/Selfie)
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [walletVersion, setWalletVersion] = useState<any | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string>('');

  // Estados PRO Mode (Carteira Web3)
  const [brzBalance, setBrzBalance] = useState<string>('0.00');
  const [brwBalance, setBrwBalance] = useState<string>('0.00');
  const [xlmBalance, setXlmBalance] = useState<string>('0.00');
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const [btcBalance, setBtcBalance] = useState<string>('0.00');
  const [tesouroBalance, setTesouroBalance] = useState<string>('0.00');
  const [cetesBalance, setCetesBalance] = useState<string>('0.00');
  const [ustbBalance, setUstbBalance] = useState<string>('0.00');
  const [xlmBrlPrice, setXlmBrlPrice] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Estados para os Modais Web3
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isOnChainSendOpen, setIsOnChainSendOpen] = useState(false);
  const [isSwapOpen, setIsSwapOpen] = useState(false);

  // Função isolada para poder recarregar no sucesso de um modal
  const fetchProModeBalance = async () => {
    if (!activeAccount?.stellar_public_key) return;
    setIsLoadingBalance(true);
    try {
      const [balances, brlPrice] = await Promise.all([
        WalletFactory.getBalances(activeAccount.stellar_public_key),
        OracleService.getXlmToBrlPrice()
      ]);
      if (balances) {
        setBrzBalance(balances.brz);
        setBrwBalance(balances.brw);
        setXlmBalance(balances.xlm);
        setUsdcBalance(balances.usdc);
        setBtcBalance(balances.btc);
        setTesouroBalance(balances.tesouro);
        setCetesBalance(balances.cetes);
        setUstbBalance(balances.ustb);
      }
      setXlmBrlPrice(brlPrice);
    } catch (e) {
      console.error("Falha ao carregar Web3 Pro Mode", e);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Efeito para carregar os saldos da Blockchain no Pro Mode
  useEffect(() => {
    fetchProModeBalance();
  }, [activeAccount?.stellar_public_key]);

  // Efeito para carregar os dados se o perfil já foi verificado ou rascunhados
  useEffect(() => {
    // 1. Se o usuário já passou do KYC na prova ZK
    if (profile?.kyc_verified) {
      setKycStatus('verified');
      setName(profile.full_name || '');
      setCpf(profile.cpf || '');
      setPhone(profile.whatsapp || '');
      setBirthDate(profile.birth_date || '');
      setAddress(profile.address || '');
      // Mock de verificações aprovadas
      setEmailStatus('verified');
      setPhoneStatus('verified');
      setDocumentUploaded(true);
      // Limpa qualquer rascunho salvo
      localStorage.removeItem('walletnow_kyc_draft');
    } else {
      // 2. O usuário AINDA não tem KYC preenchido.
      // Restaurar do LocalStorage se houver rascunho
      const savedDraft = localStorage.getItem('walletnow_kyc_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.name) setName(parsed.name);
          if (parsed.cpf) setCpf(parsed.cpf);
          if (parsed.birthDate) setBirthDate(parsed.birthDate);
          if (parsed.address) setAddress(parsed.address);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.phone) setPhone(parsed.phone);
        } catch (e) {
          console.error('Erro ao ler draft do localStorage', e);
        }
      }

      // Vamos verificar se ele já tem o e-mail validado pelo OAuth (Google Login) ou pelo próprio Supabase
      const checkEmailProvider = async () => {
        const { data: { user } } = await supabase.auth.getUser(); // Força update da rede
        if (user) {
          if (user.email_confirmed_at) {
            setEmailStatus('verified');
          }
        }
      };

      checkEmailProvider();
    }
  }, [profile]);

  // Salva no LocalStorage enquanto digita para não perder contexto na troca de abas
  useEffect(() => {
    if (kycStatus !== 'verified') {
      const draft = { name, cpf, birthDate, address, email, phone };
      localStorage.setItem('walletnow_kyc_draft', JSON.stringify(draft));
    }
  }, [name, cpf, birthDate, address, email, phone, kycStatus]);

  // Efeito de Polling: Se o usuário abrir o Magic Link em outra aba ou no celular,
  // verificamos constantemente na API se a confirmação ocorreu lá forçando o getUser()
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (emailStatus === 'sending') {
      intervalId = setInterval(async () => {
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (!error && user?.email_confirmed_at) {
            setEmailStatus('verified');
            clearInterval(intervalId);
          }
        } catch (e) {
          console.error("Poling de Email Falhou Silenciosamente", e);
        }
      }, 3000); // Bate na porta de 3 em 3 segundos
    }

    // [OTIMIZAÇÃO] Evitando Memory Leak: O React limpa o intervalo caso o usuário troque de página
    // enquanto o e-mail estava processando (Unmount).
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [emailStatus]);

  // Efeito para escutar o retorno mágico do Supabase caso seja na MESMA aba
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' && emailStatus === 'sending') {
        setEmailStatus('verified');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [emailStatus]);

  // Lógica simples de validação visual (Retorna true se o campo estiver preenchido corretamente)
  const isNameValid = name.length > 5;
  const isCpfValid = cpf.length >= 14; // Formato 000.000.000-00
  const isBirthDateValid = birthDate.length === 10; // Formato DD/MM/YYYY
  const isAddressValid = address.length > 10;
  const isEmailValid = email.includes('@') && email.includes('.');
  const isPhoneValid = phone.length >= 11;

  // O botão de verificar a identidade (ZK-STARK) só é habilitado se TODOS os campos,
  // verificações (email/whatsapp) e documentos estiverem válidos.
  const canSubmit = isNameValid && isCpfValid && isBirthDateValid && isAddressValid &&
    documentUploaded &&
    emailStatus === 'verified' && phoneStatus === 'verified';

  /**
   * Utilitário Criptográfico [Real-World]: Comprime imagens capturadas do celular para Base64 leve, 
   * evitando que a UI jogue imagens de 5MB+ que estouram a Memória/Rate Limit da API GEMINI e Cloud.
   */
  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Limitando a resolução da Imagem Documental/Selfie a no máximo HD (1280px)
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Comprime para JPEG com 70% de qualidade visual 
          // (Mantém o Liveness nítido para IA mas destrói o tamanho de arquivo)
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        // ... (rest of logic)
        setDocumentUploaded(true);
      } catch (err) {
        console.error('Erro ao comprimir imagem de KYC', err);
      }
    }
  };

  /**
   * Dispara o envio do OTP via Supabase Auth magic-link e-mail (MOCK)
   */
  const handleVerifyEmail = async () => {
    if (!isEmailValid) return;
    setEmailStatus('sending');
    
    // MOCK: Para evitar o Rate Limit do Supabase Free (Máximo de 2 emails por hora/dia)
    setTimeout(async () => {
      try {
        if (profile?.id) {
          // Salva o email direto no banco como se o usuário tivesse clicado no Magic Link
          await supabase.from('profiles').update({ email: email }).eq('id', profile.id);
        }
        setEmailStatus('verified');
        alert('MODO MOCK ATIVADO: E-mail verificado instantaneamente para contornar o limite restrito do Supabase Free Tier.');
      } catch (err: any) {
        console.error('Erro no Mock de Email:', err);
        setEmailStatus('idle');
      }
    }, 1500);
  };

  /**
   * Envio de código de verificação para o WhatsApp (MOCK para pular bloqueio Twilio Free)
   */
  const handleVerifyPhone = async () => {
    if (!isPhoneValid) return;
    setPhoneStatus('sending');

    // MOCK: Simular o carregamento e mostrar um OTP de teste em vez de bater na API restrita
    setTimeout(() => {
      setPhoneStatus('idle');
      setShowPhoneOtp(true);
      alert('MODO MOCK ATIVADO: Como o Twilio Trial bloqueia números não verificados, use o código "123456" para aprovar este WhatsApp.');
    }, 1500);
  };

  const handleConfirmPhoneOtp = async () => {
    if (phoneOtp.length < 6) return;

    // MOCK: Validar o código fake "123456"
    if (phoneOtp !== '123456') {
      alert('Token OTP de WhatsApp Inválido. No Modo Mock, use "123456".');
      return;
    }

    try {
      // O OTP (Mock) validou. Precisamos garantir que este número seja
      // salvo no Perfil do Banco de Dados imediatamente, para não sumir no F5
      // antes do usuário enviar o formulário ZK completo.
      if (profile?.id) {
        await supabase.from('profiles').update({ whatsapp: phone.replace(/\D/g, '') }).eq('id', profile.id);
      }

      setPhoneStatus('verified');
      setShowPhoneOtp(false);
    } catch (err: any) {
      console.error(err);
      alert('Erro Crítico ao atualizar o perfil com o WhatsApp simulado.');
    }
  };

  /**
   * Função que Processa a auditoria e Criptografa na Blockchain (ZK-STARK)
   */
  const handleVerify = async () => {
    if (!canSubmit || !profile) return;

    setKycError(null);
    setKycStatus('processing');

    try {
      // ... (Implementation detail)
      setKycStatus('verified');
    } catch (err: any) {
      console.error('❌ Falha na Camada de KYC ZK-STARK:', err.message);
      setKycStatus('pending'); // Rebote para o usuário conseguir tentar novamente
    }
  };

  /**
   * Função utilitária APENAS PARA DESENVOLVIMENTO para limpar os testes da Blockchain
   */
  const handleResetKyc = async () => {
    if (!profile) return;
    const confirmReset = window.confirm("Isso irá apagar sua assinatura KYC e Proof Hash do banco de dados permitindo você testar o fluxo ZK/OCR novamente. Confirma?");
    if (!confirmReset) return;
    setKycStatus('processing');
    try {
      await supabase
        .from('profiles')
        .update({
          kyc_verified: false,
          kyczk_hash: null
        })
        .eq('id', profile.id);

      setKycStatus('pending');
      setKycError(null);
      setEmailStatus('idle');
      setPhoneStatus('idle');
      setDocumentUploaded(false);
      alert('Selo revogado! Você pode reiniciar a simulação preenchendo o fluxo novamente.');
    } catch (err: any) {
      console.error('Erro ao resetar ambiente de teste KYC:', err);
      setKycStatus(profile.kyc_verified ? 'verified' : 'pending');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] animate-in slide-in-from-right-8 duration-300">

      {/* Cabeçalho com botão de Voltar */}
      <header className="px-6 pt-8 pb-6 flex items-center gap-4 border-b border-white/5">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 bg-[#161616] rounded-full text-gray-400 hover:text-white border border-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-white">Configurações</h1>
      </header>

      <div className="flex-1 p-6 space-y-8 pb-24">

        {/* Seção 1: Identidade (KYC) */}
        <section>
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-sm text-gray-400 font-medium uppercase tracking-wider mt-1">Identidade (KYC)</h2>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleResetKyc}
                disabled={kycStatus === 'processing'}
                className="text-[10px] text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2 py-1.5 rounded border border-red-500/20 transition-colors uppercase font-bold tracking-wider disabled:opacity-50"
              >
                Resetar Dados (Teste) ↻
              </button>
              {kycStatus === 'verified' ? (
                <span className="flex items-center gap-1 text-xs font-medium text-[#00E676] bg-[#00E676]/10 px-2.5 py-1 rounded-full border border-[#00E676]/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verificado (ZK)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-[#F27D26] bg-[#F27D26]/10 px-2.5 py-1 rounded-full border border-[#F27D26]/20">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Pendente
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#161616] rounded-[24px] p-6 border border-white/5 shadow-lg">
            {kycStatus === 'verified' && (
              <div className="mb-6 p-4 bg-[#00E676]/10 border border-[#00E676]/20 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in duration-500">
                <ShieldCheck className="w-5 h-5 text-[#00E676] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#00E676]">Identidade Validada</p>
                  <p className="text-xs text-[#00E676]/80 mt-1">Dados criptografados e validados na rede via prova ZK-STARK.</p>
                </div>
              </div>
            )}

            <div className="space-y-5 mb-8">
              {/* Fields ... */}
            </div>

            {/* ERROR BOX */}
            {kycError && kycError.length > 0 && (
              <div className="mb-6 p-4 bg-[#161616] border border-white/5 shadow-inner rounded-xl">
                 <p>A Inteligência Artificial encontrou divergências.</p>
              </div>
            )}

            {kycStatus !== 'verified' && (
              <button
                onClick={handleVerify}
                disabled={!canSubmit || kycStatus === 'processing'}
                className="w-full flex items-center justify-center gap-2 bg-[#00E676] hover:bg-[#00E676]/90 text-black py-4 rounded-xl font-bold transition-all duration-300 disabled:opacity-50"
              >
                {kycStatus === 'processing' ? 'Gerando prova criptográfica ZK-STARK...' : 'Verificar Identidade'}
              </button>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm text-gray-400 font-medium uppercase tracking-wider flex items-center gap-2">
              Carteira Web3 <span className="text-[10px] bg-[#00E676]/20 text-[#00E676] px-2 py-0.5 rounded uppercase font-bold tracking-widest border border-[#00E676]/30">Pro Mode</span>
            </h2>
          </div>

          <div className="bg-[#161616] rounded-[24px] p-6 border border-white/5 shadow-lg space-y-6">
            {/* Balanços ... */}
            <div className="flex items-center justify-between bg-black/30 border border-white/5 p-4 rounded-xl border-l-[#00E676]/30 border-l-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-[#00E676]/20 bg-[#00E676]/5 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#00E676]">BRW</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">WalletNow Real</p>
                  <p className="text-[10px] text-gray-500">Operational Asset (Native)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{isLoadingBalance ? '...' : parseFloat(brwBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-[#00E676]">WalletNow (Issuer)</p>
              </div>
            </div>

            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="w-full flex items-center justify-between p-4 bg-[#111] hover:bg-[#1a1a1a] rounded-xl border border-white/5 transition-all mb-4 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20">
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">Importar Carteira Existente</p>
                  <p className="text-[10px] text-gray-500">Adicione contas usando Seed Phrase ou Secret Key</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
            </button>

            {parseFloat(usdcBalance) > 0 && (
              <div className="flex items-center justify-between bg-black/30 border border-white/5 p-4 rounded-xl">
                 {/* ... */}
              </div>
            )}
          </div>
        </section>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/');
          }}
          className="w-full py-4 text-red-500 font-medium hover:bg-red-500/10 rounded-2xl transition-colors"
        >
          Sair da Conta
        </button>
      </div>

      {/* Modais do Pro Mode */}
      <ImportWalletModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchProModeBalance();
        }}
      />
      <ReceiveCryptoModal isOpen={isReceiveOpen} onClose={() => setIsReceiveOpen(false)} />
      <SwapModal isOpen={isSwapOpen} onClose={() => setIsSwapOpen(false)} onSuccess={fetchProModeBalance} />
      <OnChainSendModal
        isOpen={isOnChainSendOpen}
        onClose={() => setIsOnChainSendOpen(false)}
        onSuccess={fetchProModeBalance}
      />
    </div>
  );
}
