import { X, Copy, QrCode, CheckCircle2, Loader2, Zap, ExternalLink, CreditCard, Globe, ChevronRight, ShieldCheck, AlertCircle, TrendingUp, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PaymentService } from '../../services/paymentService';
import { WalletFactory } from '../../services/walletFactory';
import { WooviService } from '../../services/wooviService';
import { availableProviders, IDepositProvider } from '../../services/providers';
import { logger } from '../../utils/logger';
import { DemoConfig } from '../../config/demoMode';
import { EtherfuseTrustlineService, TrustlineResult } from '../../services/providers/etherfuse/etherfuseTrustlineService';
import { EtherfuseAssetConfig } from '../../services/providers/etherfuse/etherfuseAssetConfig';
import { EtherfuseOnRampService, EtherfuseQuoteResult, EtherfuseOrderResult, SANDBOX_CONTAMINATION_ERROR, PROXY_ACCOUNT_NOT_PROVISIONED_ERROR } from '../../services/providers/etherfuse/etherfuseOnRampService';
import { StellarTestAnchorService } from '../../services/providers/stellarTestAnchor/stellarTestAnchorService';
import { EtherfuseV2ApiService, EfV2HttpError } from '../../services/providers/etherfuseV2/etherfuseV2ApiService';
import { EtherfusePersistenceService } from '../../services/providers/etherfuseV2/etherfusePersistenceService';
import { EtherfuseActivityService } from '../../services/providers/etherfuseV2/etherfuseActivityService';
import type { EfV2QuoteResult, EfV2OrderResult } from '../../services/providers/etherfuseV2/etherfuseV2Types';


// Define quais propriedades (props) este componente espera receber.
interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
  const { profile } = useAuth();

  // Phases do experimento KYC-First (fluxo hospedado Etherfuse)
  const [phase, setPhase] = useState<
    | 'provider_selection'
    // ── Etherfuse V1 (KYC hospedado — intacto) ────────────────────────────────
    | 'etherfuse_preview'
    | 'etherfuse_customer_creation'
    | 'etherfuse_kyc_form'
    | 'etherfuse_kyc_polling'
    | 'etherfuse_financial_onboarding'
    | 'etherfuse_quote'
    | 'etherfuse_order'
    | 'etherfuse_settling'
    | 'etherfuse_done'
    // ── Etherfuse V2 (KYC programático — fluxo validado) ─────────────────────
    | 'ef2_preview'
    | 'ef2_trustline'
    | 'ef2_customer_creation'
    | 'ef2_kyc_submitting'
    | 'ef2_kyc_polling'
    | 'ef2_pix_registration'
    | 'ef2_quote'
    | 'ef2_order'
    | 'ef2_settling'
    | 'ef2_done'
    | 'ef2_error'
    // ── Woovi / BRW ───────────────────────────────────────────────────────────
    | 'input'
    | 'generating'
    | 'waiting_payment'
    | 'minting'
    | 'success'
  >('provider_selection');
  const [isSimulating, setIsSimulating] = useState(false);
  const [trustlineResult, setTrustlineResult] = useState<TrustlineResult | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<IDepositProvider | null>(null);
  // Etherfuse on-ramp states
  const [efAmount, setEfAmount] = useState('50');
  const [efStatusLabel, setEfStatusLabel] = useState('');
  const [efQuote, setEfQuote] = useState<EtherfuseQuoteResult | null>(null);
  const [efOrder, setEfOrder] = useState<EtherfuseOrderResult | null>(null);
  const [efCustomerId, setEfCustomerId] = useState('');
  const [efBankAccountId, setEfBankAccountId] = useState('');
  const [efKycUrl, setEfKycUrl] = useState('');
  // ── Estados do Etherfuse V2 (fluxo programático) ───────────────────────────
  const [ef2Amount, setEf2Amount] = useState('50');
  const [ef2StatusLabel, setEf2StatusLabel] = useState('');
  const [ef2Quote, setEf2Quote] = useState<EfV2QuoteResult | null>(null);
  const [ef2Order, setEf2Order] = useState<EfV2OrderResult | null>(null);
  const [ef2CustomerId, setEf2CustomerId] = useState('');
  const [ef2ErrorMsg, setEf2ErrorMsg] = useState('');
  // EXPERIMENTO: sem efInitialBankAccountId — sem fallback de UUID fake

  // Dados Inputados e Retornados
  const [amount, setAmount] = useState('');
  const [pixData, setPixData] = useState<{ brCode: string, correlationID: string, amount: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [ef2TxHash, setEf2TxHash] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhase('provider_selection');
      setSelectedProvider(null);
      setAmount('');
      setPixData(null);
      setTrustlineResult(null);
      setEfQuote(null);
      setEfOrder(null);
      setEfStatusLabel('');
      // Reset V2
      setEf2Quote(null);
      setEf2Order(null);
      setEf2StatusLabel('');
      setEf2CustomerId('');
      setEf2ErrorMsg('');
      setEf2TxHash(null);
    }
  }, [isOpen]);

  /**
   * [Experiment] FASE 1: Trustline + registerCustomer via onboarding-url.
   * 409 → ABORTAR com mensagem SANDBOX_CONTAMINATION.
   * Não chama quote, bankAccounts nem createOrder — apenas registra e exibe link KYC hospedado.
   */
  const handleStartEtherfuse = async () => {
    if (!profile?.stellar_address || !profile?.id) return;
    setIsSimulating(true);
    setEfStatusLabel('Verificando Trustline...');
    logger.info('[WalletNow][Experiment]', 'Phase: etherfuse_customer_creation', {
      timestamp: new Date().toISOString(),
      phase: 'etherfuse_customer_creation',
      publicKey: profile.stellar_address.substring(0, 12) + '...',
    });
    try {
      const secretKey = WalletFactory.getSecretKey(profile.id);
      if (!secretKey) {
        setTrustlineResult({ success: false, error: 'Secret key não encontrada.' });
        return;
      }
      const tr = await EtherfuseTrustlineService.createTrustline(profile.stellar_address, secretKey);
      setTrustlineResult(tr);
      if (!tr.success) return;

      setEfStatusLabel('Registrando na Etherfuse...');
      const cust = await EtherfuseOnRampService.registerCustomer(profile.stellar_address);
      setEfCustomerId(cust.customerId);
      setEfKycUrl(cust.kycUrl);

      logger.info('[WalletNow][Experiment]', 'Phase: etherfuse_kyc_form', {
        timestamp: new Date().toISOString(),
        phase: 'etherfuse_kyc_form',
        customerId: cust.customerId,
        hasKycUrl: !!cust.kycUrl,
      });
      setEfStatusLabel('Abra o link Etherfuse para completar KYC e cadastro bancário.');
      setPhase('etherfuse_kyc_form');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.startsWith(SANDBOX_CONTAMINATION_ERROR)) {
        logger.error('[WalletNow][Experiment]', '⛔ SANDBOX_CONTAMINATION', {
          timestamp: new Date().toISOString(),
          phase: 'etherfuse_customer_creation_409',
        });
        setEfStatusLabel(`⛔ ${msg}`);
      } else {
        logger.error('[WalletNow][Experiment]', 'Erro em handleStartEtherfuse', {
          timestamp: new Date().toISOString(),
          error: msg,
        });
        setEfStatusLabel(`❌ ${msg}`);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  /**
   * [Experiment] FASE 2: Onboarding financeiro — só chamado após kycStatus = approved.
   * getFiatAccounts → quote → createOrder → simulate → settle.
   * REGRA: sem fallback UUID — se getFiatAccounts retornar [], abortar com PROXY_ACCOUNT_NOT_PROVISIONED.
   */
  const handleFinancialOnboarding = async () => {
    if (!profile?.stellar_address || !efCustomerId) return;
    setIsSimulating(true);
    logger.info('[WalletNow][Experiment]', 'Phase: etherfuse_financial_onboarding', {
      timestamp: new Date().toISOString(),
      phase: 'etherfuse_financial_onboarding',
      customerId: efCustomerId,
    });
    try {
      setPhase('etherfuse_financial_onboarding');
      setEfStatusLabel('Buscando conta bancária real...');
      const accounts = await EtherfuseOnRampService.getFiatAccounts(efCustomerId);
      const realBankAccountId = accounts[0].bankAccountId;
      setEfBankAccountId(realBankAccountId);

      setPhase('etherfuse_quote');
      setEfStatusLabel('Obtendo cotação BRL → TESOURO...');
      const quote = await EtherfuseOnRampService.getQuote(efCustomerId, profile.stellar_address, efAmount);
      setEfQuote(quote);

      setPhase('etherfuse_order');
      setEfStatusLabel('Criando ordem de compra...');
      const order = await EtherfuseOnRampService.createOrder(
        efCustomerId, realBankAccountId, quote.quoteId, profile.stellar_address
      );
      setEfOrder(order);

      setEfStatusLabel('⚡ Sandbox: Simulando pagamento PIX...');
      await EtherfuseOnRampService.simulateFiatReceived(order.orderId);

      setPhase('etherfuse_settling');
      const final = await EtherfuseOnRampService.pollUntilCompleted(
        order.orderId,
        (s) => setEfStatusLabel(`Status: ${s}`),
        90_000
      );
      if (final) setEfOrder(final);
      setPhase('etherfuse_done');
      if (onSuccess) setTimeout(onSuccess, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.startsWith(PROXY_ACCOUNT_NOT_PROVISIONED_ERROR)) {
        logger.error('[WalletNow][Experiment]', '⛔ PROXY_ACCOUNT_NOT_PROVISIONED', {
          timestamp: new Date().toISOString(),
          phase: 'etherfuse_financial_onboarding_empty',
          customerId: efCustomerId,
          hypothesis: 'Fluxo hospedado Etherfuse não completado — proxy account não provisionado',
        });
      } else {
        logger.error('[WalletNow][Experiment]', 'Erro em handleFinancialOnboarding', {
          timestamp: new Date().toISOString(),
          error: msg,
        });
      }
      setEfStatusLabel(`❌ ${msg}`);
      setPhase('etherfuse_kyc_polling');
    } finally {
      setIsSimulating(false);
    }
  };

  /**
   * [EtherfuseV2] Handler principal do fluxo programático validado.
   *
   * Fluxo end-to-end (sandbox):
   *   1. Trustline TESOURO (reutiliza EtherfuseTrustlineService v1)
   *   2. createCustomer → obtém customerId + bankAccountId diretamente
   *   3. KYC programático (identity + documentos mock + acordos)
   *   4. Polling KYC até approved (sandbox auto-aprova)
   *   5. Registro conta PIX com CPF mock
   *   6. Cotação BRL → TESOURO
   *   7. Criar ordem on-ramp com bankAccountId real
   *   8. Simular PIX recebido (sandbox)
   *   9. Polling até completed
   *
   * SANDBOX-ONLY: CPF mock, identidade mock, simulateFiatReceived.
   * V1 (phases etherfuse_*) permanece INTACTO — não é tocado aqui.
   */
  const handleStartEtherfuseV2 = async () => {
    if (!profile?.stellar_address || !profile?.id) return;

    const LOG_TAG = '[WalletNow][EtherfuseV2]';

    try {
      // ── PASSO 1: Trustline TESOURO ──────────────────────────────────────────
      setPhase('ef2_trustline');
      setEf2StatusLabel('Verificando trustline TESOURO...');
      logger.info(LOG_TAG, 'Iniciando fluxo programático V2', {
        timestamp: new Date().toISOString(),
        publicKey: profile.stellar_address.substring(0, 12) + '...',
      });

      const secretKey = WalletFactory.getSecretKey(profile.id);
      if (!secretKey) {
        throw new Error('Secret key não encontrada. Verifique sua wallet.');
      }

      const tr = await EtherfuseTrustlineService.createTrustline(profile.stellar_address, secretKey);
      if (!tr.success) {
        throw new Error(tr.error || 'Falha ao criar trustline TESOURO.');
      }
      logger.info(LOG_TAG, '✅ Trustline OK.', { alreadyExists: tr.alreadyExists });

      // Usa email baseado no profile ou fallback para sandbox
      const email = (profile as Record<string, unknown>).email as string | undefined
        || `sandbox-${profile.id.substring(0, 8)}@walletnow.app`;

      // ── VERIFICAÇÃO DE PERSISTÊNCIA ─────────────────────────────────────────
      let activeCustomerId = '';
      let activeBankAccountId = '';
      let skipOnboarding = false;

      const cachedCustomer = EtherfusePersistenceService.getCustomer(profile.stellar_address);
      if (cachedCustomer) {
        setPhase('ef2_customer_creation');
        setEf2StatusLabel('Validando identidade existente...');
        try {
          const kycStatus = await EtherfuseV2ApiService.getKycStatus(cachedCustomer.customerId, profile.stellar_address);
          if (kycStatus.status === 'approved') {
            logger.info(LOG_TAG, 'Existing customer detected', { customerId: cachedCustomer.customerId });
            logger.info(LOG_TAG, 'Skipping onboarding');
            logger.info(LOG_TAG, 'Reusing customerId');
            activeCustomerId = cachedCustomer.customerId;
            activeBankAccountId = cachedCustomer.bankAccountId;
            setEf2CustomerId(activeCustomerId);
            skipOnboarding = true;
          } else {
            logger.warn(LOG_TAG, 'Cached KYC not approved, restarting onboarding.', { status: kycStatus.status });
            EtherfusePersistenceService.clearCustomer(profile.stellar_address);
          }
        } catch (e) {
          logger.warn(LOG_TAG, 'Failed to validate cached customer, restarting onboarding.', { error: String(e) });
          EtherfusePersistenceService.clearCustomer(profile.stellar_address);
        }
      }

      // ── PASSO 2 ao 5: ONBOARDING NOVO ───────────────────────────────────────
      if (!skipOnboarding) {
        setPhase('ef2_customer_creation');
        setEf2StatusLabel('Registrando na Etherfuse...');

        try {
          const customer = await EtherfuseV2ApiService.createCustomer(
            email,
            profile.stellar_address,
            'BR',
          );
          activeCustomerId = customer.id;
          activeBankAccountId = customer.bankAccountId;
          setEf2CustomerId(activeCustomerId);
          
          logger.info(LOG_TAG, '✅ Customer criado.', {
            customerId: activeCustomerId,
            hasBankAccountId: !!activeBankAccountId,
          });

          // Salvar localmente
          EtherfusePersistenceService.saveCustomer(profile.stellar_address, activeCustomerId, activeBankAccountId);

          // PASSO 3: KYC Programático
          setPhase('ef2_kyc_submitting');
          setEf2StatusLabel('Submetendo identidade KYC (mock)...');
          await EtherfuseV2ApiService.submitKycIdentity(activeCustomerId, profile.stellar_address);

          setEf2StatusLabel('Submetendo documentos KYC (mock)...');
          await EtherfuseV2ApiService.submitKycDocuments(activeCustomerId, profile.stellar_address);

          setEf2StatusLabel('Aceitando acordos Etherfuse...');
          await EtherfuseV2ApiService.acceptAgreements(customer.presignedUrl);

          // PASSO 4: Polling KYC
          setPhase('ef2_kyc_polling');
          setEf2StatusLabel('Aguardando aprovação do sandbox...');
          await EtherfuseV2ApiService.pollKycUntilApproved(
            activeCustomerId,
            profile.stellar_address,
            (status) => setEf2StatusLabel(`KYC: ${status}`),
            60_000,
          );
          setEf2StatusLabel('✅ KYC aprovado! Registrando conta PIX...');

          // PASSO 5: Registrar Conta PIX
          setPhase('ef2_pix_registration');
          setEf2StatusLabel('Registrando chave PIX (CPF mock)...');
          await EtherfuseV2ApiService.registerPixAccount(customer.presignedUrl);
          logger.info(LOG_TAG, '✅ Conta PIX registrada.');
          
        } catch (error: any) {
          if (error instanceof EfV2HttpError && error.status === 409) {
            setPhase('error');
            setEf2StatusLabel('Conta já registrada!');
            throw new Error('Você já iniciou um cadastro na Etherfuse com esta carteira (Erro 409). Como o cache local não foi encontrado, a transação não pôde ser continuada. Limpe o cache na plataforma da Etherfuse ou contate o suporte.');
          }
          throw error;
        }
      }

      // ── PASSO 6: Cotação BRL → TESOURO ─────────────────────────────────────
      setPhase('ef2_quote');
      setEf2StatusLabel('Obtendo cotação BRL → TESOURO...');
      const quote = await EtherfuseV2ApiService.getQuote(
        activeCustomerId,
        profile.stellar_address,
        ef2Amount,
      );
      setEf2Quote(quote);
      logger.info(LOG_TAG, '✅ Cotação obtida.', {
        sourceAmount: quote.sourceAmount,
        destinationAmount: quote.destinationAmount,
      });

      // ── PASSO 7: Criar Ordem On-Ramp ───────────────────────────────────────
      setPhase('ef2_order');
      setEf2StatusLabel('Criando ordem de compra...');
      const order = await EtherfuseV2ApiService.createOnRampOrder(
        activeCustomerId,
        activeBankAccountId, // ID real retornado em createCustomer ou cache
        quote.quoteId,
        profile.stellar_address,
      );
      setEf2Order(order);
      logger.info(LOG_TAG, '✅ Ordem criada.', { orderId: order.orderId });

      // ── PASSO 8: Simular PIX (sandbox) ─────────────────────────────────────
      setEf2StatusLabel('⚡ Sandbox: Simulando pagamento PIX...');
      await EtherfuseV2ApiService.simulateFiatReceived(order.orderId);

      // ── PASSO 9: Polling até completed ─────────────────────────────────────
      setPhase('ef2_settling');
      const finalOrder = await EtherfuseV2ApiService.pollUntilCompleted(
        order.orderId,
        (s) => setEf2StatusLabel(`Status: ${s}`),
        90_000,
      );

      if (finalOrder) setEf2Order(finalOrder);
      
      setEf2StatusLabel('Buscando hash de liquidação on-chain...');
      let hashToUse = finalOrder?.confirmedTxSignature || order.confirmedTxSignature || null;
      if (!hashToUse) {
        const fallbackTx = await EtherfuseActivityService.findLatestTesouroTransaction(profile.stellar_address);
        if (fallbackTx) {
          hashToUse = fallbackTx.txHash;
        }
      }
      setEf2TxHash(hashToUse);

      EtherfuseActivityService.saveActivity(profile.stellar_address, {
        orderId: order.orderId,
        txHash: hashToUse || 'Pendente',
        explorerUrl: hashToUse ? `https://stellar.expert/explorer/testnet/tx/${hashToUse}` : '',
        asset: 'TESOURO',
        amountBRL: quote.sourceAmount,
        amountToken: quote.destinationAmount,
        status: finalOrder?.status || order.status,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        type: 'BUY TESOURO',
      });

      setPhase('ef2_done');

      logger.info(LOG_TAG, '🎉 Fluxo V2 concluído com sucesso!', {
        timestamp: new Date().toISOString(),
        orderId: order.orderId,
        amountInTokens: finalOrder?.amountInTokens,
        txSignature: hashToUse,
      });

      if (onSuccess) setTimeout(onSuccess, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(LOG_TAG, '❌ Erro no fluxo V2', {
        timestamp: new Date().toISOString(),
        error: msg,
      });
      setEf2ErrorMsg(msg);
      setPhase('ef2_error');
    }
  };

  /**
   * Fase 2: Fast-Mock / Observador de Pagamento (Polling Woovi)
   * Unificando estratégia: Em Sandbox/Dev, confirmamos em 2s sem polling real.
   */
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isOpen && phase === 'waiting_payment' && pixData?.correlationID) {
      // Estratégia MVP: Sempre aciona o Fast-Mock para fechar o ciclo sem travar
      logger.info('[WalletNow][Payment]', `🛠️ Depósito Fast-Mock acionado para ID: ${pixData.correlationID}`);
      timer = setTimeout(() => {
        triggerMinting(pixData.amount, pixData.correlationID!);
      }, DemoConfig.mockPaymentDelay);
    }

    return () => {
      if (timer) clearTimeout(timer);
      // Caso seja interval
      if (typeof timer === 'number') clearInterval(timer);
    };
  }, [isOpen, phase, pixData?.correlationID]);

  // [Experiment] Polling automático KYC — fase etherfuse_kyc_polling
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (isOpen && phase === 'etherfuse_kyc_polling' && efCustomerId && profile?.stellar_address) {
      timer = setInterval(async () => {
        try {
          const statusResult = await EtherfuseOnRampService.getKycStatus(efCustomerId, profile.stellar_address);
          logger.info('[WalletNow][Experiment]', `[Polling] KYC status: ${statusResult.status}`, {
            timestamp: new Date().toISOString(),
            phase: 'etherfuse_kyc_polling',
            customerId: efCustomerId,
            kycStatus: statusResult.status,
          });

          if (statusResult.status === 'approved' || statusResult.status === 'approved_chain_deploying') {
            clearInterval(timer);
            setEfStatusLabel('✅ KYC Aprovado! Iniciando onboarding financeiro...');
            logger.info('[WalletNow][Experiment]', 'KYC approved — disparando handleFinancialOnboarding', {
              timestamp: new Date().toISOString(),
              customerId: efCustomerId,
              kycStatus: statusResult.status,
            });
            handleFinancialOnboarding();
          } else if (statusResult.status === 'rejected') {
            clearInterval(timer);
            logger.error('[WalletNow][Experiment]', 'KYC Rejeitado', {
              timestamp: new Date().toISOString(),
              customerId: efCustomerId,
              reason: statusResult.currentRejectionReason,
            });
            setEfStatusLabel(`❌ KYC Rejeitado: ${statusResult.currentRejectionReason || 'motivo não informado'}`);
          } else {
            setEfStatusLabel(
              statusResult.status === 'not_started'
                ? 'Aguardando início do KYC no link Etherfuse...'
                : 'Aguardando aprovação do KYC...'
            );
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          logger.error('[WalletNow][Experiment]', 'Erro no polling KYC', {
            timestamp: new Date().toISOString(),
            error: msg,
          });
        }
      }, 5000);
    }

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, phase, efCustomerId, profile?.stellar_address]);

  // Se o modal não estiver aberto (isOpen === false), não renderiza nada na tela.
  // MAS os hooks devem ficar acima disto.
  if (!isOpen) return null;

  const triggerMinting = async (depositAmount: number, correlationID: string) => {
    if (!profile?.stellar_address || !profile.id) return;

    setPhase('minting');

    try {
      const userSecret = WalletFactory.getSecretKey(profile.id);

      // ── Despacho por Provider ────────────────────────────────────────────────
      // Stellar Native: settlement real de XLM via treasury wallet separada
      if (selectedProvider?.id === 'stellar_testanchor') {
        logger.info('[WalletNow][Settlement]', `🚀 Iniciando settlement XLM via treasury wallet`, { correlationID });

        if (!import.meta.env.VITE_STELLAR_TREASURY_SECRET) {
          throw new Error(
            'Treasury wallet não configurada. Adicione VITE_STELLAR_TREASURY_SECRET ao .env'
          );
        }

        const result = await StellarTestAnchorService.settleXLM(
          profile.stellar_address,
          depositAmount.toString(), // Mandar apenas o amount limpo (o toFixed(7) será feito na Service)
          correlationID
        );

        if (!result.success || !result.txHash) {
          throw new Error(result.error || 'Settlement XLM falhou sem hash.');
        }

        setTxHash(result.txHash);
        logger.info(
          '[WalletNow][Settlement]',
          `✅ Settlement XLM concluído! Hash: ${result.txHash}`
        );

      } else {
        // ── Woovi / BRW: Mint do token interno (fluxo original — intocado) ──────
        const hash = await PaymentService.mintBRW(
          profile.stellar_address,
          depositAmount.toString(),
          userSecret || undefined,
          correlationID
        );

        if (hash) {
          setTxHash(hash);
          logger.info('[WalletNow][Blockchain]', `✅ Depósito Liquidado via PIX com sucesso! Hash: ${hash}`);
        }
      }

      setPhase('success');
      if (onSuccess) onSuccess();

      // Fechamento automático: 3 segundos
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (e: any) {
      const isTestAnchor = selectedProvider?.id === 'stellar_testanchor';
      logger.error('[WalletNow][Settlement]', `❌ Falha crítica no settlement (${isTestAnchor ? 'XLM Nativo' : 'BRW Mint'})`, e);
      alert(`⚠️ PIX Recebido, mas falha no settlement: ${e.message}`);
      setPhase('input');
    }
  };

  const handleGeneratePix = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || !profile?.id) return;

    setPhase('generating');

    try {
      // 1. Chama o Gateway Woovi para gerar a cobrança Pix (QR Code EMV)
      const result = await WooviService.createCharge(Number(amount), profile.id);
      
      logger.info('[WalletNow][Payment]', `⏳ Cobrança PIX gerada: ${result.correlationID}. Exibindo QR Code...`);
      setPixData({ brCode: result.brCode, correlationID: result.correlationID, amount: result.amount });
      setPhase('waiting_payment');

    } catch (e: any) {
      alert("Falha de Comunicação com Gateway Woovi: " + e.message);
      setPhase('input');
    }
  };

  const handleCopy = () => {
    if (!pixData?.brCode) return;
    navigator.clipboard.writeText(pixData.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    // Fundo escuro semi-transparente (backdrop) que cobre a tela toda.
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#161616] rounded-t-[32px] sm:rounded-[32px] p-6 border border-white/5 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500">

        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {phase === 'provider_selection' ? 'Select Provider' : (phase === 'input' ? 'Depositar PIX' : (phase === 'etherfuse_preview' ? 'Treasury Asset' : 'Pagamento Gerado'))}
          </h2>
          <button
            onClick={onClose}
            disabled={phase === 'minting' || phase === 'generating'}
            className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase 0: Provider Selection */}
        {phase === 'provider_selection' && (
          <div className="flex flex-col space-y-4">
            {availableProviders.map((provider) => {
              const isActive = provider.status === 'active';
              
              // Helper to map icon names
              const IconComponent = () => {
                switch(provider.iconName) {
                  case 'QrCode': return <QrCode className="w-5 h-5" />;
                  case 'Globe': return <Globe className="w-5 h-5" />;
                  case 'CreditCard': return <CreditCard className="w-5 h-5" />;
                  case 'TrendingUp': return <TrendingUp className="w-5 h-5" />;
                  default: return <Zap className="w-5 h-5" />;
                }
              };

              return (
                <button
                  key={provider.id}
                  disabled={!isActive}
                  onClick={() => {
                    if (isActive) {
                      logger.info('[WalletNow][Provider]', `Selected provider: ${provider.id}`);
                      setSelectedProvider(provider);
                      if (provider.id === 'etherfuse') {
                        setPhase('etherfuse_preview');
                      } else if (provider.id === 'etherfuse_v2') {
                        setPhase('ef2_preview');
                      } else {
                        setPhase('input');
                      }
                    }
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-300 group
                    ${isActive 
                      ? 'bg-black/40 border-[#00E676]/30 hover:border-[#00E676]/80 hover:bg-black/60 shadow-[0_0_15px_rgba(0,230,118,0.05)] hover:shadow-[0_0_20px_rgba(0,230,118,0.15)] cursor-pointer' 
                      : 'bg-black/20 border-white/5 opacity-60 cursor-not-allowed'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isActive ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-white/5 text-gray-500'}`}>
                      <IconComponent />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-base ${isActive ? 'text-white' : 'text-gray-400'}`}>{provider.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{provider.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {!isActive ? (
                      <span className="text-[10px] uppercase tracking-wider font-mono bg-white/5 text-gray-400 px-2 py-1 rounded border border-white/10">
                        {provider.buttonLabel}
                      </span>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#00E676] transition-colors" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {/* ── EXPERIMENT: Fase loading — customer creation ─────────── */}
        {phase === 'etherfuse_customer_creation' && (
          <div className="flex flex-col items-center justify-center py-14 gap-5 animate-in fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" />
            </div>
            <p className="text-white font-bold text-base">Registrando na Etherfuse...</p>
            <p className="text-xs text-slate-400 font-mono">{efStatusLabel}</p>
          </div>
        )}

        {/* ── EXPERIMENT: etherfuse_kyc_form — Fluxo Hospedado Etherfuse ── */}
        {phase === 'etherfuse_kyc_form' && (
          <div className="flex flex-col space-y-5 animate-in fade-in duration-300">
            <div className="flex flex-col items-center justify-center pt-2 pb-4 border-b border-white/5 gap-3">
              <div className="w-14 h-14 bg-blue-900/30 rounded-full flex items-center justify-center border border-blue-500/30">
                <ShieldCheck className="w-7 h-7 text-blue-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">Verificação de Identidade</h3>
                <p className="text-xs text-slate-400 mt-1 px-4 leading-relaxed">
                  Complete seu KYC e cadastro bancário PIX no portal Etherfuse.
                  <br />
                  <strong className="text-blue-300">O banco de dados da proxy account é provisionado lá.</strong>
                </p>
              </div>
              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
                <span className="text-[10px] text-amber-400 font-mono font-bold tracking-widest uppercase">[Experiment] Fluxo Hospedado — KYC-First</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-blue-800/30 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                1. Abra o link Etherfuse abaixo<br />
                2. Complete KYC + cadastro da conta PIX<br />
                3. Retorne aqui e clique em <strong className="text-blue-300">"Já completei o KYC"</strong>
              </p>
              {efKycUrl ? (
                <a
                  href={efKycUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 px-5 rounded-xl font-bold transition-all shadow-[0_0_24px_rgba(37,99,235,0.2)] text-sm"
                >
                  <Globe className="w-4 h-4" />
                  Abrir Etherfuse KYC Portal <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  URL de onboarding não disponível
                </div>
              )}
            </div>

            {efStatusLabel && (
              <div className="bg-blue-950/20 border border-blue-800/20 rounded-xl p-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
                <p className="text-xs text-blue-300 font-mono">{efStatusLabel}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setPhase('etherfuse_preview'); setEfStatusLabel(''); }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-2xl font-bold transition-all text-sm"
              >
                Voltar
              </button>
              <button
                onClick={() => setPhase('etherfuse_kyc_polling')}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 px-5 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Já completei o KYC
              </button>
            </div>
          </div>
        )}

        {/* ── EXPERIMENT: etherfuse_kyc_polling — Aguardando aprovação ─── */}
        {phase === 'etherfuse_kyc_polling' && (
          <div className="flex flex-col items-center justify-center py-8 gap-5 animate-in fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500/30 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-blue-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Aguardando Aprovação KYC</h3>
              <p className="text-xs text-slate-400 mt-1 px-4 leading-relaxed">
                Verificando status a cada 5s. O onboarding financeiro só inicia após <strong className="text-blue-300">approved</strong>.
              </p>
            </div>
            <p className="text-xs text-slate-500 font-mono animate-pulse">{efStatusLabel || 'Verificando...'}</p>
            <div className="w-full flex gap-3">
              <button
                onClick={() => setPhase('etherfuse_kyc_form')}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-2xl font-bold transition-all text-sm"
              >
                Voltar ao link
              </button>
            </div>
            <div className="w-full flex items-center gap-2 text-[10px] text-slate-600 font-mono justify-center">
              <ShieldCheck className="w-3 h-3" />
              [Experiment] customerId: {efCustomerId.substring(0, 8)}...
            </div>
          </div>
        )}

        {/* ── EXPERIMENT: Fases de loading financeiro ──────────────────── */}
        {(phase === 'etherfuse_financial_onboarding' || phase === 'etherfuse_quote' || phase === 'etherfuse_order') && (
          <div className="flex flex-col items-center justify-center py-14 gap-5 animate-in fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base">
                {phase === 'etherfuse_financial_onboarding' && 'Buscando conta bancária...'}
                {phase === 'etherfuse_quote' && 'Obtendo cotação BRL → TESOURO...'}
                {phase === 'etherfuse_order' && 'Criando ordem on-ramp...'}
              </p>
              <p className="text-xs text-slate-400 font-mono mt-1">{efStatusLabel}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
              <ShieldCheck className="w-3 h-3" />
              [Experiment] bankAccountId: {efBankAccountId ? efBankAccountId.substring(0, 8) + '...' : 'aguardando...'}
            </div>
          </div>
        )}

        {/* ── ETHERFUSE: Tela Principal ──────────────────────────── */}
        {phase === 'etherfuse_preview' && (
          <div className="flex flex-col space-y-4 animate-in fade-in duration-300">

            {/* Header Institucional */}
            <div className="bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#0a0f1e] rounded-2xl p-5 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-700">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{EtherfuseAssetConfig.displayName}</h3>
                  <p className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">{EtherfuseAssetConfig.assetCode} · Stellar Testnet · PIX Rail</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adquira <strong className="text-blue-300">TESOURO</strong> — título público federal tokenizado em Stellar via PIX. Custody direta na sua wallet.
              </p>

              {/* Valor */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-slate-500 text-sm font-semibold">R$</span>
                <input
                  type="number"
                  value={efAmount}
                  onChange={e => setEfAmount(e.target.value)}
                  className="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-white text-lg font-bold outline-none focus:border-blue-500 transition-colors"
                  min="10"
                  step="10"
                />
                <span className="text-slate-500 text-sm">BRL</span>
              </div>
              {efQuote && (
                <p className="text-[10px] text-blue-300 font-mono mt-2">
                  ≈ {parseFloat(efQuote.destinationAmount).toFixed(7)} TESOURO · Taxa: R$ {parseFloat(efQuote.feeAmount).toFixed(2)}
                </p>
              )}
            </div>

            {/* Erro */}
            {trustlineResult && !trustlineResult.success && (
              <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 font-mono">{trustlineResult.error}</p>
              </div>
            )}

            {/* Status label durante execução */}
            {isSimulating && efStatusLabel && (
              <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                <p className="text-xs text-blue-300 font-mono">{efStatusLabel}</p>
              </div>
            )}

            {/* [Experiment] CTA — Inicia fluxo KYC-First hospedado */}
            <button
              onClick={handleStartEtherfuse}
              disabled={isSimulating || !efAmount || Number(efAmount) < 10}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 px-6 rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 shadow-[0_0_24px_rgba(37,99,235,0.25)]"
            >
              {isSimulating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
              {isSimulating ? efStatusLabel || 'Processando...' : `Iniciar KYC · R$ ${efAmount}`}
            </button>

            <button
              onClick={() => { setPhase('provider_selection'); setTrustlineResult(null); setEfStatusLabel(''); }}
              className="w-full text-xs text-gray-600 hover:text-white transition-colors"
            >
              Voltar
            </button>
          </div>
        )}

        {/* ── ETHERFUSE: Settling (Polling) ─────────────────────── */}
        {phase === 'etherfuse_settling' && (
          <div className="flex flex-col items-center justify-center py-14 gap-5 animate-in fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base">Liquidando na Stellar...</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">{efStatusLabel}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
              <ShieldCheck className="w-3 h-3" />
              TESOURO · Etherfuse · Stellar Testnet
            </div>
          </div>
        )}

        {/* ── ETHERFUSE: Done ───────────────────────────────────── */}
        {phase === 'etherfuse_done' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
              <CheckCircle2 className="w-10 h-10 text-blue-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white">Settlement Complete</h3>
              <p className="text-sm text-slate-400 mt-1">
                {efOrder?.amountInTokens ? (
                  <><strong className="text-blue-300">{parseFloat(efOrder.amountInTokens).toFixed(4)} TESOURO</strong> creditado na sua wallet</>
                ) : 'TESOURO creditado na sua wallet Stellar'}
              </p>
            </div>
            {efOrder?.confirmedTxSignature && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${efOrder.confirmedTxSignature}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] text-blue-400 font-mono bg-blue-950/30 px-4 py-2 rounded-xl border border-blue-800/40 hover:border-blue-500/50 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                Ver no Stellar Expert: {efOrder.confirmedTxSignature.substring(0, 12)}...
              </a>
            )}
            <div className="w-full grid grid-cols-3 gap-2 mt-2">
              {['Trustline Active', 'Treasury Funded', 'Settlement Complete'].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1 p-2 bg-blue-950/20 rounded-xl border border-blue-900/30">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <p className="text-[9px] text-blue-300 text-center font-mono">{s}</p>
                </div>
              ))}
            </div>
            <button onClick={onClose} className="w-full bg-blue-700 hover:bg-blue-600 text-white py-3 rounded-2xl font-bold transition-all">
              Fechar
            </button>
          </div>
        )}

        {/* Phase 1: Input de Valor */}
        {phase === 'input' && (
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col items-center justify-center py-8 bg-black/30 rounded-2xl border border-white/5">
              <span className="text-sm text-gray-500 font-medium mb-2">Valor em Reais</span>
              <div className="flex items-center justify-center text-4xl font-bold text-white">
                <span className="text-gray-500 mr-2 text-2xl">R$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="bg-transparent border-none outline-none text-center w-32 placeholder:text-gray-700 focus:ring-0 p-0"
                  autoFocus
                />
              </div>
            </div>

            <p className="text-[10px] text-gray-500 text-center uppercase tracking-wider font-mono">
              Woovi PIX Gateway — Conversão 1:1 BRL ➔ BRW. Fundos bloqueados até recepção na Stellar Testnet.
            </p>

            <button
              onClick={handleGeneratePix}
              disabled={!amount || Number(amount) <= 0}
              className="w-full flex items-center justify-center gap-3 bg-[#00E676] hover:bg-[#00E676]/90 text-black py-4 px-6 rounded-2xl transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,230,118,0.2)]"
            >
              <QrCode className="w-5 h-5" />
              Gerar QR Code Dinâmico
            </button>
          </div>
        )}

        {/* Phase 2: Generating Loading State */}
        {phase === 'generating' && (
          <div className="flex flex-col items-center justify-center py-16 animate-in fade-in">
            <Loader2 className="w-12 h-12 text-[#00E676] animate-spin mb-4" />
            <p className="text-gray-400 font-medium">Conectando ao Sandbox e Banco Central...</p>
            <p className="text-[10px] text-gray-600 mt-2">Criando Cobrança EMV Dinâmica</p>
          </div>
        )}

        {/* Phase 3: Waiting PIX Payment (QR Code Display + Polling) */}
        {phase === 'waiting_payment' && pixData && (
          <div className="flex flex-col items-center space-y-6 animate-in zoom-in duration-300">
            <div className="text-center">
              <p className="text-sm text-gray-400">Escaneie pelo App do seu Banco</p>
              <p className="text-2xl font-bold text-[#00E676] mt-1">R$ {pixData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>

            {/* QR Code REAL gerado a partir do brCode EMV retornado pela Woovi. */}
            {/* Usamos api.qrserver.com: zero npm extra, zero custo, apenas uma URL de imagem. */}
            <div className="w-52 h-52 bg-white rounded-2xl p-3 flex items-center justify-center shadow-[0_0_30px_rgba(0,230,118,0.15)]">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.brCode)}&bgcolor=ffffff&color=000000&margin=0&format=png`}
                alt="QR Code PIX — escaneie no app do seu banco"
                width={200}
                height={200}
                className="w-full h-full rounded-xl"
                onError={(e) => {
                  // Fallback: Se a API de QR falhar, mostra texto
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = '<p class="text-black text-xs text-center font-mono p-2">⚠️ QR indisponível. Use Copia e Cola abaixo.</p>';
                  }
                }}
              />
            </div>

            <div className="w-full">
              <label className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2 block">Chave Copia e Cola Oficial (Woovi)</label>
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-between bg-black/50 border border-[#00E676]/30 p-4 rounded-xl hover:border-[#00E676]/80 transition-colors group"
              >
                <span className="text-xs text-gray-300 truncate mr-4 font-mono select-all">
                  {pixData.brCode}
                </span>
                {copied ? (
                  <CheckCircle2 className="w-5 h-5 text-[#00E676] flex-shrink-0" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500 group-hover:text-[#00E676] flex-shrink-0 transition-colors" />
                )}
              </button>
            </div>

            <div className="w-full bg-[#00E676]/10 border border-[#00E676]/20 py-3 px-4 rounded-xl flex items-center justify-center gap-3">
              <Loader2 className="w-4 h-4 text-[#00E676] animate-spin" />
              <span className="text-xs font-semibold text-[#00E676] uppercase tracking-wider">Aguardando pagamento PIX...</span>
            </div>
          </div>
        )}

        {/* Phase 4: Settlement Onchain (Woovi BRW Mint ou Stellar TestAnchor XLM) */}
        {phase === 'minting' && (
          <div className="flex flex-col items-center justify-center py-16 animate-in zoom-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-[#00E676]/30 flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-[#00E676] animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full bg-[#00E676]/10 animate-ping"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">PIX Recebido com Sucesso!</h3>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-[#00E676] animate-spin" />
                <p className="text-gray-400 font-medium text-sm mt-1 text-center">Liquidando Onchain...</p>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <ShieldCheck className="w-4 h-4 text-[#00E676]" />
                Validando assinaturas
              </div>
              {selectedProvider?.id === 'stellar_testanchor' ? (
                <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-widest font-mono">TestAnchor · XLM · Stellar Testnet</p>
              ) : (
                <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-widest font-mono">Woovi API · Stellar Smart Contract</p>
              )}
            </div>
          </div>
        )}

        {/* Phase 5: Success Finalization */}
        {phase === 'success' && (
          <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-[#00E676]/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-[#00E676]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Depósito Liquidado!</h3>
            <p className="text-gray-400 text-center text-sm mb-6">Transferência Bancária recebida.<br />Saldo refletido On-Chain com Sucesso.</p>
            
            {txHash && (
              <a 
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#00E676] text-xs font-semibold bg-[#00E676]/10 px-4 py-2 rounded-xl border border-[#00E676]/20 hover:bg-[#00E676]/20 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver Comprovante Blockchain
              </a>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ETHERFUSE V2 — Fluxo Programático Validado
            Phases prefixadas com ef2_ para não conflitar com V1.
            O V1 (phases etherfuse_*) permanece INTACTO acima.
        ═══════════════════════════════════════════════════════════════════ */}

        {/* ── EF2 Preview: Tela inicial do fluxo V2 ────────────────────── */}
        {phase === 'ef2_preview' && (
          <div className="flex flex-col space-y-4 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0a1628] rounded-2xl p-5 border border-emerald-900/40 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center border border-emerald-800/50">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Etherfuse V2 (Sandbox)</h3>
                  <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest">TESOURO · Fluxo Programático · PIX Rail</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adquira <strong className="text-emerald-300">TESOURO</strong> — título público federal tokenizado em Stellar via PIX.
                Fluxo programático validado: KYC automático no sandbox Etherfuse.
              </p>
              <div className="mt-3 px-3 py-1.5 bg-emerald-900/20 border border-emerald-700/30 rounded-lg inline-flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Sandbox Auto-Approve KYC</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-slate-500 text-sm font-semibold">R$</span>
                <input
                  type="number"
                  value={ef2Amount}
                  onChange={e => setEf2Amount(e.target.value)}
                  className="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-white text-lg font-bold outline-none focus:border-emerald-500 transition-colors"
                  min="10"
                  step="10"
                />
                <span className="text-slate-500 text-sm">BRL</span>
              </div>
              {ef2Quote && (
                <p className="text-[10px] text-emerald-300 font-mono mt-2">
                  ≈ {parseFloat(ef2Quote.destinationAmount).toFixed(7)} TESOURO · Taxa: R$ {parseFloat(ef2Quote.feeAmount).toFixed(2)}
                </p>
              )}
            </div>

            {ef2ErrorMsg && (
              <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 font-mono break-all">{ef2ErrorMsg}</p>
              </div>
            )}

            <button
              id="btn-ef2-start"
              onClick={handleStartEtherfuseV2}
              disabled={!ef2Amount || Number(ef2Amount) < 10}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-4 px-6 rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 shadow-[0_0_24px_rgba(16,185,129,0.25)]"
            >
              <Wallet className="w-5 h-5" />
              Comprar TESOURO · R$ {ef2Amount}
            </button>
            <button
              onClick={() => { setPhase('provider_selection'); setEf2ErrorMsg(''); }}
              className="w-full text-xs text-gray-600 hover:text-white transition-colors"
            >
              Voltar
            </button>
          </div>
        )}

        {/* ── EF2 Loading genérico (trustline, customer, kyc, pix, quote, order) ── */}
        {(['ef2_trustline', 'ef2_customer_creation', 'ef2_kyc_submitting', 'ef2_pix_registration', 'ef2_quote', 'ef2_order'] as const).some(p => p === phase) && (
          <div className="flex flex-col items-center justify-center py-14 gap-5 animate-in fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base">
                {phase === 'ef2_trustline' && 'Verificando Trustline TESOURO...'}
                {phase === 'ef2_customer_creation' && 'Criando customer Etherfuse...'}
                {phase === 'ef2_kyc_submitting' && 'Submetendo KYC programático...'}
                {phase === 'ef2_pix_registration' && 'Registrando conta PIX...'}
                {phase === 'ef2_quote' && 'Obtendo cotação BRL → TESOURO...'}
                {phase === 'ef2_order' && 'Criando ordem on-ramp...'}
              </p>
              <p className="text-xs text-slate-400 font-mono mt-1">{ef2StatusLabel}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
              <ShieldCheck className="w-3 h-3" />
              [EtherfuseV2] Fluxo Programático · Sandbox
            </div>
          </div>
        )}

        {/* ── EF2 KYC Polling ─────────────────────────────────────────── */}
        {phase === 'ef2_kyc_polling' && (
          <div className="flex flex-col items-center justify-center py-8 gap-5 animate-in fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Aguardando Aprovação KYC</h3>
              <p className="text-xs text-slate-400 mt-1 px-4 leading-relaxed">
                Sandbox auto-aprova após submissão programática.
              </p>
            </div>
            <p className="text-xs text-slate-500 font-mono animate-pulse">{ef2StatusLabel || 'Verificando...'}</p>
          </div>
        )}

        {/* ── EF2 Settling (Polling ordem) ────────────────────────────── */}
        {phase === 'ef2_settling' && (
          <div className="flex flex-col items-center justify-center py-14 gap-5 animate-in fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base">Liquidando na Stellar...</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">{ef2StatusLabel}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
              <ShieldCheck className="w-3 h-3" />
              TESOURO · EtherfuseV2 · Stellar Testnet
            </div>
          </div>
        )}

        {/* ── EF2 Done (Sucesso) ──────────────────────────────────────── */}
        {phase === 'ef2_done' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-full flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white">TESOURO Creditado!</h3>
              <p className="text-sm text-slate-400 mt-1">
                {ef2Order?.amountInTokens ? (
                  <><strong className="text-emerald-300">{parseFloat(ef2Order.amountInTokens).toFixed(4)} TESOURO</strong> na sua wallet Stellar</>
                ) : 'TESOURO creditado na sua wallet Stellar'}
              </p>
            </div>
            {ef2TxHash && (
              <div className="w-full mt-2 bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 font-mono mb-2">Transaction Hash</p>
                <div className="flex items-center justify-between gap-2 bg-black/40 px-3 py-2 rounded-lg border border-slate-800">
                  <span className="text-xs text-emerald-400 font-mono truncate">
                    {ef2TxHash.length > 20 ? `${ef2TxHash.substring(0, 16)}...` : ef2TxHash}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(ef2TxHash);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-1.5 hover:bg-slate-800 rounded-md transition-colors"
                      title="Copiar Hash"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400 hover:text-white" />}
                    </button>
                    {ef2TxHash !== 'Pendente' && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${ef2TxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1"
                        title="Ver no Stellar Expert"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-400 hover:text-emerald-400" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="w-full grid grid-cols-3 gap-2 mt-2">
              {['Trustline OK', 'PIX Simulado', 'TESOURO Liquidado'].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1 p-2 bg-emerald-950/20 rounded-xl border border-emerald-900/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <p className="text-[9px] text-emerald-300 text-center font-mono">{s}</p>
                </div>
              ))}
            </div>
            <button id="btn-ef2-close" onClick={onClose} className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-3 rounded-2xl font-bold transition-all">
              Fechar
            </button>
          </div>
        )}

        {/* ── EF2 Error ──────────────────────────────────────────────── */}
        {phase === 'ef2_error' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4 animate-in fade-in">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center border border-red-800/40">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Erro no Fluxo V2</h3>
              <p className="text-xs text-slate-500 font-mono mt-2 break-all px-2">{ef2ErrorMsg}</p>
            </div>
            <button
              onClick={() => { setPhase('ef2_preview'); setEf2ErrorMsg(''); setEf2StatusLabel(''); }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-2xl font-bold transition-all"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => setPhase('provider_selection')}
              className="w-full text-xs text-gray-600 hover:text-white transition-colors"
            >
              Voltar à seleção
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
