# WalletNow — Priority Tasks (Roadmap Técnico)

**Versão:** 1.0 | **Data:** 2026-05-27 | **Branch:** mainnet-ready-infra

---

## Sprint Mainnet-1 (Semanas 1-2) — CRÍTICO

Objetivo: Eliminar os 2 blockers de segurança máxima.

### TASK-001 — Implementar Edge Function `stellar-issuer` ⚠️ BLOCKER
**Esforço:** 3-5 dias | **Responsável:** Eng. Backend  
**Descrição:** Mover toda assinatura com ISSUER_SECRET para servidor  
**Arquivos a criar/modificar:**
- `supabase/functions/stellar-issuer/index.ts` (implementar stub)
- `src/services/walletFactory.ts` (remover ISSUER_SECRET, chamar Edge Function)
- `src/services/paymentService.ts` (idem)
- `src/services/identityService.ts` (idem)
- Remover `VITE_STELLAR_ISSUER_SECRET` de todos os `.env`

### TASK-002 — Implementar Edge Function `kyc-validator` ⚠️ BLOCKER
**Esforço:** 2-3 dias | **Responsável:** Eng. Backend  
**Descrição:** Mover chamadas Gemini para servidor  
**Arquivos a criar/modificar:**
- `supabase/functions/kyc-validator/index.ts` (novo)
- `src/services/identityService.ts` (remover ai client, chamar Edge Function)
- Remover `VITE_GEMINI_API_KEY` de todos os `.env`

---

## Sprint Mainnet-2 (Semanas 3-4) — ALTO

Objetivo: Segurança da wallet e observabilidade.

### TASK-003 — Implementar Seed Phrase BIP39
**Esforço:** 3-4 dias  
**Descrição:** Gerar e exibir 12 palavras de recuperação via SLIP-0010  
**Nota:** Requisito de produto já prometido ao usuário

### TASK-004 — Aumentar PBKDF2 para 600k Iterações
**Esforço:** 1 dia  
**Descrição:** Migração silenciosa ao próximo unlock da carteira

### TASK-005 — Configurar Sentry
**Esforço:** 1 dia  
**Descrição:** Error tracking frontend + Edge Functions

### TASK-006 — Rate Limiting no Etherfuse Proxy
**Esforço:** 1 dia  
**Descrição:** Máx 10 req/min por user_id via JWT validation

### TASK-007 — Idempotency Keys em fiat_transactions
**Esforço:** 2 dias  
**Descrição:** Substituir lock em memória por lock persistente no banco

---

## Sprint Mainnet-3 (Semanas 5-6) — MÉDIO

Objetivo: Homolog em mainnet + compliance.

### TASK-008 — Configurar Ambiente Homolog Mainnet
**Esforço:** 1 dia  
**Descrição:** Supabase + Vercel staging com STELLAR_NETWORK=mainnet

### TASK-009 — Testes End-to-End em Mainnet
**Esforço:** 3-5 dias  
**Descrição:** Executar todos os testes do MAINNET_MIGRATION_PLAN.md

### TASK-010 — CI/CD Pipeline
**Esforço:** 2 dias  
**Descrição:** GitHub Actions para lint, test, build validation

### TASK-011 — Documentação Legal (Estrutura)
**Esforço:** 3 dias (com suporte jurídico)  
**Descrição:** ToS, Privacy Policy, Risk Disclosure, KYC Disclosure

### TASK-012 — Headers de Segurança HTTP no Vercel
**Esforço:** 0.5 dia  
**Descrição:** X-Frame-Options, CSP, HSTS via vercel.json

---

## Backlog (Pós-lançamento) — BAIXO

| Task | Descrição | Esforço |
|------|-----------|---------|
| TASK-013 | WebAuthn/Passkeys real (substituir simulação) | 5-8 dias |
| TASK-014 | Recuperação social de seed phrase | 5-8 dias |
| TASK-015 | Argon2id em vez de PBKDF2 | 2 dias |
| TASK-016 | Dashboard de fees coletadas | 2 dias |
| TASK-017 | Multisig para treasury | 5-8 dias |
| TASK-018 | Integração Fireblocks para custody | 10+ dias |
| TASK-019 | Fee estimation dinâmica via Horizon | 1 dia |
| TASK-020 | Retry com exponential backoff nas APIs | 1 dia |

---

## Estimativa Total para Go-Live

| Fase | Esforço | Prazo |
|------|---------|-------|
| Sprint Mainnet-1 (Blockers) | 5-8 dias | Semanas 1-2 |
| Sprint Mainnet-2 (Segurança) | 8-10 dias | Semanas 3-4 |
| Sprint Mainnet-3 (Homolog) | 10-12 dias | Semanas 5-6 |
| Beta Fechado (50 usuários) | 7 dias | Semana 7 |
| **Go-Live Mainnet** | — | **Semana 8** |

---

*Atualizar este documento após cada task concluída.*
