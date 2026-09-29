# WalletNow — Known Issues & Mainnet Preparation

**Data de Atualização:** Setembro de 2026  
**Status do Protocolo:** Testnet Estabilizada & Auditoria Adversarial v2.0 Concluída  

Este documento rastreia os débitos técnicos intencionais e as pendências arquiteturais identificadas durante a fase de validação e sandbox (Testnet Edition). Estes itens representam otimizações e requisitos previstos para o ciclo de produção Mainnet (v1.0.0).

---

## 🛡️ Estado Atual Pós-Auditoria de Segurança (v2.0)

Durante o ciclo de Setembro de 2026, as seguintes vulnerabilidades foram mitigadas com sucesso:
- ✅ **Sanitização de Logs**: Chaves privadas e tokens de autenticação não são mais exfiltrados no console (`logger.ts`).
- ✅ **Políticas RLS**: O banco Supabase conta com Row Level Security ativo, impedindo leitura/escrita não autorizada.
- ✅ **Garantia de Idempotência**: Inserção de `correlation_id` para transações fiat em `fiat_transactions`.
- ✅ **Privacidade LGPD/GDPR**: Hashes SHA3-256 criptográficos com salt secreto para dados pessoais.

---

## 🚨 Itens de Transição para Mainnet (V1.0 Roadmap)

Estes itens fazem parte do plano de transição da Testnet para a Mainnet:

1. **`walletFactory.ts` & `paymentService.ts`**:
   - Atualmente, as transações na Testnet utilizam uma conta patrocinadora direta da WalletNow.
   - Na Mainnet, a delegação de taxas (Fee Bump) via CAP-33 exigirá uma infraestrutura dedicada de *Fee Sponsorship* com cotas automáticas por usuário e monitor de liquidez de XLM.
2. **`environment.ts`**:
   - Chamadas de inteligência artificial Gemini deverão ser roteadas 100% via Supabase Edge Functions para preservação de chaves em backend seguro.
   - Desativação completa de quaisquer parâmetros de debug (`?demo=true`) no ambiente de produção final.
3. **`stellarNetwork.ts`**:
   - Na Mainnet, contratar nós Horizon/Soroban RPC privados de alta redundância (via SDF Enterprise Partners / Blockdaemon) para evitar rate limits públicos.
   - Migração do cálculo de taxas estático para consumo dinâmico do endpoint `/fee_stats` do Horizon.
4. **`transferoService.ts` & Gateways**:
   - Integração final de Cash-Out regulado com parceiros bancários em conformidade com o Banco Central do Brasil.
5. **Observabilidade Enterprise**:
   - Conectar o logger unificado a plataformas como Sentry e Datadog para alertas proativos em tempo real.

---
*Documento de controle e governança técnica do WalletNow Protocol — Setembro de 2026.*
