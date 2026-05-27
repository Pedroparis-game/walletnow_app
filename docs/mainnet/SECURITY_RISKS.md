# WalletNow — Security Risks Register

**Versão:** 1.0 | **Data:** 2026-05-27 | **Branch:** mainnet-ready-infra

> [!CAUTION]
> Este documento cataloga TODOS os riscos de segurança identificados na auditoria arquitetural. Deve ser revisado antes de cada sprint e atualizado quando riscos forem mitigados.

---

## Escala de Severidade (CVSS Aproximado)

| Nível | Score | Impacto |
|-------|-------|---------|
| 🔴 CRÍTICO | 9.0-10.0 | Perda imediata de fundos ou dados de todos usuários |
| 🟠 ALTO | 7.0-8.9 | Perda de fundos de usuários individuais ou dados sensíveis |
| 🟡 MÉDIO | 4.0-6.9 | Degradação de serviço ou exposição parcial |
| 🟢 BAIXO | 0.1-3.9 | Exposição mínima, sem impacto financeiro direto |

---

## RISK-001 — Issuer Secret Key Exposta no Bundle
- **Severidade:** 🔴 CRÍTICO (CVSS ~9.8)
- **Status:** ⚠️ MITIGADO PARCIALMENTE (TODOs adicionados, arquitetura preparada)
- **Localização:** `paymentService.ts`, `walletFactory.ts`, `identityService.ts`
- **Vetor de Ataque:** Acesso público ao bundle JS → extração da chave → operações fraudulentas
- **Impacto:** Mintagem ilimitada de tokens, drenagem da hot wallet treasury, compromisso total do sistema financeiro
- **Mitigação Atual:** TODOs arquiteturais claros, stub `stellar-issuer` Edge Function criado
- **Mitigação Final:** Edge Function `stellar-issuer` com chave em Supabase Vault
- **Prazo:** Antes do go-live mainnet (BLOCKER)

---

## RISK-002 — Gemini API Key Exposta no Bundle
- **Severidade:** 🟠 ALTO (CVSS ~7.5)
- **Status:** ⚠️ MITIGADO PARCIALMENTE (TODOs adicionados)
- **Localização:** `identityService.ts` (linha 21), `.env`
- **Vetor de Ataque:** Extração da API key → uso fraudulento da cota de KYC
- **Impacto:** Custo financeiro (billing da API), possível bloqueio da conta Google, KYC fraudulento
- **Mitigação Final:** Edge Function `kyc-validator` com chave em Supabase Vault
- **Prazo:** Antes do go-live mainnet (BLOCKER)

---

## RISK-003 — CORS Wildcard na Edge Function Etherfuse
- **Severidade:** 🟠 ALTO (CVSS ~7.2)
- **Status:** ✅ RESOLVIDO (branch mainnet-ready-infra)
- **Localização:** `supabase/functions/etherfuse-proxy/index.ts`
- **Solução Aplicada:** CORS com allowlist de origens autorizadas + header `Vary: Origin`
- **Risco Residual:** Origens de preview da Vercel precisam ser adicionadas manualmente

---

## RISK-004 — RLS Permissiva em fiat_transactions
- **Severidade:** 🔴 CRÍTICO (CVSS ~8.5)
- **Status:** ✅ RESOLVIDO (migração 00005_fix_rls_fiat_transactions.sql)
- **Localização:** `supabase/migrations/001_sprint9_transfero_transactions.sql`
- **Problema:** `USING (true) WITH CHECK (true)` permitia acesso total
- **Solução:** Policies granulares por operação, service_role para escrita

---

## RISK-005 — Salt de Criptografia em localStorage
- **Severidade:** 🟠 ALTO (CVSS ~7.0)
- **Status:** 🔴 PENDENTE
- **Localização:** `deviceVault.ts` linha 41
- **Impacto:** Se o localStorage for limpo, o cofre se torna irrecuperável — usuário perde acesso à wallet
- **Cenários de Trigger:** Troca de browser, modo incógnito, reset de dispositivo, limpeza de dados
- **Mitigação Recomendada:** 
  1. Implementar seed phrase BIP39 (12 palavras) como mecanismo primário de recuperação
  2. Backup criptografado do salt em Supabase Storage (com chave derivada da senha do usuário)
  3. Aviso claro na UI sobre o risco de perder o acesso

---

## RISK-006 — PBKDF2 com 100k Iterações (Subótimo)
- **Severidade:** 🟡 MÉDIO (CVSS ~5.5)
- **Status:** 🔴 PENDENTE
- **Localização:** `deviceVault.ts` linha 10
- **Contexto:** NIST SP 800-132 (2023) recomenda mínimo 600.000 para SHA-256
- **Impacto:** Resistência menor a ataques de força bruta offline se o localStorage for comprometido
- **Solução:** 
  1. Aumentar para 600.000 iterações com migração silenciosa
  2. Avaliar Argon2id via WebAssembly para proteção superior

---

## RISK-007 — Demo Mode Ativável via URL
- **Severidade:** 🟡 MÉDIO (CVSS ~4.5)
- **Status:** 🔴 PENDENTE
- **Localização:** `demoMode.ts` linha 14
- **Impacto:** Qualquer usuário pode adicionar `?demo=true` e ativar logs detalhados e QA Panel
- **Solução:** Em produção, ignorar query param `?demo=true` ou remover completamente

---

## RISK-008 — Secret Key em Variável de Módulo Global
- **Severidade:** 🟠 ALTO (CVSS ~7.0)
- **Status:** 🔴 PENDENTE
- **Localização:** `deviceVault.ts` linha 14 — `let volatileSecret: string | null = null`
- **Impacto:** Vulnerável a XSS — qualquer script malicioso pode chamar `DeviceVault.getVolatileSecret()`
- **Solução:** 
  1. Proteger com closure (IIFE) para dificultar acesso externo
  2. Implementar WebAuthn/Passkeys real para nunca manter a secret em memória JS

---

## RISK-009 — Seed Phrase Não Implementada
- **Severidade:** 🟠 ALTO (CVSS ~7.5 — impacto em usuários)
- **Status:** 🔴 PENDENTE
- **Contexto:** O produto promete "revelar 12 palavras em Config > ProMode", mas a seed phrase BIP39 ainda não existe
- **Impacto:** Se o dispositivo for perdido/resetado, o usuário perde TODOS os fundos
- **Solução:** Implementar BIP39 + SLIP-0010 (derivação HD para Stellar)

---

## RISK-010 — Rate Limiting Ausente no Proxy Etherfuse
- **Severidade:** 🟡 MÉDIO (CVSS ~5.0)
- **Status:** 🔴 PENDENTE
- **Localização:** `supabase/functions/etherfuse-proxy/index.ts`
- **Impacto:** Ataque DDoS consome cota da API Etherfuse, gerando custos
- **Solução:** Implementar rate limiting por `user_id` (extraído do JWT) — máx 10 req/min

---

## RISK-011 — Anti-Duplo Processamento em Memória
- **Severidade:** 🟡 MÉDIO (CVSS ~5.5)
- **Status:** 🔴 PENDENTE
- **Localização:** `paymentService.ts` — `const processingLock = new Set<string>()`
- **Impacto:** Em caso de reload da página ou múltiplas abas, o lock é perdido — possível duplo mint/burn
- **Solução:** Persistir o lock em Supabase com TTL (idempotency keys na tabela `fiat_transactions`)

---

## RISK-012 — console.log com Dados Operacionais Sensíveis
- **Severidade:** 🟡 MÉDIO (CVSS ~4.0)
- **Status:** ⚠️ PARCIALMENTE MITIGADO
- **Localização:** `paymentService.ts`, `walletFactory.ts`
- **Impacto:** Logs visíveis no DevTools expõem informações de operações financeiras
- **Solução:** Produção deve desativar todos os logs via `DemoConfig.verboseLogs = false` + verificar Sentry não captura dados sensíveis

---

*Última atualização: 2026-05-27 | Branch: mainnet-ready-infra*
