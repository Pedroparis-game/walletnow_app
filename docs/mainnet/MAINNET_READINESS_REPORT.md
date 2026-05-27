# WalletNow — Mainnet Readiness Report

**Versão:** 1.0  
**Data:** 2026-05-27  
**Branch:** mainnet-ready-infra  
**Responsável:** Equipe de Engenharia WalletNow  
**Status Geral:** 🟡 EM PREPARAÇÃO — NÃO PRONTO PARA PRODUÇÃO

---

## Resumo Executivo

A WalletNow é uma wallet non-custodial híbrida focada em RWAs e DeFi na rede Stellar, com foco inicial no mercado brasileiro. O produto está funcional em testnet com onboarding via passkey/social login, integração Etherfuse V2 para on/off-ramp PIX ↔ TESOURO, e sistema de KYC baseado em Gemini AI.

Este relatório descreve o estado atual da infraestrutura, os blockers identificados e o roadmap técnico para go-live em mainnet.

---

## Scorecard de Prontidão para Produção

| Área | Score | Status |
|------|-------|--------|
| Segurança de Chaves | 2/10 | 🔴 CRÍTICO |
| Arquitetura de Rede | 7/10 | 🟡 EM PROGRESSO |
| Configuração de Ambiente | 6/10 | 🟡 EM PROGRESSO |
| RLS / Database Security | 5/10 | 🟡 EM PROGRESSO |
| Criptografia de Wallet | 7/10 | 🟡 BOM |
| CORS / API Security | 6/10 | 🟡 EM PROGRESSO |
| KYC / Compliance | 5/10 | 🟡 PARCIAL |
| Observabilidade | 3/10 | 🔴 INSUFICIENTE |
| CI/CD | 1/10 | 🔴 AUSENTE |
| Documentação | 8/10 | 🟢 BOM |

---

## Blockers Críticos para Produção

> [!CAUTION]
> Os itens abaixo bloqueiam completamente o go-live em mainnet. Nenhum destes pode ser ignorado.

### BLOCKER-01 — Issuer Secret Key no Bundle Frontend
- **Risco:** CRÍTICO (CVSS 9.8)
- **Arquivo:** `paymentService.ts`, `walletFactory.ts`, `identityService.ts`
- **Impacto:** Roubo da hot wallet da WalletNow, mintagem fraudulenta de tokens
- **Solução:** Migrar para Edge Function `stellar-issuer` (stub criado)
- **Esforço:** 3-5 dias
- **Status:** 🔴 PENDENTE

### BLOCKER-02 — Gemini API Key no Bundle Frontend
- **Risco:** ALTO (CVSS 7.5)
- **Arquivo:** `identityService.ts`
- **Impacto:** Uso fraudulento da cota de KYC da WalletNow
- **Solução:** Migrar para Edge Function `kyc-validator`
- **Esforço:** 2-3 dias
- **Status:** 🔴 PENDENTE

### BLOCKER-03 — Rede Stellar Hardcoded para Testnet
- **Risco:** ALTO — falha funcional em mainnet
- **Status:** 🟢 RESOLVIDO (branch mainnet-ready-infra)
- **Solução aplicada:** `StellarNetwork` abstraction + `environment.ts`

### BLOCKER-04 — Friendbot em Provisionamento de Carteira
- **Risco:** ALTO — contas não ativadas em mainnet
- **Status:** 🟢 RESOLVIDO (branch mainnet-ready-infra)
- **Solução aplicada:** `StellarNetwork.getFriendbotUrl()` retorna null em mainnet

### BLOCKER-05 — CORS Wildcard na Edge Function
- **Risco:** MÉDIO-ALTO
- **Status:** 🟢 RESOLVIDO (branch mainnet-ready-infra)
- **Solução aplicada:** CORS com allowlist de origens

### BLOCKER-06 — RLS Permissiva em fiat_transactions
- **Risco:** ALTO — acesso a dados de todos os usuários
- **Status:** 🟢 RESOLVIDO (migração 00005_fix_rls_fiat_transactions.sql)

---

## Estado Técnico Atual

### Arquitetura de Wallet
- **Geração de chaves:** ED25519 via Stellar SDK ✅
- **Criptografia local:** AES-GCM com PBKDF2 (100k iterações) ✅
- **Salt por dispositivo:** localStorage (perde ao limpar browser) ⚠️
- **Secret em memória:** `volatileSecret` em módulo global ⚠️
- **Seed phrase:** NÃO implementada ainda 🔴
- **WebAuthn/Passkeys real:** Simulado (não real) ⚠️

### Integração Stellar
- **SDK:** `@stellar/stellar-sdk` v14.6.1 ✅
- **Horizon:** Abstração criada, configurável por env ✅
- **CAP-33 Sponsorship:** Implementado ✅
- **Fee estimation dinâmica:** Não implementada ⚠️
- **Sequence handling:** Delegado ao SDK ✅
- **Retry strategy:** Não implementada ⚠️

### On/Off-Ramp
- **Etherfuse V2:** Integrado em sandbox ✅
- **PIX via Woovi:** Integrado em sandbox ✅
- **Produção Etherfuse:** Pendente credenciais prod ⚠️
- **Rollback atômico (burn fail):** Implementado ✅
- **Anti-duplo processamento:** Lock em memória ⚠️ (não persistente)

---

## Próximos Passos Imediatos (Sprint Mainnet-1)

| Prioridade | Tarefa | Esforço |
|------------|--------|---------|
| 🔴 CRÍTICO | Implementar Edge Function `stellar-issuer` | 3-5 dias |
| 🔴 CRÍTICO | Implementar Edge Function `kyc-validator` | 2-3 dias |
| 🟠 ALTO | Aumentar PBKDF2 para 600k iterações (migração silenciosa) | 1 dia |
| 🟠 ALTO | Implementar seed phrase BIP39 | 3-4 dias |
| 🟠 ALTO | Configurar Sentry para observabilidade | 1 dia |
| 🟡 MÉDIO | CI/CD pipeline básico | 2 dias |
| 🟡 MÉDIO | Testes de integração mainnet em homolog | 5-7 dias |

---

## Estimativa de Go-Live

Com equipe dedicada e os blockers sendo resolvidos em paralelo:

- **Sprint Mainnet-1** (Semana 1-2): Resolver BLOCKER-01 e BLOCKER-02
- **Sprint Mainnet-2** (Semana 3): Homolog em mainnet com usuários internos
- **Sprint Mainnet-3** (Semana 4-5): Beta fechado com 50 usuários
- **Go-Live Mainnet** (Semana 6-8): Produção com funding inicial

---

*Gerado em: 2026-05-27 | Branch: mainnet-ready-infra*
