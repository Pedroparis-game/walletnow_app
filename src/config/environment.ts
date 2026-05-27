/**
 * environment.ts
 *
 * Sistema centralizado de configuração de ambiente da WalletNow.
 *
 * REGRAS DE SEGURANÇA:
 * 1. Nunca expor secrets com prefixo VITE_ que contenham chaves privadas em produção.
 *    Variáveis VITE_ são injetadas no bundle público pelo Vite.
 * 2. Chaves de API de terceiros (Gemini, Etherfuse) devem ser movidas para Edge Functions.
 *    TODO [SECURITY-CRITICAL]: Migrar VITE_GEMINI_API_KEY para Edge Function server-side.
 *    TODO [SECURITY-CRITICAL]: Migrar VITE_STELLAR_ISSUER_SECRET para Edge Function server-side.
 * 3. Este arquivo centraliza TODA leitura de import.meta.env para facilitar auditoria.
 *
 * @module environment
 */

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type AppEnvironment = 'development' | 'homolog' | 'production';
export type StellarNetworkType = 'testnet' | 'mainnet';

// ─── Detecção de Ambiente ─────────────────────────────────────────────────────

/**
 * Determina o ambiente ativo baseado na variável VITE_APP_ENV.
 * Fallback seguro: sempre 'development' se não definido.
 */
function detectEnvironment(): AppEnvironment {
  const envVar = import.meta.env.VITE_APP_ENV as string | undefined;
  if (envVar === 'production') return 'production';
  if (envVar === 'homolog') return 'homolog';
  return 'development';
}

/**
 * Determina a rede Stellar ativa.
 * REGRA CRÍTICA: Em produção, VITE_STELLAR_NETWORK DEVE ser 'mainnet'.
 * Qualquer outro valor em produção é tratado como erro de configuração.
 */
function detectStellarNetwork(): StellarNetworkType {
  const envVar = (import.meta.env.VITE_STELLAR_NETWORK as string | undefined)?.toLowerCase();

  if (envVar === 'mainnet') return 'mainnet';

  // Em ambiente de produção real, se a rede não for mainnet, logar aviso crítico
  if (detectEnvironment() === 'production' && envVar !== 'mainnet') {
    console.error(
      '[WalletNow][Environment] 🚨 CONFIGURAÇÃO CRÍTICA: VITE_STELLAR_NETWORK não é "mainnet" em ambiente de produção!',
      'Valor atual:', envVar,
      'Nenhuma transação será processada corretamente.'
    );
  }

  return 'testnet'; // Fallback seguro para dev/homolog
}

// ─── Configuração Principal ───────────────────────────────────────────────────

const ENV = detectEnvironment();
const STELLAR_NETWORK = detectStellarNetwork();

/**
 * AppConfig — Objeto único de configuração de toda a aplicação.
 *
 * Todos os serviços devem ler configurações AQUI, nunca via import.meta.env diretamente.
 * Isso permite auditoria centralizada e troca de ambientes sem busca manual de hardcodes.
 */
export const AppConfig = {

  // ── Ambiente ──────────────────────────────────────────────────────────────

  /** Ambiente atual da aplicação */
  environment: ENV,

  /** Verdadeiro apenas em ambiente de desenvolvimento local */
  isDevelopment: ENV === 'development',

  /** Verdadeiro em ambiente de homologação (staging mainnet) */
  isHomolog: ENV === 'homolog',

  /** Verdadeiro APENAS em ambiente de produção real */
  isProduction: ENV === 'production',

  // ── Supabase ──────────────────────────────────────────────────────────────

  supabase: {
    /** URL do projeto Supabase */
    url: import.meta.env.VITE_SUPABASE_URL as string,
    /** Chave anônima pública do Supabase (segura para expor no bundle) */
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  },

  // ── Stellar / Blockchain ──────────────────────────────────────────────────

  stellar: {
    /** Rede Stellar ativa: 'testnet' | 'mainnet' */
    network: STELLAR_NETWORK,

    /** Verdadeiro se estiver na rede principal */
    isMainnet: STELLAR_NETWORK === 'mainnet',

    /**
     * Chave pública do issuer/treasury da WalletNow.
     * APENAS a chave pública é segura para o frontend.
     */
    issuerPublicKey: import.meta.env.VITE_STELLAR_ISSUER_PUBLIC as string | undefined,

    /**
     * @deprecated [SECURITY-CRITICAL] Esta variável NÃO deve existir em produção mainnet.
     * A chave secreta do issuer deve ser movida para uma Edge Function server-side segura.
     * Mantida temporariamente para não quebrar o fluxo atual de testnet.
     * TODO [BLOCKER-MAINNET]: Remover esta variável e criar edge function `stellar-issuer`.
     */
    issuerSecretKey: import.meta.env.VITE_STELLAR_ISSUER_SECRET as string | undefined,
  },

  // ── AI / KYC ─────────────────────────────────────────────────────────────

  ai: {
    /**
     * @deprecated [SECURITY-HIGH] A Gemini API Key não deve ser exposta no bundle em produção.
     * TODO [BLOCKER-MAINNET]: Mover chamadas Gemini para Edge Function `kyc-validator`.
     */
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY as string | undefined,
  },

  // ── Integrações Fiat ──────────────────────────────────────────────────────

  integrations: {
    /**
     * App ID da Woovi/OpenPix para gateway PIX.
     * TODO: Trocar pela credencial de produção antes do go-live.
     */
    wooviAppId: import.meta.env.VITE_WOOVI_APP_ID as string | undefined,
    wooviAuthToken: import.meta.env.VITE_WOOVI_AUTH_TOKEN as string | undefined,
  },

  // ── Feature Flags ─────────────────────────────────────────────────────────

  features: {
    /**
     * Ativa o painel de QA e logs detalhados.
     * NUNCA deve ser true em produção via URL param em produção.
     * TODO [SECURITY-MEDIUM]: Remover suporte a ?demo=true em produção.
     */
    demoMode: import.meta.env.DEV || false,

    /** Habilita revelação de seed phrase na UI (Config > ProMode) */
    seedPhraseReveal: true,

    /** Habilita fluxo Etherfuse V2 */
    etherfuseV2Enabled: true,

    /** Limite de fee por transação (0,49%) */
    transactionFeePercent: 0.0049,
  },

  // ── URLs e Endpoints ──────────────────────────────────────────────────────

  urls: {
    /** URL base da aplicação */
    appUrl: import.meta.env.APP_URL as string | undefined,

    /** Explorer Stellar para links de transações */
    stellarExplorer: STELLAR_NETWORK === 'mainnet'
      ? 'https://stellar.expert/explorer/public'
      : 'https://stellar.expert/explorer/testnet',

    /** Horizon API endpoint (definido via stellarNetwork.ts) */
    horizonEndpoint: STELLAR_NETWORK === 'mainnet'
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org',
  },

} as const;

// ─── Validação de Configuração ────────────────────────────────────────────────

/**
 * Valida se todas as configurações obrigatórias estão presentes.
 * Deve ser chamado no bootstrap da aplicação (main.tsx).
 */
export function validateAppConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!AppConfig.supabase.url) {
    errors.push('VITE_SUPABASE_URL não configurado');
  }

  if (!AppConfig.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY não configurado');
  }

  // Aviso crítico de segurança para produção
  if (AppConfig.isProduction) {
    if (AppConfig.stellar.issuerSecretKey) {
      errors.push(
        '[SECURITY-CRITICAL] VITE_STELLAR_ISSUER_SECRET está presente no bundle de PRODUÇÃO. ' +
        'Isso é uma vulnerabilidade crítica. Mova a assinatura para uma Edge Function server-side.'
      );
    }
    if (AppConfig.ai.geminiApiKey) {
      errors.push(
        '[SECURITY-HIGH] VITE_GEMINI_API_KEY está presente no bundle de PRODUÇÃO. ' +
        'Mova as chamadas Gemini para uma Edge Function kyc-validator.'
      );
    }
    if (!AppConfig.stellar.isMainnet) {
      errors.push(
        '[CRITICAL] VITE_STELLAR_NETWORK não é "mainnet" em ambiente de produção.'
      );
    }
  }

  return {
    valid: errors.filter(e => e.startsWith('[SECURITY') || e.startsWith('[CRITICAL')).length === 0,
    errors,
  };
}
