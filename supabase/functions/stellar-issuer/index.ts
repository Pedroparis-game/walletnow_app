/**
 * stellar-issuer — Supabase Edge Function
 *
 * ⚠️  STUB DE ARQUITETURA — NÃO DEPLOYADO EM PRODUÇÃO AINDA ⚠️
 *
 * PROPÓSITO:
 * Esta Edge Function é o destino final da migração da VITE_STELLAR_ISSUER_SECRET
 * que atualmente está exposta no bundle do frontend (BLOCKER crítico).
 *
 * OPERAÇÕES QUE SERÃO MIGRADAS PARA CÁ:
 * 1. activateAccount(publicKey) — ativação de novas wallets via CAP-33 Sponsor
 * 2. setupTrustlines(publicKey) — setup inicial de trustlines (USDC, BRZ, TESOURO)
 * 3. mintToken(publicKey, assetCode, amount) — mintagem de tokens (on-ramp)
 * 4. burnToken(publicKey, assetCode, amount) — queima de tokens (off-ramp)
 * 5. sponsorOperation(publicKey, operations) — patrocínio genérico de reservas
 *
 * SEGURANÇA DA ARQUITETURA FINAL:
 * - ISSUER_SECRET será armazenada APENAS em Supabase Vault (secrets)
 * - Nunca enviada ao browser em hipótese alguma
 * - Cada operação valida o JWT do usuário antes de executar
 * - Rate limiting por user_id (máx 10 ops/min)
 * - Audit log automático de cada operação executada
 * - Apenas operações pré-aprovadas (whitelist de tipos de operação)
 *
 * PREREQUISITES PARA ATIVAR:
 * [ ] 1. Configurar secret: supabase secrets set STELLAR_ISSUER_SECRET=S...
 * [ ] 2. Configurar secret: supabase secrets set STELLAR_NETWORK=mainnet
 * [ ] 3. Remover VITE_STELLAR_ISSUER_SECRET de todos os arquivos .env
 * [ ] 4. Atualizar walletFactory.ts para chamar esta Edge Function
 * [ ] 5. Atualizar paymentService.ts para chamar esta Edge Function
 * [ ] 6. Atualizar identityService.ts para chamar esta Edge Function
 * [ ] 7. Testar em homolog por no mínimo 1 semana antes de produção
 *
 * STATUS: STUB — implementação pendente antes do go-live mainnet
 *
 * @see docs/mainnet/KEY_MANAGEMENT.md
 * @see docs/mainnet/MAINNET_MIGRATION_PLAN.md
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Origens autorizadas (mesma lista do etherfuse-proxy)
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://walletnow.app',
  'https://www.walletnow.app',
  'https://walletnow-app.vercel.app',
];

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// Tipos de operações permitidas
type IssuerOperation =
  | 'activate_account'
  | 'setup_trustlines'
  | 'mint_token'
  | 'burn_token'
  | 'sponsor_operation';

interface IssuerRequest {
  operation: IssuerOperation;
  publicKey: string;
  assetCode?: string;
  amount?: string;
  correlationId?: string;
}

serve(async (req) => {
  const requestOrigin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(requestOrigin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // STUB: Retorna erro explicativo até a implementação ser concluída
  // TODO: Implementar lógica real antes do go-live mainnet
  return new Response(
    JSON.stringify({
      error: 'STUB_NOT_IMPLEMENTED',
      message: 'stellar-issuer Edge Function ainda não foi implementada. ' +
        'O issuer secret ainda está no frontend (modo testnet). ' +
        'Consulte docs/mainnet/KEY_MANAGEMENT.md para o plano de migração.',
      status: 'pending_implementation',
    }),
    {
      status: 501,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});

/**
 * IMPLEMENTAÇÃO FUTURA — Estrutura planejada:
 *
 * async function handleOperation(request: IssuerRequest, userId: string) {
 *   const issuerSecret = Deno.env.get('STELLAR_ISSUER_SECRET');
 *   const network = Deno.env.get('STELLAR_NETWORK') || 'testnet';
 *
 *   switch (request.operation) {
 *     case 'activate_account':
 *       return await activateAccount(request.publicKey, issuerSecret, network);
 *     case 'setup_trustlines':
 *       return await setupTrustlines(request.publicKey, issuerSecret, network);
 *     case 'mint_token':
 *       return await mintToken(request.publicKey, request.assetCode!, request.amount!, issuerSecret, network);
 *     case 'burn_token':
 *       return await burnToken(request.publicKey, request.assetCode!, request.amount!, issuerSecret, network);
 *     default:
 *       throw new Error(`Operação não autorizada: ${request.operation}`);
 *   }
 * }
 */
