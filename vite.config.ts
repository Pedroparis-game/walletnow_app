import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Woovi / OpenPix AppID
  const wooviAppId = (env.VITE_WOOVI_APP_ID || '').trim();

  /**
   * Base Path — lógica de detecção multi-ambiente:
   *
   * PRIORIDADE (ordem):
   * 1. VITE_BASE_PATH env var — override explícito (recomendado em CI/CD)
   * 2. process.env.VERCEL — deploy na Vercel → raiz '/'
   * 3. Default → '/walletnow/' (Hostinger subpath)
   *
   * COMO CONFIGURAR NA VERCEL:
   *   Adicionar variável de ambiente: VITE_BASE_PATH=/
   *
   * COMO CONFIGURAR NO HOSTINGER:
   *   Não definir VITE_BASE_PATH — default '/walletnow/' será usado.
   *   OU definir: VITE_BASE_PATH=/walletnow/
   */
  const basePath = env.VITE_BASE_PATH || (process.env.VERCEL ? '/' : '/walletnow/');

  return {
    base: basePath,
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Sem sourcemaps em produção (segurança + tamanho)
      sourcemap: false,
      // Aumentar limite para silenciar warning do chunk monolítico
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          /**
           * manualChunks: separa vendors em chunks independentes.
           * Benefícios:
           * - Cache granular (ex: react não muda entre deploys)
           * - Carregamento paralelo de chunks menores
           * - Evita warning de chunk > 500kB
           */
          manualChunks: {
            // React Router — raramente muda
            'vendor-router': ['react-router-dom'],
            // Stellar SDK — grande, muda raramente
            'vendor-stellar': ['@stellar/stellar-sdk'],
            // Supabase — muda raramente
            'vendor-supabase': ['@supabase/supabase-js'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        // Woovi / OpenPix PIX Gateway (Sprint 9.1)
        // O Authorization é injetado SERVER-SIDE aqui para evitar stripping de headers pelo browser.
        '/api/woovi/pix-payment': {
          target: 'https://api.woovi.com/api/v1/pix/payment',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/woovi\/pix-payment/, ''),
        },
        '/api/woovi': {
          target: 'https://api.woovi-sandbox.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/woovi/, '/api/v1'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // Garante que o header seja setado com o valor limpo do .env
              if (wooviAppId) {
                proxyReq.setHeader('Authorization', wooviAppId);
                proxyReq.setHeader('Content-Type', 'application/json');
              }
            });
          }
        }
      }
    },
  };
});
